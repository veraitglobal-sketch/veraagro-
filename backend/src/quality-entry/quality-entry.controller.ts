import { Controller, Get, Post, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { QualityEntryService } from './quality-entry.service';
import {
  CreateQualityEntryDto,
  LogisticsHandoverDto,
  HandoverReceiverProofDto,
} from './dto/quality-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('quality-entry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityEntryController {
  constructor(private readonly qualityEntryService: QualityEntryService) {}

  @Post()
  @Roles('GROWER', 'FARMER', 'PARTNER')
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

  /**
   * Receiver name + optional signature (e.g. canvas → data URL) after load; PDF hash stored on logistics_handovers
   */
  @Post('handover/receiver-proof')
  @Roles('LOGISTICS_PARTNER')
  async handoverReceiverProof(@Body() dto: HandoverReceiverProofDto, @GetUser() user: any) {
    return this.qualityEntryService.submitHandoverReceiverProof(user.id, dto);
  }

  @Get('handover/mission/:missionId/receiver-pdf')
  @Roles('LOGISTICS_PARTNER', 'GROWER', 'FARMER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN')
  async handoverReceiverPdf(
    @Param('missionId') missionId: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    const buf = await this.qualityEntryService.getHandoverReceiverPdfBuffer(missionId, user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="handover-receiver-${missionId}.pdf"`);
    res.send(buf);
  }
}
