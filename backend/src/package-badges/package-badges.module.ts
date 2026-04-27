import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PackageBadgesService } from './package-badges.service';
import { PackageBadgesController } from './package-badges.controller';
import { PublicBadgesController } from './public-badges.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PackageBadgesController, PublicBadgesController],
  providers: [PackageBadgesService],
  exports: [PackageBadgesService],
})
export class PackageBadgesModule {}
