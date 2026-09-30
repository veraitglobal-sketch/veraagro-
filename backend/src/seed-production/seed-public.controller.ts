import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SeedProductionService } from './seed-production.service';

@Controller('public/seed')
export class SeedPublicController {
  constructor(private service: SeedProductionService) {}

  @Get('verify/:serial')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  verify(@Param('serial') serial: string) {
    return this.service.publicVerify(serial);
  }
}
