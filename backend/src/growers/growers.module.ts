import { Module } from '@nestjs/common';
import { GrowersController } from './growers.controller';
import { GrowersService } from './growers.service';

@Module({
  controllers: [GrowersController],
  providers: [GrowersService],
  exports: [GrowersService],
})
export class GrowersModule {}
