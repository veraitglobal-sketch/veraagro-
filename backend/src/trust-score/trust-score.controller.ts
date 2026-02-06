import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { TrustScoreService } from './trust-score.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('trust-score')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrustScoreController {
  constructor(private readonly trustScoreService: TrustScoreService) {}

  @Get('me')
  async getMyTrustScore(@GetUser() user: any) {
    return this.trustScoreService.getTrustScore(user.id);
  }

  @Get(':userId')
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getTrustScore(@Param('userId') userId: string) {
    return this.trustScoreService.getTrustScore(userId);
  }

  @Post('deduct')
  @Roles('SUPER_ADMIN', 'SYSTEM')
  async applyDeduction(@Body() deduction: any) {
    return this.trustScoreService.applyDeduction(deduction);
  }

  @Put('unblock/:userId')
  @Roles('SUPER_ADMIN')
  async unblockPartner(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @GetUser() admin: any,
  ) {
    return this.trustScoreService.unblockPartner(userId, body.reason);
  }

  @Put('adjust/:userId')
  @Roles('SUPER_ADMIN')
  async adjustScore(
    @Param('userId') userId: string,
    @Body() body: { points: number; reason: string },
    @GetUser() admin: any,
  ) {
    return this.trustScoreService.adjustScore(userId, body.points, body.reason, admin.id);
  }
}
