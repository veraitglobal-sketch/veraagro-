import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Admin — before @Get(':id') so /orders/admin/* is not captured as an id
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAllOrders(
    @Query('status') status?: string,
    @Query('buyerId') buyerId?: string,
    @Query('estateId') estateId?: string,
  ) {
    return this.ordersService.findAll({ status, buyerId, estateId });
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.ordersService.updateStatusByAdmin(id, body.status);
  }

  @Post('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async approveOrder(@Param('id') id: string) {
    return this.ordersService.approveOrderByAdmin(id);
  }

  /** Bookkeeping: wire received on BioVera account → IN_ESCROW + order PAID (then logistics can assign delivery) */
  @Post('admin/:id/confirm-bank-payment')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async confirmBankPayment(
    @Param('id') id: string,
    @Body() body: { transactionId?: string },
  ) {
    return this.ordersService.confirmBankPaymentByAdmin(id, body);
  }

  @Patch('admin/:id/fulfillment')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateOrderFulfillment(
    @Param('id') id: string,
    @Body() body: { fulfillingEstateId: string | null },
  ) {
    return this.ordersService.updateFulfillmentByAdmin(
      id,
      body.fulfillingEstateId ?? null,
    );
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.ordersService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.ordersService.findAllByBuyer(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Post(':id/pay')
  async initiatePayment(
    @Param('id') id: string,
    @Body() body: { paymentMethod: string; transactionId?: string },
    @Request() req: any,
  ) {
    return this.ordersService.initiatePayment(id, req.user.id, body);
  }
}
