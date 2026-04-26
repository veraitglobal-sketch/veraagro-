import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto, AcceptMissionDto } from './dto/mission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('missions')
@UseGuards(JwtAuthGuard)
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('GROWER', 'FARMER')
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
}
