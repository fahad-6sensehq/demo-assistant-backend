import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

@Schema({ _id: false })
export class MessageSource {
  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  excerpt: string;

  @Prop({ required: true })
  score: number;
}

export const MessageSourceSchema = SchemaFactory.createForClass(MessageSource);

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

  @Prop({ type: [MessageSourceSchema], default: [] })
  sources: MessageSource[];

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type MessageDocument = HydratedDocument<Message>;
