import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  HarvestAnnouncementsService,
  AdminUpdateHarvestAnnouncementDto,
} from './harvest-announcements.service';
import { CreateHarvestAnnouncementDto } from './dto/create-harvest-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('harvest-announcements')
@UseGuards(JwtAuthGuard)
export class HarvestAnnouncementsController {
  constructor(private readonly announcementsService: HarvestAnnouncementsService) {}

  /**
   * Create harvest/planting announcement (Farmer)
   * Role check: JwtAuthGuard only — `create()` enforces parcel ownership on the estate.
   */
  @Post()
  async create(@Request() req, @Body() dto: CreateHarvestAnnouncementDto) {
    return this.announcementsService.create(req.user.id, dto);
  }

  /**
   * Get grower's announcements (scoped by parcel → estate ownership, same as HarvestAnnouncementsService.getFarmerAnnouncements).
   */
  @Get('my-announcements')
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
  @Delete('admin/:id/planting')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminDeletePlanting(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.announcementsService.adminDeletePlanting(req.user.id, id, body?.reason);
  }

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
