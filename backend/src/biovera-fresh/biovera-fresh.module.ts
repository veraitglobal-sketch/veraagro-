import { Module } from '@nestjs/common';
import { BioVeraFreshController } from './biovera-fresh.controller';
import { BioVeraFreshService } from './biovera-fresh.service';

@Module({
  controllers: [BioVeraFreshController],
  providers: [BioVeraFreshService],
})
export class BioVeraFreshModule {}
