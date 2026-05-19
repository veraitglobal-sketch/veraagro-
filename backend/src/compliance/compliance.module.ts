import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { MaterialBarcodeValidationService } from './material-barcode-validation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SeedsModule } from '../seeds/seeds.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    SeedsModule,
    CacheModule.register({
      ttl: 3600, // 1 hour default TTL
      max: 1000, // Maximum number of items in cache
    }),
  ],
  providers: [ComplianceService, MaterialBarcodeValidationService],
  controllers: [ComplianceController],
  exports: [ComplianceService, MaterialBarcodeValidationService],
})
export class ComplianceModule {}
