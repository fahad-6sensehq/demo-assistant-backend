import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserAssistant,
  UserAssistantDocument,
} from '../schemas/user-assistant.entity';

@Injectable()
export class UserAssistantService {
  constructor(
    @InjectModel(UserAssistant.name)
    private userAssistantModel: Model<UserAssistantDocument>,
  ) {}

  async findByUserId(userId: string): Promise<UserAssistantDocument | null> {
    return this.userAssistantModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async findOrCreate(
    userId: string,
    assistantId: Types.ObjectId,
  ): Promise<UserAssistantDocument> {
    const conversation = await this.userAssistantModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
            assistantId,
            lastResponseId: null,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .exec();

    if (!conversation) {
      throw new Error('Failed to create conversation');
    }

    return conversation;
  }

  async updateLastResponseId(
    conversationId: Types.ObjectId,
    lastResponseId: string,
  ): Promise<void> {
    await this.userAssistantModel
      .updateOne({ _id: conversationId }, { lastResponseId })
      .exec();
  }

  async findAll(): Promise<UserAssistantDocument[]> {
    return this.userAssistantModel.find().exec();
  }
}
