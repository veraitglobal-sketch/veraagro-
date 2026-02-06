import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExportAutomatorService, CMRDocument, PhytosanitaryCertificate, TaxCalculation, TaxReport } from './export-automator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('export-automator')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportAutomatorController {
  constructor(private readonly exportAutomatorService: ExportAutomatorService) {}

  /**
   * Generate CMR document
   */
  @Post('cmr/:deliveryId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'LOGISTICS_PARTNER')
  async generateCMR(@Param('deliveryId') deliveryId: string) {
    return this.exportAutomatorService.generateCMR(deliveryId);
  }

  /**
   * Generate Phytosanitary Certificate
   */
  @Post('phytosanitary/:batchId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async generatePhytosanitary(@Param('batchId') batchId: string) {
    return this.exportAutomatorService.generatePhytosanitaryCertificate(batchId);
  }

  /**
   * Calculate tax separation
   */
  @Post('tax-calculation/:orderId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async calculateTax(@Param('orderId') orderId: string): Promise<TaxCalculation> {
    return this.exportAutomatorService.calculateTaxSeparation(orderId);
  }

  /**
   * Generate tax report for Hamburg accounting
   */
  @Post('tax-report')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async generateTaxReport(
    @Body() body: {
      startDate: string; // ISO date string
      endDate: string; // ISO date string
    }
  ): Promise<TaxReport> {
    return this.exportAutomatorService.generateTaxReport(
      new Date(body.startDate),
      new Date(body.endDate)
    );
  }

  /**
   * Generate all export documents for a delivery
   */
  @Post('all-documents/:deliveryId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async generateAllDocuments(@Param('deliveryId') deliveryId: string) {
    return this.exportAutomatorService.generateAllExportDocuments(deliveryId);
  }

  /**
   * Get tax report (one-click submission ready)
   */
  @Get('tax-report')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getTaxReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.exportAutomatorService.generateTaxReport(
      new Date(startDate),
      new Date(endDate)
    );
  }
}
