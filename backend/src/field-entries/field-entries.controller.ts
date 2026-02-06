import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { FieldEntriesService } from './field-entries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('field-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('FARMER', 'GROWER')
export class FieldEntriesController {
  constructor(private readonly fieldEntriesService: FieldEntriesService) {}

  /**
   * SECURITY: Rate limited to prevent spam
   * 10 requests per minute per user
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.fieldEntriesService.create(req.user.id, body);
  }

  @Get()
  async findAll(@Request() req, @Query('farmId') farmId?: string) {
    return this.fieldEntriesService.findAll(req.user.id, farmId);
  }
}
