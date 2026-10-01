import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { PushNotificationService } from './push-notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [NotificationsService, NotificationsGateway, PushNotificationService, NotificationTemplateService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationsGateway, PushNotificationService, NotificationTemplateService],
})
export class NotificationsModule {}
