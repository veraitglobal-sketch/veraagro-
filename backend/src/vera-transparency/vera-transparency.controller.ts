import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VeraTransparencyService } from './vera-transparency.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vera-transparency')
export class VeraTransparencyController {
  constructor(private readonly transparencyService: VeraTransparencyService) {}

  /**
   * Group batches by variety and farmer
   * Validates that batches can be mixed
   */
  @Post('batch-manager/group')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'LOGISTICS_PARTNER')
  async groupBatches(@Body() body: { batchIds: string[] }) {
    return this.transparencyService.groupBatchesByVarietyAndFarmer(body.batchIds);
  }

  /**
   * Validate batch grouping
   */
  @Post('batch-manager/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'LOGISTICS_PARTNER')
  async validateGrouping(@Body() body: { batchIds: string[] }) {
    return this.transparencyService.validateBatchGrouping(body.batchIds);
  }

  /**
   * Generate QR Code for batch
   */
  @Get('batch/:batchId/qr-code')
  @UseGuards(JwtAuthGuard)
  async generateQRCode(@Param('batchId') batchId: string) {
    return this.transparencyService.generateBatchQRCode(batchId);
  }

  /**
   * Deep Dive Screen - Public endpoint (for QR code scanning)
   * No authentication required - accessible via QR code
   */
  @Get('batch/:batchId/deep-dive')
  async getDeepDive(@Param('batchId') batchId: string) {
    return this.transparencyService.getDeepDiveData(batchId);
  }

  /**
   * Deep Dive Screen - Authenticated endpoint
   */
  @Get('batch/:batchId/deep-dive/authenticated')
  @UseGuards(JwtAuthGuard)
  async getDeepDiveAuthenticated(@Param('batchId') batchId: string) {
    return this.transparencyService.getDeepDiveData(batchId);
  }
}
