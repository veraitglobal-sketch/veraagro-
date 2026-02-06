import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditTrailService } from './audit-trail.service';
import { CreateAuditTrailDto } from './dto/audit-trail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit-trail')
@UseGuards(JwtAuthGuard)
export class AuditTrailController {
  constructor(private readonly auditTrailService: AuditTrailService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'LOGISTICS_PARTNER')
  async createAuditTrail(@Body() dto: CreateAuditTrailDto) {
    return this.auditTrailService.createAuditTrail(dto);
  }

  @Get('entity/:entityType/:entityId')
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getAuditTrailForEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditTrailService.getAuditTrailForEntity(entityType, entityId);
  }

  @Get('event-type/:eventType')
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getAuditTrailByEventType(
    @Param('eventType') eventType: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditTrailService.getAuditTrailByEventType(eventType, limit);
  }

  @Get('compliance')
  @Roles('SUPER_ADMIN')
  async getComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditTrailService.getComplianceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
