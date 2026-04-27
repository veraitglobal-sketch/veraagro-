import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PackageBadgesService } from './package-badges.service';

/**
 * Unauthenticated: QR on box/pallet resolves to farmer URL + batch link for consumer apps
 */
@Controller('public/badges')
export class PublicBadgesController {
  constructor(private readonly service: PackageBadgesService) {}

  @Get(':serial')
  async resolve(@Param('serial') serial: string) {
    const r = await this.service.publicResolve(serial);
    if (!r) {
      throw new NotFoundException('Unknown badge serial');
    }
    return r;
  }
}
