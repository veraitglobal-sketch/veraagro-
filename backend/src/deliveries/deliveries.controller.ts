import { LinkMissionDeliveryDto, ReviewDeliveryDto } from './dto/delivery-workflow.dto';
import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConfirmBuyerDeliveryDto, ReportBuyerDeliveryIssueDto } from './dto/buyer-delivery.dto';

@Controller('deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  @Get('admin/link-options')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  linkOptions() { return this.deliveriesService.getLinkOptions(); }

  @Post('admin/link-mission')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  linkMission(@Request() req: any, @Body() dto: LinkMissionDeliveryDto) {
    return this.deliveriesService.linkMission(req.user.id, dto.missionId, dto.orderId);
  }

  @Post('admin/review/:kind/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  review(@Request() req: any, @Param('kind') kind: string, @Param('id') id: string, @Body() dto: ReviewDeliveryDto) {
    return this.deliveriesService.review(req.user.id, kind, id, dto);
  }

  @Get('admin/review-inbox')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async reviewInbox() {
    return this.deliveriesService.getDeliveryReviewInbox();
  }

  @Get('admin/review/:kind/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async reviewEvidence(@Param('kind') kind: string, @Param('id') id: string) {
    return this.deliveriesService.getDeliveryReviewEvidence(kind, id);
  }

  /** Buyer: report quality / handling issue with mandatory photos; only within 24h of recorded receipt. */
  @Post('buyer/report-issue')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async reportBuyerDeliveryIssue(
    @Request() req: any,
    @Body() body: ReportBuyerDeliveryIssueDto,
  ) {
    return this.deliveriesService.reportBuyerDeliveryIssue(req.user.id, body);
  }

  /** After warehouse digital handover: buyer confirms physical takeover (starts 24h issue window). */
  @Post('buyer/confirm-pickup')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async confirmBuyerPickup(@Request() req: any, @Body() body: ConfirmBuyerDeliveryDto) {
    return this.deliveriesService.confirmBuyerPickup(body.deliveryId, req.user.id);
  }

  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'PARTNER', 'LOGISTICS_PARTNER')
  async assignDelivery(
    @Body() body: { orderId: string; driverId: string },
    @Request() req: any,
  ) {
    // DRIVER is a legacy alias of LOGISTICS_PARTNER in RolesGuard, but may not
    // assign deliveries. Require an explicit dispatcher/administrator role here.
    if (!req.user.roles.some((role: string) => ['ADMIN', 'SUPER_ADMIN', 'PARTNER', 'LOGISTICS_PARTNER'].includes(role))) {
      throw new ForbiddenException('Delivery assignment requires dispatcher access');
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

  @Get('buyer/shipment/:deliveryId')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async buyerShipment(@Param('deliveryId') id: string, @Request() req: any) {
    return this.deliveriesService.getBuyerShipment(id, req.user.id);
  }

  @Get('buyer/order/:orderId')
  @UseGuards(RolesGuard)
  @Roles('BUYER')
  async getDeliveryByOrder(@Param('orderId') orderId: string, @Request() req: any) {
    return this.deliveriesService.getDeliveryByOrder(orderId, req.user.id);
  }
}
