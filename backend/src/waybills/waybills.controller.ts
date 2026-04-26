import { Controller, Get, Param, Request, UseGuards, StreamableFile, Header } from '@nestjs/common';
import { WaybillsService } from './waybills.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('waybills')
export class WaybillsController {
  constructor(private waybillsService: WaybillsService) {}

  @Get('document/:id/pdf')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'application/pdf')
  async getWaybillPdf(@Param('id') id: string, @Request() req: { user: { id: string; roles?: string[] } }) {
    await this.waybillsService.assertUserCanReadWaybill(id, req.user);
    const buffer = await this.waybillsService.getWaybillPdfBuffer(id);
    return new StreamableFile(buffer, { type: 'application/pdf', disposition: `inline; filename="waybill-${id}.pdf"` });
  }

  @Get('delivery/:deliveryId')
  async getWaybill(@Param('deliveryId') deliveryId: string) {
    return this.waybillsService.getWaybill(deliveryId);
  }
}
