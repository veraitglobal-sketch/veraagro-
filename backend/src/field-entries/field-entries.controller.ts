import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { FieldEntriesService } from './field-entries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('field-entries')
@UseGuards(JwtAuthGuard)
export class FieldEntriesController {
  constructor(private readonly fieldEntriesService: FieldEntriesService) {}

  /**
   * SECURITY: Rate limited to prevent spam
   * 10 requests per minute per user
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('FARMER', 'GROWER')
  async create(@Request() req, @Body() body: any) {
    return this.fieldEntriesService.create(req.user.id, body);
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  adminList(
    @Query('partnerCode') partnerCode?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.fieldEntriesService.findAllForAdmin({
      partnerCode,
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('FARMER', 'GROWER')
  async findAll(
    @Request() req,
    @Query('farmId') farmId?: string,
    @Query('parcelId') parcelId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.fieldEntriesService.findAll(req.user.id, {
      farmId,
      parcelId,
      type,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });
  }
}
