import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Sync offline field entries to server
   * POST /sync/field-entries
   * 
   * Accepts array of field entries from offline storage
   * Validates timestamps and marks late entries
   */
  @Post('field-entries')
  @Roles('GROWER', 'FARMER', 'SUPER_ADMIN', 'ADMIN')
  async syncFieldEntries(
    @Body() body: {
      entries: Array<{
        id?: string;
        type: 'PRSKANJE' | 'SETVA' | 'BERBA';
        farmId: string;
        seedSerialNumber?: string;
        packagingBarcode?: string;
        fertilizerBarcode?: string;
        data: {
          date: string;
          location?: { lat: number; lng: number };
          notes?: string;
          [key: string]: any;
        };
        createdAt: string;
        deviceFingerprint?: string;
        deviceId?: string; // CRITICAL SECURITY: Device ID for fingerprinting
      }>;
    },
    @GetUser() user: { id: string },
  ) {
    return this.syncService.syncFieldEntries(body.entries, user.id);
  }

  /**
   * Get late entries for review
   * GET /sync/late-entries
   */
  @Get('late-entries')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async getLateEntries(@Query('userId') userId?: string) {
    return this.syncService.getLateEntries(userId);
  }
}
