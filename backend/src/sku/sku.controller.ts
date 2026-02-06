import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SkuService } from './sku.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sku')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'GROWER', 'BUYER')
  async getAllSkus() {
    return this.skuService.getAllSkus();
  }

  @Get(':skuCode')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'GROWER', 'BUYER')
  async getSkuByCode(@Param('skuCode') skuCode: string) {
    return this.skuService.getSkuByCode(skuCode);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  async createOrUpdateSku(@Body() sku: any) {
    return this.skuService.createOrUpdateSku(sku);
  }
}
