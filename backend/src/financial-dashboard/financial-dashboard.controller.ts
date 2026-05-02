import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { FinancialDashboardService } from './financial-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('financial-dashboard')
export class FinancialDashboardController {
  constructor(
    private financialDashboardService: FinancialDashboardService,
  ) {}

  /**
   * Get financial dashboard data
   * For admins: shows all platform profits
   * For farmers: shows their earnings breakdown
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getFinancialDashboard(@Request() req: any) {
    const isPlatformViewer =
      Array.isArray(req.user.roles) &&
      (req.user.roles.includes('ADMIN') || req.user.roles.includes('SUPER_ADMIN'));
    const userId = isPlatformViewer ? undefined : req.user.id;
    return this.financialDashboardService.getFinancialDashboard(userId);
  }
}
