import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type UserFileStatus = 'processing' | 'ready' | 'failed';

@Schema({
  timestamps: true,
})
export class UserFile {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  sizeBytes: number;

  @Prop({ required: true, enum: ['processing', 'ready', 'failed'] })
  status: UserFileStatus;

  @Prop({ type: String, default: null })
  failureReason: string | null;

  @Prop({ type: Number, default: 0 })
  chunkCount: number;

  @Prop({ type: Number, default: 0 })
  extractedTextLength: number;

  createdAt: Date;
  updatedAt: Date;
}

export const UserFileSchema = SchemaFactory.createForClass(UserFile);
export type UserFileDocument = HydratedDocument<UserFile>;
