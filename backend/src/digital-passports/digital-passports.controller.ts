import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DigitalPassportsService } from './digital-passports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('digital-passports')
@UseGuards(JwtAuthGuard)
export class DigitalPassportsController {
  constructor(private digitalPassportsService: DigitalPassportsService) {}

  @Post('generate')
  async generate(
    @Body() body: { estateId: string; parcelIds?: string[] },
    @Request() req: any,
  ) {
    return this.digitalPassportsService.generatePassport(
      body.estateId,
      req.user.id,
      body.parcelIds,
    );
  }

  @Get(':id')
  async getPassport(@Param('id') id: string, @Request() req: any) {
    return this.digitalPassportsService.getPassport(id, req.user.id);
  }

  @Get('batch/:batchId')
  async getPassportByBatchId(@Param('batchId') batchId: string) {
    // Public endpoint for QR code scanning (no auth required)
    return this.digitalPassportsService.getPassportByBatchId(batchId);
  }
}
