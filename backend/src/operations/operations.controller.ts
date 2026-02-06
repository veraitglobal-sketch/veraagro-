import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('operations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('distributor/:distributorId')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'BUYER')
  async getDistributorInfo(@Param('distributorId') distributorId: string) {
    return this.operationsService.getDistributorInfo(distributorId);
  }

  @Get('ledger/:distributorId')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'BUYER')
  async getGuaranteedSaleLedger(@Param('distributorId') distributorId: string) {
    return this.operationsService.getGuaranteedSaleLedger(distributorId);
  }

  @Get('financial-flow/:batchId')
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getFinancialFlow(@Param('batchId') batchId: string) {
    return this.operationsService.getFinancialFlow(batchId);
  }
}
