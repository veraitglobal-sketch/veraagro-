import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  /** Buyer: report quality / handling issue with mandatory photos; only within 24h of recorded receipt. */
  @Post('buyer/report-issue')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async reportBuyerDeliveryIssue(
    @Request() req: any,
    @Body() body: { deliveryId: string; description: string; photosBase64: string[] },
  ) {
    return this.deliveriesService.reportBuyerDeliveryIssue(req.user.id, body);
  }

  /** After warehouse digital handover: buyer confirms physical takeover (starts 24h issue window). */
  @Post('buyer/confirm-pickup')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async confirmBuyerPickup(@Request() req: any, @Body() body: { deliveryId: string }) {
    return this.deliveriesService.confirmBuyerPickup(body.deliveryId, req.user.id);
  }

  @Post('assign')
  async assignDelivery(
    @Body() body: { orderId: string; driverId: string },
    @Request() req: any,
  ) {
    // Only admin or partner can assign
    if (req.user.role !== 'ADMIN' && req.user.role !== 'PARTNER') {
      throw new Error('Access denied');
    }
    return this.deliveriesService.assignDelivery(body.orderId, body.driverId);
  }

  @Post(':id/pickup')
  async markPickedUp(@Param('id') id: string, @Request() req: any) {
    return this.deliveriesService.markPickedUp(id, req.user.id);
  }

  @Post(':id/in-transit')
  async markInTransit(@Param('id') id: string, @Request() req: any) {
    return this.deliveriesService.markInTransit(id, req.user.id);
  }

  @Post('confirm/:qrCode')
  async confirmDelivery(@Param('qrCode') qrCode: string, @Request() req: any) {
    return this.deliveriesService.confirmDelivery(qrCode, req.user.id);
  }

  @Get('qr/:qrCode')
  async getDeliveryByQR(@Param('qrCode') qrCode: string) {
    return this.deliveriesService.getDeliveryByQR(qrCode);
  }

  @Get('driver/my-deliveries')
  async getDriverDeliveries(@Request() req: any) {
    return this.deliveriesService.getDriverDeliveries(req.user.id);
  }

  @Get('buyer/my-deliveries')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async getBuyerDeliveries(
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    return this.deliveriesService.getBuyerDeliveries(req.user.id, status);
  }

  @Get('buyer/order/:orderId')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async getDeliveryByOrder(@Param('orderId') orderId: string, @Request() req: any) {
    return this.deliveriesService.getDeliveryByOrder(orderId, req.user.id);
  }
}
