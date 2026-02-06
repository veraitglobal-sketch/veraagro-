import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BuyersService } from './buyers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('buyers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class BuyersController {
  constructor(private readonly buyersService: BuyersService) {}

  @Get('statistics')
  async getStatistics(@GetUser() user: any) {
    return this.buyersService.getStatistics(user.id);
  }

  @Get('analytics')
  async getAnalytics(
    @GetUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.buyersService.getAnalytics(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('suppliers')
  async getSuppliers(@GetUser() user: any) {
    return this.buyersService.getSuppliers(user.id);
  }
}
