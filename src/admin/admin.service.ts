import { Injectable } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { UserAssistantService } from '../chat/user-assistant.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly chatService: ChatService,
    private readonly userAssistantService: UserAssistantService,
  ) {}

  async listUsers() {
    const isAdmin = false;
    const users = (await this.usersService.findAll()).filter(
      (user) => user.isAdmin === isAdmin,
    );

    return users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    }));
  }

  async getUserChat(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }

    const chat = await this.chatService.getMessagesByUserId(userId);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      conversationId: chat.conversationId,
      messages: chat.messages,
    };
  }

  async listChats() {
    const conversations = await this.userAssistantService.findAll();
    const results = await Promise.all(
      conversations.map(async (conversation) => {
        const user = await this.usersService.findById(
          conversation.userId.toString(),
        );
        const chat = await this.chatService.getMessagesByUserId(
          conversation.userId.toString(),
        );
        const lastMessage = chat.messages.at(-1);

        return {
          conversationId: conversation._id.toString(),
          user: user
            ? {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
              }
            : null,
          messageCount: chat.messages.length,
          lastMessage: lastMessage
            ? {
                role: lastMessage.role,
                content: lastMessage.content,
              }
            : null,
        };
      }),
    );

    return results;
  }
}
