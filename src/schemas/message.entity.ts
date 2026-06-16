import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

@Schema({
  timestamps: true,
})
export class Message {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'UserAssistant',
    required: true,
    index: true,
  })
  conversationId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: MessageRole;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, default: null })
  openaiResponseId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type MessageDocument = HydratedDocument<Message>;
