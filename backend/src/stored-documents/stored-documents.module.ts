import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StoredDocumentsService } from './stored-documents.service';
import { StoredDocumentsController } from './stored-documents.controller';

@Module({
  imports: [PrismaModule],
  providers: [StoredDocumentsService],
  controllers: [StoredDocumentsController],
  exports: [StoredDocumentsService],
})
export class StoredDocumentsModule {}
