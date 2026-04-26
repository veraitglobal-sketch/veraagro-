import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('statistics')
  async getStatistics() {
    return this.adminService.getDashboardStatistics();
  }

  @Get('recent-activities')
  async getRecentActivities(@Query('limit') limit?: string) {
    return this.adminService.getRecentActivities(limit ? parseInt(limit) : 10);
  }

  /**
   * Single grower (farmer) dossier. Optional `?include=` comma list (e.g. `counts,trust,kyc,estates`) returns only those
   * sections; omit for full payload. Aliases: `kyc` → kycDocuments, `compliance` → complianceLogs.
   */
  @Get('farmers/:id')
  async getFarmerById(@Param('id') id: string, @Query('include') include?: string) {
    return this.adminService.getFarmerAdminDetail(id, include);
  }

  /** @deprecated Use GET /admin/farmers/:id — same query params */
  @Get('farm/:id')
  async getFarmDetail(@Param('id') id: string, @Query('include') include?: string) {
    return this.adminService.getFarmerAdminDetail(id, include);
  }
}
