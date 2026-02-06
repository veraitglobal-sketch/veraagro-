import { Controller, Get, Param } from '@nestjs/common';
import { WaybillsService } from './waybills.service';

@Controller('waybills')
export class WaybillsController {
  constructor(private waybillsService: WaybillsService) {}

  @Get('delivery/:deliveryId')
  async getWaybill(@Param('deliveryId') deliveryId: string) {
    return this.waybillsService.getWaybill(deliveryId);
  }
}
