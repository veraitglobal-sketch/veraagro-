import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupSyncService } from './group-sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('group-sync')
export class GroupSyncController {
  constructor(private groupSyncService: GroupSyncService) {}

  /**
   * Get available groups
   */
  @Get('groups')
  @UseGuards(JwtAuthGuard)
  async getAvailableGroups() {
    return this.groupSyncService.getAvailableGroups();
  }

  /**
   * Get group statistics
   */
  @Get('groups/:groupId/statistics')
  @UseGuards(JwtAuthGuard)
  async getGroupStatistics(@Param('groupId') groupId: string) {
    return this.groupSyncService.getGroupStatistics(groupId);
  }

  /**
   * Send instruction to all farmers in a group
   */
  @Post('groups/:groupId/send-instruction')
  @UseGuards(JwtAuthGuard)
  async sendGroupInstruction(
    @Param('groupId') groupId: string,
    @Body()
    body: {
      title: string;
      message: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      actionUrl?: string;
    },
    @Request() req: any,
  ) {
    return this.groupSyncService.sendGroupInstruction(
      groupId,
      body,
      req.user.id,
    );
  }
}
