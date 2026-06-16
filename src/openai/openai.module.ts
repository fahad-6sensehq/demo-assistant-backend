import { Module } from '@nestjs/common';
import { ToolCallModule } from '../tool-call/tool-call.module';
import { OpenaiService } from './openai.service';

@Module({
  imports: [ToolCallModule],
  providers: [OpenaiService],
  exports: [OpenaiService],
})
export class OpenaiModule {}
