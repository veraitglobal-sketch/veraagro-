import { Controller, Post, Get, Body, UseGuards, Request, Query, Put, Param } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * Check compliance for scanned fertilizer barcode
   * Used as middleware in field entry flow
   */
  @Post('check')
  @Roles('FARMER', 'GROWER')
  async checkCompliance(@Request() req, @Body() body: { barcode: string; farmId?: string; entryType?: string }) {
    return this.complianceService.checkCompliance({
      barcode: body.barcode,
      userId: req.user.id,
      farmId: body.farmId,
      entryType: body.entryType,
    });
  }

  /**
   * FIXED: Calculate partner discount with farm size validation
   */
  @Post('calculate-discount')
  @Roles('FARMER', 'GROWER')
  async calculateDiscount(
    @Request() req,
    @Body() body: { standardPrice: number; requestedQuantity?: number; farmId?: string }
  ) {
    return this.complianceService.calculatePartnerDiscount(
      req.user.id,
      body.standardPrice,
      body.requestedQuantity,
      body.farmId
    );
  }

  /**
   * Check if user is Vera Partner
   */
  @Get('is-partner')
  @Roles('FARMER', 'GROWER')
  async isPartner(@Request() req) {
    const isPartner = await this.complianceService.isVeraPartner(req.user.id);
    return { isPartner };
  }

  /**
   * Admin: Add barcode to Bio-White-List
   */
  @Post('white-list')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async addToWhiteList(
    @Request() req,
    @Body()
    body: {
      barcode: string;
      productName: string;
      manufacturer: string;
      description?: string;
      materialType?: string;
    },
  ) {
    return this.complianceService.addToWhiteList({
      ...body,
      addedBy: req.user.id,
    });
  }

  /** Grower: add name + barcode + type to the same whitelist (visible in Materials + field checks). */
  @Post('white-list/grower')
  @Roles('FARMER', 'GROWER')
  async growerAddToWhiteList(
    @Request() req,
    @Body()
    body: {
      barcode: string;
      productName: string;
      manufacturer?: string;
      materialType: string;
      description?: string;
    },
  ) {
    return this.complianceService.submitGrowerMaterial({
      ...body,
      userId: req.user.id,
    });
  }

  /**
   * Admin: Remove from white list
   */
  @Put('white-list/:barcode/deactivate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async removeFromWhiteList(@Param('barcode') barcode: string) {
    return this.complianceService.removeFromWhiteList(barcode);
  }

  /**
   * Admin: Get all white list entries
   */
  @Get('white-list')
  @Roles('ADMIN', 'SUPER_ADMIN', 'FARMER', 'GROWER')
  async getWhiteList(@Query('activeOnly') activeOnly?: string) {
    return this.complianceService.getWhiteList(activeOnly !== 'false');
  }
}
