import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SecurityAlertsService } from './security-alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('security-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
export class SecurityAlertsController {
  constructor(private readonly securityAlertsService: SecurityAlertsService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('estateId') estateId?: string,
  ) {
    return this.securityAlertsService.findAll({
      type,
      severity,
      status,
      userId,
      estateId,
    });
  }

  @Get('statistics')
  async getStatistics() {
    return this.securityAlertsService.getStatistics();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.securityAlertsService.findOne(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reviewNotes?: string; resolution?: string },
    @GetUser() admin: any,
  ) {
    return this.securityAlertsService.updateStatus(
      id,
      body.status,
      admin.id,
      body.reviewNotes,
      body.resolution,
    );
  }
}
