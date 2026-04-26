import { Module } from '@nestjs/common';
import { B2bSuppliersService } from './b2b-suppliers.service';
import { B2bSuppliersController } from './b2b-suppliers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [B2bSuppliersController],
  providers: [B2bSuppliersService],
  exports: [B2bSuppliersService],
})
export class B2bSuppliersModule {}
