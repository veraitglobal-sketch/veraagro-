import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByPartnerCode(partnerCode: string) {
    return this.prisma.users.findUnique({
      where: { partnerCode },
    });
  }

  /**
   * Find user by email or partnerCode
   * Used for universal login
   */
  async findByEmailOrPartnerCode(identifier: string) {
    // Try to find by email first
    const userByEmail = await this.prisma.users.findFirst({
      where: { email: identifier },
    });
    
    if (userByEmail) {
      return userByEmail;
    }
    
    // If not found by email, try partnerCode
    return this.prisma.users.findUnique({
      where: { partnerCode: identifier },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        estates: {
          include: {
            parcels: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: {
    partnerCode: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    roles?: UserRole[]; // Support multiple roles
    role?: UserRole; // Backward compatibility
  }) {
    // Support both old (single role) and new (multiple roles) format
    const roles = data.roles || (data.role ? [data.role] : [UserRole.FARMER]);
    
    return this.prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        partnerCode: data.partnerCode,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: data.passwordHash,
        roles: roles,
        status: UserStatus.PENDING_VERIFICATION,
        updatedAt: new Date(),
      },
    });
  }

  // Admin methods
  async findAll(filters?: { role?: UserRole; status?: UserStatus; search?: string }) {
    const where: any = {};
    
    if (filters?.role) {
      where.roles = { has: filters.role };
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.search) {
      where.OR = [
        { partnerCode: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.users.findMany({
      where,
      include: {
        estates: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            estates: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    roles?: UserRole[];
    status?: UserStatus;
  }) {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.roles !== undefined) updateData.roles = data.roles;
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.users.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return this.prisma.users.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const [total, byRole, byStatus] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.groupBy({
        by: ['roles'],
        _count: true,
      }),
      this.prisma.users.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      total,
      byRole: byRole.reduce((acc, item) => {
        item.roles.forEach((role) => {
          acc[role] = (acc[role] || 0) + item._count;
        });
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
