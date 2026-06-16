import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Assistant, AssistantDocument } from '../schemas/assistant.entity';

@Injectable()
export class AssistantService implements OnModuleInit {
  constructor(
    @InjectModel(Assistant.name)
    private assistantModel: Model<AssistantDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.assistantModel.countDocuments();
    if (count === 0) {
      await this.assistantModel.findOneAndUpdate(
        { name: 'Default Assistant' },
        {
          $setOnInsert: {
            name: 'Default Assistant',
            instructions:
              'You are a helpful AI assistant with access to Codacy repository analysis tools. Answer clearly and concisely. When users ask about code quality, coverage, or repository health, use the get_codacy_score tool with their repository URL.',
            aiModel: 'gpt-4.1-mini',
          },
        },
        { upsert: true, returnDocument: 'after' },
      );
    }
  }

  async getDefault(): Promise<AssistantDocument> {
    const assistant = await this.assistantModel.findOne().exec();
    if (!assistant) {
      throw new Error('No assistant configured');
    }
    return assistant;
  }
}
