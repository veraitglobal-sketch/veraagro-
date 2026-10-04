import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PassportReportStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePassportReportDto } from './dto/create-passport-report.dto';
import { PassportReportsService } from './passport-reports.service';

@Controller()
export class PassportReportsController {
  constructor(private readonly service: PassportReportsService) {}

  @Post('qr/verify/:batchId/report')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createPublic(
    @Param('batchId') batchId: string,
    @Query('badge') badge: string | undefined,
    @Body() body: CreatePassportReportDto,
  ) {
    const publicBatchId = batchId.startsWith('BIO-VERA-') ? batchId.slice('BIO-VERA-'.length) : batchId;
    return this.service.createPublicReport(publicBatchId, badge, body);
  }

  @Get('admin/passport-reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  listAdmin(@Query('status') status?: PassportReportStatus) {
    return this.service.listAdmin(status);
  }

  @Get('admin/passport-reports/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAdmin(@Param('id') id: string) {
    return this.service.getAdmin(id);
  }

  @Patch('admin/passport-reports/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: PassportReportStatus; adminNotes?: string },
    @Request() req: { user: { id: string } },
  ) {
    return this.service.updateStatus(id, body.status, req.user.id, body.adminNotes);
  }
}
