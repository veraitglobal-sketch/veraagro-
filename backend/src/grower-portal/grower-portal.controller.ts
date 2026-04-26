import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GrowerPortalService } from './grower-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('grower-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GROWER')
export class GrowerPortalController {
  constructor(private readonly growerPortalService: GrowerPortalService) {}

  @Get('required-certifications')
  getRequiredCertifications() {
    return this.growerPortalService.getRequiredCertifications();
  }

  @Get('mission-tracker')
  async getMissionTracker(
    @GetUser() user: any,
    @Query('batchId') batchId?: string,
  ) {
    return this.growerPortalService.getMissionTracker(user.id, batchId);
  }

  @Get('journey-map/:missionId')
  async getJourneyMap(
    @Param('missionId') missionId: string,
    @GetUser() user: any,
  ) {
    return this.growerPortalService.getJourneyMap(missionId, user.id);
  }

  @Get('consumer-feedback/:batchId')
  async getConsumerFeedback(
    @Param('batchId') batchId: string,
    @GetUser() user: any,
  ) {
    return this.growerPortalService.getConsumerFeedback(batchId, user.id);
  }

  @Get('financial-status/:batchId')
  async getFinancialStatus(
    @Param('batchId') batchId: string,
    @GetUser() user: any,
  ) {
    return this.growerPortalService.getFinancialStatus(batchId, user.id);
  }
}
