import { Throttle } from '@nestjs/throttler';
import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterGrowerDto } from './dto/register-grower.dto';
import { ResendVerificationCodeDto, VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() dto: LoginDto) {
    if (dto.preferredLanguage) {
      await this.usersService.ensurePreferredLanguage(req.user.id, dto.preferredLanguage);
    }
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

  @Post('verify-email-code')
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(dto.email, dto.code);
  }

  @Post('resend-verification-code')
  async resendVerificationCode(@Body() dto: ResendVerificationCodeDto) {
    return this.authService.resendBuyerVerificationCode(dto.email);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes per IP
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      return { success: false, message: 'Missing verification token' };
    }
    return this.authService.verifyEmail(token);
  }
}
