import { Module } from '@nestjs/common';
import { CodacyService } from './codacy.service';
import { ToolCallService } from './tool-call.service';

@Module({
  providers: [CodacyService, ToolCallService],
  exports: [ToolCallService, CodacyService],
})
export class ToolCallModule {}
