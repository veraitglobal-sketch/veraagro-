import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GrowthLogsService } from './growth-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('growth-logs')
@UseGuards(JwtAuthGuard)
export class GrowthLogsController {
  constructor(private growthLogsService: GrowthLogsService) {}

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.growthLogsService.create(req.user.id, body);
  }

  @Get('estate/:estateId')
  async findAllByEstate(@Param('estateId') estateId: string, @Request() req: any) {
    return this.growthLogsService.findAllByEstate(estateId, req.user.id);
  }

  @Get('parcel/:parcelId')
  async findAllByParcel(@Param('parcelId') parcelId: string, @Request() req: any) {
    return this.growthLogsService.findAllByParcel(parcelId, req.user.id);
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminList(
    @Query('moderationStatus') moderationStatus?: string,
    @Query('limit') limit?: string,
    @Query('partnerCode') partnerCode?: string,
  ) {
    return this.growthLogsService.listForAdmin({
      moderationStatus,
      limit: limit ? parseInt(limit, 10) : undefined,
      partnerCode,
    });
  }

  @Patch('admin/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminReject(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.growthLogsService.adminRejectLog(req.user.id, id, body?.reason);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminDelete(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.growthLogsService.adminDeleteLog(req.user.id, id);
  }
}
