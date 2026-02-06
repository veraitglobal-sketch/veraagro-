import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BatchHistoryService } from './batch-history.service';
import { DistributorArrivalDto, BorderWaitTimeDto } from './dto/batch-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('batch-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatchHistoryController {
  constructor(private readonly batchHistoryService: BatchHistoryService) {}

  @Get('batch/:batchId')
  @Roles('GROWER', 'LOGISTICS_PARTNER', 'COORDINATOR', 'SUPER_ADMIN', 'BUYER')
  async getBatchHistory(@Param('batchId') batchId: string) {
    return this.batchHistoryService.getBatchHistory(batchId);
  }

  @Post('distributor-arrival')
  @Roles('COORDINATOR', 'SUPER_ADMIN')
  async recordDistributorArrival(
    @Body() dto: DistributorArrivalDto,
    @GetUser() user: any,
  ) {
    return this.batchHistoryService.recordDistributorArrival(user.id, dto);
  }

  @Post('border-wait-time')
  @Roles('LOGISTICS_PARTNER')
  async recordBorderWaitTime(
    @Body() dto: BorderWaitTimeDto,
    @GetUser() user: any,
  ) {
    return this.batchHistoryService.recordBorderWaitTime(user.id, dto);
  }
}
