import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('order/:orderId')
  async getPayment(@Param('orderId') orderId: string, @Request() req) {
    return this.paymentsService.getPayment(orderId, req.user);
  }

  @Post('order/:orderId/release')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async releasePayment(@Param('orderId') orderId: string) {
    return this.paymentsService.releaseEscrowPayment(orderId);
  }
}
