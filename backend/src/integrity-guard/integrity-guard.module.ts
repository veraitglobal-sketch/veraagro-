import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { IntegrityGuardService } from './integrity-guard.service';
import { GpsValidatorService } from './gps-validator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule, 
    NotificationsModule,
    CacheModule.register(),
  ],
  providers: [IntegrityGuardService, GpsValidatorService],
  exports: [IntegrityGuardService, GpsValidatorService],
})
export class IntegrityGuardModule {}
