import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpenaiModule } from '../openai/openai.module';
import { Document, DocumentSchema } from '../schemas/document.entity';
import { UserFile, UserFileSchema } from '../schemas/user-file.entity';
import { EmbeddingsController } from './embeddings.controller';
import { EmbeddingsService } from './embeddings.service';
import { VectorIndexService } from './vector-index.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserFile.name, schema: UserFileSchema },
      { name: Document.name, schema: DocumentSchema },
    ]),
    OpenaiModule,
  ],
  controllers: [EmbeddingsController],
  providers: [EmbeddingsService, VectorIndexService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
