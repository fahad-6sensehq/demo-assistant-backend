import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { ToolCallModule } from './tool-call/tool-call.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL ?? ''),
    AuthModule,
    UsersModule,
    ChatModule,
    EmbeddingsModule,
    AdminModule,
    ToolCallModule,
  ],
})
export class AppModule {}
