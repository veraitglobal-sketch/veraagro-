import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import {
  CreateMissionDto,
  AcceptMissionDto,
  AdminAssignMissionDto,
  AdminSetMissionDestinationDto,
  AdminCancelMissionDto,
  AdminCreateMissionFromOrderDto,
  LogisticsMissionLifecycleDto,
} from './dto/mission.dto';
import { UpdateMissionLogisticsDriverDto } from '../logistics-partner/dto/update-mission-driver.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('missions')
@UseGuards(JwtAuthGuard)
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  /**
   * Create transport request (grower). Jwt only — `createMission()` enforces grower account and batch ownership.
   * (Same pattern as harvest-announcements: mobile JWT role arrays must not block the flow because of guard drift.)
   */
  @Post()
  async createMission(@Request() req, @Body() dto: CreateMissionDto) {
    return this.missionsService.createMission(req.user.id, dto);
  }

  @Put(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('LOGISTICS_PARTNER')
  async acceptMission(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AcceptMissionDto,
  ) {
    return this.missionsService.acceptMission(req.user.id, id, dto);
  }

  @Get('my-missions')
  async getMyMissions(
    @Request() req,
    @Query('scope') scope?: 'grower' | 'logistics',
  ) {
    const roles: string[] = req.user.roles || (req.user.role ? [req.user.role] : []);
    let primaryRole: string;
    if (scope === 'logistics' && roles.includes('LOGISTICS_PARTNER')) {
      primaryRole = 'LOGISTICS_PARTNER';
    } else if (scope === 'grower' && (roles.includes('GROWER') || roles.includes('FARMER'))) {
      primaryRole = 'GROWER';
    } else {
      primaryRole = roles.includes('GROWER')
        ? 'GROWER'
        : roles.includes('FARMER')
          ? 'GROWER'
          : roles.includes('LOGISTICS_PARTNER')
            ? 'LOGISTICS_PARTNER'
            : 'GROWER';
    }
    return this.missionsService.getMissionsForUser(req.user.id, primaryRole);
  }

  /** Take an unclaimed PENDING mission (no partner yet), then use PUT :id/accept. */
  @Post(':id/claim')
  @UseGuards(RolesGuard)
  @Roles('LOGISTICS_PARTNER')
  claimMission(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AcceptMissionDto,
  ) {
    return this.missionsService.claimUnassignedMission(req.user.id, id, dto);
  }

  @Patch(':id/assigned-logistics-driver')
  @UseGuards(RolesGuard)
  @Roles('LOGISTICS_PARTNER')
  setMissionPickupDriver(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateMissionLogisticsDriverDto,
  ) {
    return this.missionsService.setMissionAssignedLogisticsDriver(req.user.id, id, dto);
  }

  /** Advance mission status after handover / on the road (grower journey map). */
  @Patch(':id/lifecycle')
  @UseGuards(RolesGuard)
  @Roles('LOGISTICS_PARTNER')
  advanceMissionLifecycle(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: LogisticsMissionLifecycleDto,
  ) {
    return this.missionsService.advanceMissionLifecycle(req.user.id, id, dto.step);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAllMissions(
    @Query('status') status?: string,
    @Query('growerId') growerId?: string,
    @Query('logisticsPartnerId') logisticsPartnerId?: string,
  ) {
    return this.missionsService.findAll({ status, growerId, logisticsPartnerId });
  }

  @Get('admin/logistics-partners')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async listLogisticsPartnersForAdmin() {
    return this.missionsService.listLogisticsPartnersForAdmin();
  }

  @Patch('admin/:id/approve-transport')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminApproveTransport(@Request() req, @Param('id') id: string) {
    return this.missionsService.adminApproveTransport(req.user.id, id);
  }

  @Patch('admin/:id/reject-transport')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminRejectTransport(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.missionsService.adminRejectTransport(req.user.id, id, body?.reason);
  }

  @Patch('admin/:id/destination')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminSetDestination(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AdminSetMissionDestinationDto,
  ) {
    return this.missionsService.adminSetDestination(req.user.id, id, dto);
  }

  @Patch('admin/:id/cancel')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminCancelMission(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AdminCancelMissionDto,
  ) {
    return this.missionsService.adminCancelMission(req.user.id, id, dto?.reason);
  }

  @Patch('admin/:id/assign')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminAssignMission(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AdminAssignMissionDto,
  ) {
    return this.missionsService.adminAssignLogistics(req.user.id, id, dto);
  }

  /** Link buyer order (fulfilling farm set) to a PENDING grower mission with prep instructions. */
  @Post('admin/from-order')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminCreateMissionFromOrder(
    @Request() req,
    @Body() dto: AdminCreateMissionFromOrderDto,
  ) {
    return this.missionsService.adminCreateMissionFromOrder(req.user.id, dto);
  }

  /** Mobile + deep links: one mission the caller may view (grower, logistics, or unclaimed pool). */
  @Get(':id')
  getMissionById(@Request() req, @Param('id') id: string) {
    return this.missionsService.getMissionForRequestingUser(req.user.id, id);
  }
}
