import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EmbeddingsService } from './embeddings.service';

@Controller('embeddings')
@UseGuards(JwtAuthGuard)
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post('files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.embeddingsService.uploadFile(user.userId, file);
  }

  @Get('files')
  listFiles(@CurrentUser() user: AuthUser) {
    return this.embeddingsService.listUserFiles(user.userId);
  }

  @Delete('files/:fileId')
  deleteFile(@CurrentUser() user: AuthUser, @Param('fileId') fileId: string) {
    return this.embeddingsService.deleteUserFile(user.userId, fileId);
  }
}
