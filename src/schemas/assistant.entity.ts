import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Assistant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  instructions: string;

  @Prop({ required: true, default: 'gpt-4.1-mini' })
  aiModel: string;
}

export const AssistantSchema = SchemaFactory.createForClass(Assistant);
export type AssistantDocument = HydratedDocument<Assistant>;
