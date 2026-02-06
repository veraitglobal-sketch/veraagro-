import { Module } from '@nestjs/common';
import { StandardEngineService } from './standard-engine.service';
import { StandardEngineController } from './standard-engine.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StandardEngineService],
  controllers: [StandardEngineController],
  exports: [StandardEngineService],
})
export class StandardEngineModule {}
