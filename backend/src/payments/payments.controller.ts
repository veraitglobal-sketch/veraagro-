import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('order/:orderId')
  async getPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.getPayment(orderId);
  }

  @Post('order/:orderId/release')
  async releasePayment(@Param('orderId') orderId: string) {
    return this.paymentsService.releaseEscrowPayment(orderId);
  }
}
