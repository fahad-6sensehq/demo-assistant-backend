import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssistantModule } from '../assistant/assistant.module';
import { OpenaiModule } from '../openai/openai.module';
import { Message, MessageSchema } from '../schemas/message.entity';
import {
  UserAssistant,
  UserAssistantSchema,
} from '../schemas/user-assistant.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UserAssistantService } from './user-assistant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAssistant.name, schema: UserAssistantSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    AssistantModule,
    OpenaiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, UserAssistantService],
  exports: [ChatService, UserAssistantService],
})
export class ChatModule {}
