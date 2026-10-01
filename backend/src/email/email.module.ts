import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
