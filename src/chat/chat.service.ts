import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssistantService } from '../assistant/assistant.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { OpenaiService } from '../openai/openai.service';
import {
  Message,
  MessageDocument,
  MessageSource,
} from '../schemas/message.entity';
import { buildRagInput } from './rag-citation.prompt';
import { UserAssistantService } from './user-assistant.service';

export interface MessageSourceResponse {
  index: number;
  fileId: string;
  fileName: string;
  excerpt: string;
  score: number;
}

export interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  sources?: MessageSourceResponse[];
  createdAt: Date;
}

export interface ChatHistoryResponse {
  conversationId: string;
  messages: ChatMessageResponse[];
}

export interface SendMessageResponse {
  reply: ChatMessageResponse;
  sources: MessageSourceResponse[];
  messages: ChatMessageResponse[];
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly userAssistantService: UserAssistantService,
    private readonly assistantService: AssistantService,
    private readonly openaiService: OpenaiService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async getHistory(userId: string): Promise<ChatHistoryResponse> {
    const conversation = await this.userAssistantService.findByUserId(userId);

    if (!conversation) {
      return { conversationId: '', messages: [] };
    }

    const messages = await this.messageModel
      .find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .exec();

    return {
      conversationId: conversation._id.toString(),
      messages: messages.map((message) => this.toMessageResponse(message)),
    };
  }

  async sendMessage(
    userId: string,
    content: string,
  ): Promise<SendMessageResponse> {
    const assistant = await this.assistantService.getDefault();
    const conversation = await this.userAssistantService.findOrCreate(
      userId,
      assistant._id,
    );

    await this.messageModel.create({
      conversationId: conversation._id,
      role: 'user',
      content,
      openaiResponseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const retrieval = await this.embeddingsService.retrieve(userId, content);
    console.log('retrieval', JSON.stringify(retrieval, null, 2));

    const input = retrieval.context
      ? buildRagInput(retrieval.context, content)
      : content;

    const aiResponse = await this.openaiService.createResponse({
      model: assistant.aiModel,
      instructions: assistant.instructions,
      input,
      previousResponseId: conversation.lastResponseId,
    });

    const assistantMessage = await this.messageModel.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: aiResponse.text,
      openaiResponseId: aiResponse.id,
      sources: retrieval.sources,
      updatedAt: new Date(),
    });

    await this.userAssistantService.updateLastResponseId(
      conversation._id,
      aiResponse.id,
    );

    const messages = await this.messageModel
      .find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .exec();

    const reply = this.toMessageResponse(assistantMessage);

    return {
      reply,
      sources: reply.sources ?? [],
      messages: messages.map((message) => this.toMessageResponse(message)),
    };
  }

  async getMessagesByUserId(userId: string): Promise<ChatHistoryResponse> {
    return this.getHistory(userId);
  }

  private toMessageResponse(message: MessageDocument): ChatMessageResponse {
    const response: ChatMessageResponse = {
      id: message._id.toString(),
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    };

    if (message.role === 'assistant' && message.sources?.length > 0) {
      response.sources = message.sources.map((source) =>
        this.toSourceResponse(source),
      );
    }

    return response;
  }

  private toSourceResponse(source: MessageSource): MessageSourceResponse {
    return {
      index: source.index,
      fileId: source.fileId,
      fileName: source.fileName,
      excerpt: source.excerpt,
      score: source.score,
    };
  }
}
