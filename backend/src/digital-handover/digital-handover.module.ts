import { Module, forwardRef } from '@nestjs/common';
import { DigitalHandoverController } from './digital-handover.controller';
import { DigitalHandoverService } from './digital-handover.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [DigitalHandoverController],
  providers: [DigitalHandoverService],
  exports: [DigitalHandoverService],
})
export class DigitalHandoverModule {}
