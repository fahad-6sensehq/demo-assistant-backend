import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,
})
export class UserAssistant {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Assistant' })
  assistantId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: false, default: null })
  lastResponseId: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserAssistantSchema = SchemaFactory.createForClass(UserAssistant);
export type UserAssistantDocument = HydratedDocument<UserAssistant>;
