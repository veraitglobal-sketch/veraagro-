import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('seeds')
export class SeedsController {
  constructor(private seedsService: SeedsService) {}

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailable() {
    return this.seedsService.getAvailableSeeds();
  }

  /**
   * Validate seed serial number (for manual entry)
   * Returns seed info if valid, error if not
   */
  @Get('validate/:serialNumber')
  @UseGuards(JwtAuthGuard)
  async validateSeed(@Param('serialNumber') serialNumber: string, @Request() req: any) {
    return this.seedsService.validateSeed(serialNumber, req.user.id);
  }
}
