import { ReserveStockDto } from './dto/reserve-stock.dto';
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
import { CreateOrderDto } from './dto/create-order.dto';
import { RejectOrderDto } from './dto/reject-order.dto';

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
    @Request() req: any,
  ) {
    return this.ordersService.updateStatusByAdmin(id, body.status, req.user.id);
  }

  @Post('admin/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async approveOrder(@Param('id') id: string) {
    return this.ordersService.approveOrderByAdmin(id);
  }

  @Post('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async rejectOrder(
    @Param('id') id: string,
    @Body() body: RejectOrderDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.ordersService.rejectOrderByAdmin(id, body.reason, req.user.id);
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

  @Get('admin/:id/stock-options') @UseGuards(RolesGuard) @Roles('ADMIN', 'SUPER_ADMIN')
  stockOptions(@Param('id') id: string) { return this.ordersService.stockOptions(id); }
  @Post('admin/:id/reserve-stock') @UseGuards(RolesGuard) @Roles('ADMIN', 'SUPER_ADMIN')
  reserveStock(@Param('id') id: string, @Body() body: ReserveStockDto, @Request() req: any) { return this.ordersService.reserveStock(id, body.inventoryId, req.user.id); }
  /** Legacy repair: an order marked picked up / in transit without any delivery record goes back to dispatch. */
  @Post('admin/:id/reopen-dispatch') @UseGuards(RolesGuard) @Roles('ADMIN', 'SUPER_ADMIN')
  reopenDispatch(@Param('id') id: string, @Request() req: any) { return this.ordersService.reopenForDispatch(id, req.user.id); }
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: any) { return this.ordersService.cancelByBuyer(id, req.user.id); }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('BUYER', 'ADMIN', 'SUPER_ADMIN')
  async create(@Body() body: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.ordersService.findAllByBuyer(req.user.id);
  }

  /** Orders fulfilled from the caller's estates (producer app "Porudžbine"). */
  @Get('grower')
  @UseGuards(RolesGuard)
  @Roles('GROWER', 'FARMER')
  async findForGrower(@Request() req: any, @Query('queue') queue?: string) {
    return this.ordersService.findAllForGrower(req.user.id, queue);
  }

  @Patch('grower/:id/packing')
  @UseGuards(RolesGuard)
  @Roles('GROWER', 'FARMER')
  async recordGrowerPacking(
    @Param('id') id: string,
    @Body() body: { packedPackCount: number; packedKg?: number },
    @Request() req: any,
  ) {
    return this.ordersService.recordGrowerPacking(req.user.id, id, body);
  }

  @Get('checkout/:requestId')
  findByCheckout(@Param('requestId') requestId: string, @Request() req: any) {
    return this.ordersService.findByCheckoutRequest(requestId, req.user.id);
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
