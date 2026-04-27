import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { CommandControlService } from './command-control.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('command-control')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommandControlController {
  constructor(private readonly commandControlService: CommandControlService) {}

  @Get('status')
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getSystemStatus() {
    return {
      paused: this.commandControlService.isSystemPaused(),
    };
  }

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async getDashboard() {
    return this.commandControlService.getCommandDashboard();
  }

  @Post('pause')
  @Roles('SUPER_ADMIN')
  async pauseSystem(
    @Body() body: { reason: string },
    @GetUser() admin: any,
  ) {
    return this.commandControlService.pauseSystem(admin.id, body.reason);
  }

  @Post('resume')
  @Roles('SUPER_ADMIN')
  async resumeSystem(@GetUser() admin: any) {
    return this.commandControlService.resumeSystem(admin.id);
  }

  @Post('reassign/:missionId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async reassignMission(
    @Param('missionId') missionId: string,
    @Body() body: { newDriverId: string; reason: string },
    @GetUser() admin: any,
  ) {
    return this.commandControlService.reassignMission(
      missionId,
      body.newDriverId,
      admin.id,
      body.reason,
    );
  }
}
