import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Assistant, AssistantSchema } from '../schemas/assistant.entity';
import { AssistantService } from './assistant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assistant.name, schema: AssistantSchema },
    ]),
  ],
  providers: [AssistantService],
  exports: [AssistantService],
})
export class AssistantModule {}
