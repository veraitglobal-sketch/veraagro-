import { Module, forwardRef } from '@nestjs/common';
import { FieldEntriesController } from './field-entries.controller';
import { FieldEntriesService } from './field-entries.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { SmartLockModule } from '../smart-lock/smart-lock.module';
import { ImageResizeModule } from '../common/image/image-resize.module';
import { SeedProductionModule } from '../seed-production/seed-production.module';

@Module({
  imports: [PrismaModule, ComplianceModule, SmartLockModule, ImageResizeModule, forwardRef(() => SeedProductionModule)],
  controllers: [FieldEntriesController],
  providers: [FieldEntriesService],
  exports: [FieldEntriesService],
})
export class FieldEntriesModule {}
