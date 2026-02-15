import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterGrowerDto } from './dto/register-grower.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register/buyer')
  async registerBuyer(@Body() dto: RegisterBuyerDto) {
    return this.authService.registerBuyer(dto);
  }

  @Post('register/grower')
  async registerGrower(@Body() dto: RegisterGrowerDto) {
    return this.authService.registerGrower(dto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      return { success: false, message: 'Missing verification token' };
    }
    return this.authService.verifyEmail(token);
  }
}
