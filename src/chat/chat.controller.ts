import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getHistory(@CurrentUser() user: AuthUser) {
    return this.chatService.getHistory(user.userId);
  }

  @Post('messages')
  sendMessage(@CurrentUser() user: AuthUser, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.userId, dto.content);
  }
}
