import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate/:batchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'COORDINATOR', 'SUPER_ADMIN')
  async generateQR(@Param('batchId') batchId: string) {
    return this.qrService.generateBatchQR(batchId);
  }

  @Get('certificate/:qrId')
  async getCertificate(@Param('qrId') qrId: string) {
    return this.qrService.getCertificateData(qrId);
  }

  @Get('verify/:batchId')
  async getVerification(@Param('batchId') batchId: string) {
    // Support both batchId and QR ID format
    const qrId = batchId.startsWith('BIO-VERA-') ? batchId : `BIO-VERA-${batchId}`;
    return this.qrService.getCertificateData(qrId);
  }

  /**
   * Generate QR code for testing (SEED or FERTILIZER)
   * GET /qr/generate?type=SEED&value=SEED-TEST-001
   */
  @Get('generate')
  async generateTestQR(
    @Query('type') type: 'SEED' | 'FERTILIZER',
    @Query('value') value: string,
  ) {
    return this.qrService.generateTestQR(type, value);
  }
}
