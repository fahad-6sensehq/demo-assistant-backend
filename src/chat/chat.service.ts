import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssistantService } from '../assistant/assistant.service';
import { OpenaiService } from '../openai/openai.service';
import { Message, MessageDocument } from '../schemas/message.entity';
import { UserAssistantService } from './user-assistant.service';

export interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export interface ChatHistoryResponse {
  conversationId: string;
  messages: ChatMessageResponse[];
}

export interface SendMessageResponse {
  reply: ChatMessageResponse;
  messages: ChatMessageResponse[];
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly userAssistantService: UserAssistantService,
    private readonly assistantService: AssistantService,
    private readonly openaiService: OpenaiService,
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

    const aiResponse = await this.openaiService.createResponse({
      model: assistant.aiModel,
      instructions: assistant.instructions,
      input: content,
      previousResponseId: conversation.lastResponseId,
    });

    const assistantMessage = await this.messageModel.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: aiResponse.text,
      openaiResponseId: aiResponse.id,
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

    return {
      reply: this.toMessageResponse(assistantMessage),
      messages: messages.map((message) => this.toMessageResponse(message)),
    };
  }

  async getMessagesByUserId(userId: string): Promise<ChatHistoryResponse> {
    return this.getHistory(userId);
  }

  private toMessageResponse(message: MessageDocument): ChatMessageResponse {
    return {
      id: message._id.toString(),
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}
