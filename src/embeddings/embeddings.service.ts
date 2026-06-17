/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { OpenaiService } from '../openai/openai.service';
import { Document, DocumentDocument } from '../schemas/document.entity';
import { UserFile, UserFileDocument } from '../schemas/user-file.entity';
import type { RetrievalResult, RetrievedSource } from './types/retrieval.types';
import {
  MIN_VECTOR_SEARCH_SCORE,
  VECTOR_INDEX_NAME,
  VECTOR_NUM_CANDIDATES,
  VECTOR_SEARCH_LIMIT,
} from './utils/embeddings.constants';
import { chunkText } from './utils/text-chunking.util';
import {
  extractTextFromFile,
  isSupportedMimeType,
} from './utils/text-extraction.util';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SOURCE_EXCERPT_LENGTH = 200;

export interface UserFileResponse {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  failureReason: string | null;
  chunkCount: number;
  extractedTextLength: number;
  createdAt: Date;
  updatedAt: Date;
}

interface RankedChunk {
  fileId: string;
  fileName: string;
  content: string;
  score: number;
}

interface ConsolidatedSource {
  source: RetrievedSource;
  content: string;
}

interface VectorSearchResult {
  title: string;
  userFileId: mongoose.Types.ObjectId;
  content: string;
  score: number;
}

@Injectable()
export class EmbeddingsService {
  constructor(
    @InjectModel(UserFile.name)
    private readonly userFileModel: Model<UserFileDocument>,
    @InjectModel(Document.name)
    private readonly documentModel: Model<DocumentDocument>,
    private readonly openaiService: OpenaiService,
  ) {}

  async uploadFile(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserFileResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (
      file &&
      typeof file.size === 'number' &&
      file.size > MAX_FILE_SIZE_BYTES
    ) {
      throw new BadRequestException('File exceeds the 10MB size limit');
    }

    if (
      file &&
      typeof file.mimetype === 'string' &&
      !isSupportedMimeType(file.mimetype)
    ) {
      throw new BadRequestException(
        'Unsupported file type. Upload PDF, DOCX, or TXT files.',
      );
    }

    const userFile = await this.userFileModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      status: 'processing',
      failureReason: null,
      chunkCount: 0,
      extractedTextLength: 0,
    });

    try {
      const text = await extractTextFromFile(file.buffer, file.mimetype);

      if (!text) {
        throw new BadRequestException(
          'No text could be extracted from the file',
        );
      }

      const chunks = chunkText(text);

      if (chunks.length === 0) {
        throw new BadRequestException('No embeddable text found in the file');
      }

      const embeddings = await this.openaiService.createEmbeddings(chunks);

      await this.documentModel.insertMany(
        chunks.map((content, chunkIndex) => ({
          userId: new mongoose.Types.ObjectId(userId),
          userFileId: userFile._id,
          title: file.originalname,
          content,
          chunkIndex,
          content_embedding: embeddings[chunkIndex],
        })),
      );

      userFile.status = 'ready';
      userFile.chunkCount = chunks.length;
      userFile.extractedTextLength = text.length;
      await userFile.save();

      return this.toUserFileResponse(userFile);
    } catch (error) {
      userFile.status = 'failed';
      userFile.failureReason =
        error instanceof Error ? error.message : 'Failed to process file';
      await userFile.save();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(userFile.failureReason);
    }
  }

  async listUserFiles(userId: string): Promise<UserFileResponse[]> {
    const files = await this.userFileModel
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    return files.map((file) => this.toUserFileResponse(file));
  }

  async deleteUserFile(userId: string, fileId: string): Promise<void> {
    const userFile = await this.userFileModel.findOne({
      _id: new mongoose.Types.ObjectId(fileId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!userFile) {
      throw new NotFoundException('File not found');
    }

    await this.documentModel.deleteMany({ userFileId: userFile._id });
    await userFile.deleteOne();
  }

  async retrieve(userId: string, query: string): Promise<RetrievalResult> {
    const queryVector = await this.openaiService.createEmbedding(query);
    const chunks = await this.performVectorSearch(userId, queryVector);

    if (chunks.length === 0) {
      return { context: '', sources: [] };
    }

    const consolidated = this.consolidateByFile(chunks);

    return {
      context: this.formatContext(consolidated),
      sources: consolidated.map((item) => item.source),
    };
  }

  private consolidateByFile(chunks: RankedChunk[]): ConsolidatedSource[] {
    const grouped = new Map<string, RankedChunk[]>();

    for (const chunk of chunks) {
      const existing = grouped.get(chunk.fileId) ?? [];
      existing.push(chunk);
      grouped.set(chunk.fileId, existing);
    }

    return Array.from(grouped.values()).map((fileChunks, index) => {
      const topChunk = fileChunks.reduce((best, chunk) =>
        chunk.score > best.score ? chunk : best,
      );

      return {
        source: {
          index: index + 1,
          fileId: topChunk.fileId,
          fileName: topChunk.fileName,
          excerpt: this.toExcerpt(topChunk.content),
          score: topChunk.score,
        },
        content: fileChunks.map((chunk) => chunk.content).join('\n\n'),
      };
    });
  }

  private async performVectorSearch(
    userId: string,
    queryVector: number[],
  ): Promise<RankedChunk[]> {
    const results = await this.documentModel.aggregate<VectorSearchResult>([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: 'content_embedding',
          queryVector,
          numCandidates: VECTOR_NUM_CANDIDATES,
          limit: VECTOR_SEARCH_LIMIT,
          filter: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
      },
      {
        $project: {
          title: 1,
          userFileId: 1,
          content: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return results
      .filter((result) => result.score >= MIN_VECTOR_SEARCH_SCORE)
      .map((result) => ({
        fileId: result.userFileId.toString(),
        fileName: result.title,
        content: result.content,
        score: result.score,
      }));
  }

  private formatContext(consolidated: ConsolidatedSource[]): string {
    return consolidated
      .map((item) => `[Source ${item.source.index}]\n${item.content}`)
      .join('\n\n');
  }

  private toExcerpt(content: string): string {
    const normalized = content.replace(/\s+/g, ' ').trim();

    if (normalized.length <= SOURCE_EXCERPT_LENGTH) {
      return normalized;
    }

    return `${normalized.slice(0, SOURCE_EXCERPT_LENGTH)}...`;
  }

  private toUserFileResponse(file: UserFileDocument): UserFileResponse {
    return {
      id: file._id.toString(),
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      status: file.status,
      failureReason: file.failureReason,
      chunkCount: file.chunkCount,
      extractedTextLength: file.extractedTextLength,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}
