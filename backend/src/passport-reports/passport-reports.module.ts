import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StoredDocumentsModule } from '../stored-documents/stored-documents.module';
import { PassportReportsController } from './passport-reports.controller';
import { PassportReportsService } from './passport-reports.service';

@Module({
  imports: [PrismaModule, StoredDocumentsModule],
  controllers: [PassportReportsController],
  providers: [PassportReportsService],
  exports: [PassportReportsService],
})
export class PassportReportsModule {}
