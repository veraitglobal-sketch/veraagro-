import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

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
    password: string;
    roles?: UserRole[];
    role?: UserRole;
  }) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    return this.usersService.create({
      ...body,
      passwordHash,
    });
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
      roles?: UserRole[];
      status?: UserStatus;
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
