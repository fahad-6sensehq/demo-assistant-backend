import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

/**
 * Stores chunked document text and its vector embedding for retrieval.
 * One uploaded file typically produces many Documents (chunks).
 */
@Schema({
  timestamps: true,
})
export class Document {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'UserFile',
    required: true,
    index: true,
  })
  userFileId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Number, required: true })
  chunkIndex: number;

  // Store vector embeddings as an array of numbers
  @Prop({ type: [Number], required: true })
  content_embedding: number[];

  createdAt: Date;
  updatedAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
export type DocumentDocument = HydratedDocument<Document>;
