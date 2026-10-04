import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StoredDocumentsModule } from '../stored-documents/stored-documents.module';
import { PassportDocumentsController } from './passport-documents.controller';
import { PassportDocumentsService } from './passport-documents.service';

@Module({
  imports: [PrismaModule, StoredDocumentsModule],
  controllers: [PassportDocumentsController],
  providers: [PassportDocumentsService],
  exports: [PassportDocumentsService],
})
export class PassportDocumentsModule {}
