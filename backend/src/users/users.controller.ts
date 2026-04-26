import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAllUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (role) filters.role = role as UserRole;
    if (status) filters.status = status as UserStatus;
    if (search) filters.search = search;
    
    return this.usersService.findAll(filters);
  }

  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async createUser(@Body() body: {
    partnerCode: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    productionCountry?: string; // e.g. "Serbia", "Italy" – for QR label "Produced in X, Region Y"
    password?: string; // Optional - will be auto-generated if not provided
    roles?: UserRole[];
    role?: UserRole;
    autoGeneratePassword?: boolean; // If true, generate password automatically
    sendEmail?: boolean; // If true, send welcome email
  }) {
    // Generate password if not provided or if autoGeneratePassword is true
    let password = body.password;
    let generatedPassword = false;
    
    if (body.autoGeneratePassword || !password) {
      // Generate secure random password (12 characters: letters + numbers)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      generatedPassword = true;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { password: _, autoGeneratePassword, sendEmail, ...userData } = body;
    const newUser = await this.usersService.create({
      ...userData,
      passwordHash,
    });

    // Send welcome email if email is provided and sendEmail is true
    const shouldSendEmail = body.sendEmail !== false && body.email && 
      (body.roles?.includes(UserRole.FARMER) || body.roles?.includes(UserRole.GROWER) || body.role === UserRole.FARMER || body.role === UserRole.GROWER);
    
    if (shouldSendEmail && newUser.farmerQrCode) {
      // Send email asynchronously (don't block response)
      this.emailService.sendFarmerWelcomeEmail({
        email: body.email!,
        firstName: body.firstName,
        lastName: body.lastName,
        partnerCode: body.partnerCode,
        password: password, // Send the actual password (plain text) in email
        farmerQrCode: newUser.farmerQrCode,
        farmerProfileUrl: newUser.farmerProfileUrl || '',
      }).catch((error) => {
        console.error('Failed to send welcome email:', error);
        // Don't throw - email failure shouldn't block user creation
      });
    }

    // Return user with password info (only if generated)
    return {
      ...newUser,
      password: generatedPassword ? password : undefined, // Return password only if it was generated
      passwordGenerated: generatedPassword,
      emailSent: shouldSendEmail,
    };
  }

  @Put('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateUser(
    @Param('id') id: string,
    @Body() body: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      productionCountry?: string;
      roles?: UserRole[];
      status?: UserStatus;
      buyerCompanyProfile?: Prisma.InputJsonValue | null;
    },
  ) {
    return this.usersService.update(id, body);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
