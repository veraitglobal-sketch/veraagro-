import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PartnerApplicationsService } from './partner-applications.service';
import { CreatePartnerApplicationDto, AdminUpdatePartnerApplicationDto } from './dto/partner-applications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PartnerApplicationStatus } from '@prisma/client';

@Controller('partner-applications')
export class PartnerApplicationsController {
  constructor(private readonly svc: PartnerApplicationsService) {}

  @Post()
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  create(@Body() dto: CreatePartnerApplicationDto) {
    return this.svc.createPublic(dto);
  }

  @Get('public/status/:referenceCode')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  statusByReference(@Param('referenceCode') referenceCode: string) {
    return this.svc.getByReferencePublic(referenceCode);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @SkipThrottle()
  listAdmin(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const s = status as PartnerApplicationStatus | undefined;
    const valid = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'CONTACTED',
      'MEETING_SCHEDULED',
      'NEGOTIATION',
      'APPROVED',
      'REJECTED',
      'ONBOARDED',
    ] as const;
    const statusFilter = s && (valid as readonly string[]).includes(s) ? s : undefined;
    return this.svc.listAdmin({ status: statusFilter, search });
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @SkipThrottle()
  oneAdmin(@Param('id') id: string) {
    return this.svc.getOneAdmin(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @SkipThrottle()
  updateAdmin(@Param('id') id: string, @Body() dto: AdminUpdatePartnerApplicationDto) {
    return this.svc.updateAdmin(id, dto);
  }
}
