import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { HaccpService } from './haccp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('haccp')
export class HaccpController {
  constructor(private haccpService: HaccpService) {}

  /** Admin: HACCP monitoring overview */
  @Get('admin/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getOverview() {
    return this.haccpService.getOverview();
  }

  /** Public: Track batch HACCP status (for buyers – no auth required) */
  @Get('track/:batchId')
  async getTrackData(@Param('batchId') batchId: string) {
    const data = await this.haccpService.getTrackData(batchId);
    if (!data) return { batchId, haccpStatus: 'NOT_FOUND', productName: null };
    return data;
  }
}
