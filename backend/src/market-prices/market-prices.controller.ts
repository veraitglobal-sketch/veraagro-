import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MarketPricesService } from './market-prices.service';
import { CreateMarketPriceDto, UpdateMarketPriceDto } from './dto/market-price.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('market-prices')
export class MarketPricesController {
  constructor(private readonly marketPricesService: MarketPricesService) {}

  @Get()
  async getAllActivePrices() {
    return this.marketPricesService.getAllActivePrices();
  }

  @Get('current/:cropType')
  async getCurrentPrice(@Param('cropType') cropType: string) {
    return this.marketPricesService.getCurrentPrice(cropType);
  }

  @Get('history/:cropType')
  async getPriceHistory(@Param('cropType') cropType: string) {
    return this.marketPricesService.getPriceHistory(cropType);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async createPrice(@Request() req, @Body() dto: CreateMarketPriceDto) {
    return this.marketPricesService.createPrice(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updatePrice(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateMarketPriceDto,
  ) {
    return this.marketPricesService.updatePrice(req.user.id, id, dto);
  }
}
