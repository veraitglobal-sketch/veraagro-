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
import {
  HarvestAnnouncementsService,
  CreateHarvestAnnouncementDto,
  AdminUpdateHarvestAnnouncementDto,
} from './harvest-announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('harvest-announcements')
@UseGuards(JwtAuthGuard)
export class HarvestAnnouncementsController {
  constructor(private readonly announcementsService: HarvestAnnouncementsService) {}

  /**
   * Create harvest/planting announcement (Farmer)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('GROWER', 'FARMER')
  async create(@Request() req, @Body() dto: CreateHarvestAnnouncementDto) {
    return this.announcementsService.create(req.user.id, dto);
  }

  /**
   * Get farmer's announcements
   */
  @Get('my-announcements')
  @UseGuards(RolesGuard)
  @Roles('GROWER', 'FARMER')
  async getMyAnnouncements(@Request() req) {
    return this.announcementsService.getFarmerAnnouncements(req.user.id);
  }

  /**
   * Get all announcements (Admin)
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllAnnouncements(
    @Query('status') status?: string,
    @Query('announcementType') announcementType?: string,
    @Query('cropType') cropType?: string,
  ) {
    return this.announcementsService.getAllAnnouncements({
      status,
      announcementType,
      cropType,
    });
  }

  /**
   * Single announcement (Admin)
   */
  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getOneAdmin(@Param('id') id: string) {
    return this.announcementsService.findOneAdmin(id);
  }

  /**
   * Update announcement (Admin) — status, logistics, QC, internal notes
   */
  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminPatch(@Param('id') id: string, @Body() body: AdminUpdateHarvestAnnouncementDto) {
    return this.announcementsService.adminUpdate(id, body);
  }

  /**
   * Update announcement status (Admin)
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.announcementsService.updateStatus(id, body.status);
  }
}
