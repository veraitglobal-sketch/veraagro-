import { Module } from '@nestjs/common';
import { FieldEntriesController } from './field-entries.controller';
import { FieldEntriesService } from './field-entries.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { ImageResizeModule } from '../common/image/image-resize.module';

@Module({
  imports: [PrismaModule, ComplianceModule, ImageResizeModule],
  controllers: [FieldEntriesController],
  providers: [FieldEntriesService],
  exports: [FieldEntriesService],
})
export class FieldEntriesModule {}
