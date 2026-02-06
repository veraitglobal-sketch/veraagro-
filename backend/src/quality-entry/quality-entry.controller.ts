import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QualityEntryService } from './quality-entry.service';
import { CreateQualityEntryDto, LogisticsHandoverDto } from './dto/quality-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('quality-entry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityEntryController {
  constructor(private readonly qualityEntryService: QualityEntryService) {}

  @Post()
  @Roles('GROWER')
  async createQualityEntry(
    @Body() dto: CreateQualityEntryDto,
    @GetUser() user: any,
  ) {
    return this.qualityEntryService.createQualityEntry(user.id, dto);
  }

  @Get('batch/:batchId')
  @Roles('GROWER', 'COORDINATOR', 'SUPER_ADMIN')
  async getQualityEntry(@Param('batchId') batchId: string) {
    return this.qualityEntryService.getQualityEntry(batchId);
  }

  @Get('can-create-shipment/:batchId')
  @Roles('GROWER', 'COORDINATOR', 'SUPER_ADMIN')
  async canCreateShipment(@Param('batchId') batchId: string) {
    return {
      canCreate: await this.qualityEntryService.canCreateShipment(batchId),
    };
  }

  @Post('handover')
  @Roles('LOGISTICS_PARTNER')
  async logisticsHandover(
    @Body() dto: LogisticsHandoverDto,
    @GetUser() user: any,
  ) {
    return this.qualityEntryService.logisticsHandover(user.id, dto);
  }
}
