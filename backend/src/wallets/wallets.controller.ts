import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('me')
  async getMyWallet(@Request() req: any) {
    return this.walletsService.getWallet(req.user.id);
  }

  @Get('me/transactions')
  async getMyTransactions(@Request() req: any) {
    return this.walletsService.getTransactions(req.user.id);
  }
}
