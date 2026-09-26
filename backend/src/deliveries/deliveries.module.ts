import { ReturnDispositionService } from './return-disposition.service';
import { RefundReconciliationService } from './refund-reconciliation.service';
import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { WaybillsModule } from '../waybills/waybills.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';

@Module({
  imports: [PrismaModule, PaymentsModule, InvoicesModule, WaybillsModule, NotificationsModule],
  providers: [ReturnDispositionService, DeliveriesService, ReturnsService, RefundReconciliationService],
  controllers: [DeliveriesController, ReturnsController],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
