import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { DigitalHandoverService } from './digital-handover.service';
import { InitiateHandoverDto, CompleteHandoverDto, DisputeHandoverDto } from './dto/digital-handover.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('digital-handover')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DigitalHandoverController {
  constructor(private readonly handoverService: DigitalHandoverService) {}

  /**
   * Driver initiates handover by scanning QR code
   */
  @Post('initiate')
  @Roles('DRIVER', 'LOGISTICS_PARTNER', 'FLEET_PARTNER')
  async initiateHandover(
    @Body() dto: InitiateHandoverDto,
    @GetUser() user: any,
  ) {
    return this.handoverService.initiateHandover(user.id, dto);
  }

  /**
   * Store manager completes handover with quality check
   */
  @Post('complete')
  @Roles('BUYER', 'SUPER_ADMIN', 'ADMIN')
  async completeHandover(
    @Body() dto: CompleteHandoverDto,
    @GetUser() user: any,
  ) {
    const roles =
      Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
    return this.handoverService.completeHandover(user.id, dto, roles);
  }

  /**
   * Get handover by ID
   */
  @Get(':id')
  async getHandover(@Param('id') id: string, @GetUser() user: any) {
    return this.handoverService.getHandover(id, user.id, user.roles ?? []);
  }
}
