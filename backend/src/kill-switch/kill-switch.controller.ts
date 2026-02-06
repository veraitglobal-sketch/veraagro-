import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { KillSwitchService } from './kill-switch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('kill-switch')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KillSwitchController {
  constructor(private readonly killSwitchService: KillSwitchService) {}

  @Post('check')
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async checkCompromisedBatches() {
    return this.killSwitchService.checkAndFlagCompromisedBatches();
  }

  @Post('simulate/:batchId/:missionId/:vehicleId')
  @Roles('SUPER_ADMIN')
  async simulateIoTData(
    @Param('batchId') batchId: string,
    @Param('missionId') missionId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    await this.killSwitchService.simulateIoTData(batchId, missionId, vehicleId);
    return { message: 'IoT data simulated successfully' };
  }
}
