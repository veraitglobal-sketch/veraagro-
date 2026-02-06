import { Module } from '@nestjs/common';
import { SecurityAlertsService } from './security-alerts.service';
import { SecurityAlertsController } from './security-alerts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SecurityAlertsService],
  controllers: [SecurityAlertsController],
  exports: [SecurityAlertsService],
})
export class SecurityAlertsModule {}
