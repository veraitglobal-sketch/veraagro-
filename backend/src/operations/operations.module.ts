import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SkuModule } from '../sku/sku.module';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [PrismaModule, SkuModule, RoutingModule],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
