import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { PreOrdersController } from './pre-orders.controller';
import { PreOrdersService } from './pre-orders.service';

@Module({
  imports: [PrismaModule, NotificationsModule, EmailModule],
  controllers: [PreOrdersController],
  providers: [PreOrdersService],
})
export class PreOrdersModule {}
