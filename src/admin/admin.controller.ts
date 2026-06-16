import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Get('users/:userId/chat')
  async getUserChat(@Param('userId') userId: string) {
    const chat = await this.adminService.getUserChat(userId);
    if (!chat) {
      throw new NotFoundException('User not found');
    }
    return chat;
  }

  @Get('chats')
  listChats() {
    return this.adminService.listChats();
  }
}
