import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Document, DocumentDocument } from '../schemas/document.entity';
import {
  EMBEDDING_DIMENSIONS,
  VECTOR_INDEX_NAME,
} from './utils/embeddings.constants';

@Injectable()
export class VectorIndexService implements OnModuleInit {
  private readonly logger = new Logger(VectorIndexService.name);

  constructor(
    @InjectModel(Document.name)
    private readonly documentModel: Model<DocumentDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureVectorIndex();
  }

  async ensureVectorIndex(): Promise<void> {
    const collection = this.documentModel.collection;

    try {
      const existingIndexes = await collection.listSearchIndexes().toArray();
      const indexExists = existingIndexes.some(
        (index) => index.name === VECTOR_INDEX_NAME,
      );

      if (indexExists) {
        this.logger.log(
          `Vector search index "${VECTOR_INDEX_NAME}" already exists`,
        );
        return;
      }

      await collection.createSearchIndex({
        name: VECTOR_INDEX_NAME,
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'content_embedding',
              numDimensions: EMBEDDING_DIMENSIONS,
              similarity: 'cosine',
            },
            {
              type: 'filter',
              path: 'userId',
            },
          ],
        },
      });

      this.logger.log(
        `Vector search index "${VECTOR_INDEX_NAME}" creation started. Atlas may take 1-5 minutes before queries return results.`,
      );
    } catch (error) {
      this.logger.warn(
        `Could not create vector search index: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Vector search requires MongoDB Atlas with Search enabled.`,
      );
    }
  }
}
