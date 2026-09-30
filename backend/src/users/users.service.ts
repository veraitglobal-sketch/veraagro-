import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

/** Subset of `users` for login (password check + JWT). Omits `buyerCompanyProfile` and other
 * heavy optionals so auth still works if a JSON migration was not run on the DB yet. */
const AUTH_LOGIN_SELECT: Prisma.usersSelect = {
  id: true,
  partnerCode: true,
  email: true,
  firstName: true,
  lastName: true,
  passwordHash: true,
  status: true,
  roles: true,
  assignedCommercialAgent: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      partnerCode: true,
      email: true,
      phone: true,
      commercial_agent_profile: {
        select: {
          officeName: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
        },
      },
    },
  },
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

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
      select: AUTH_LOGIN_SELECT,
    });
    
    if (userByEmail) {
      return userByEmail;
    }
    
    // If not found by email, try partnerCode
    return this.prisma.users.findUnique({
      where: { partnerCode: identifier },
      select: AUTH_LOGIN_SELECT,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      include: {
        assignedCommercialAgent: {
          include: { commercial_agent_profile: true },
        },
        commercial_agent_profile: true,
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

  /** ADMIN may manage ordinary accounts, but cannot grant or modify SUPER_ADMIN. */
  async assertCanManageUser(
    actorRoles: UserRole[],
    requestedRoles?: UserRole[],
    targetUserId?: string,
  ) {
    if (actorRoles.includes(UserRole.SUPER_ADMIN)) return;
    if (!actorRoles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Administrator access required');
    }
    if (requestedRoles?.includes(UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Only a super admin can grant the super admin role');
    }
    if (targetUserId) {
      const target = await this.prisma.users.findUnique({
        where: { id: targetUserId },
        select: { roles: true },
      });
      if (!target) throw new NotFoundException('User not found');
      if (target.roles.includes(UserRole.SUPER_ADMIN)) {
        throw new ForbiddenException('Only a super admin can modify a super admin account');
      }
    }
  }

  async create(data: {
    partnerCode: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    productionCountry?: string;
    passwordHash: string;
    roles?: UserRole[]; // Support multiple roles
    role?: UserRole; // Backward compatibility
  }) {
    // Support both old (single role) and new (multiple roles) format
    const roles = data.roles || (data.role ? [data.role] : [UserRole.FARMER]);
    
    // Generate farmer QR code if user is a farmer/grower
    let farmerQrCode: string | undefined;
    let farmerProfileUrl: string | undefined;
    
    if (roles.includes(UserRole.FARMER) || roles.includes(UserRole.GROWER)) {
      // Generate unique QR code ID
      farmerQrCode = `FARMER-${data.partnerCode}`;
      
      // Generate profile URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      farmerProfileUrl = `${frontendUrl}/farmer/${farmerQrCode}`;
    }
    
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
        farmerQrCode: farmerQrCode,
        farmerProfileUrl: farmerProfileUrl,
        productionCountry: data.productionCountry?.trim() || undefined,
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
        assignedCommercialAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            partnerCode: true,
            email: true,
            phone: true,
            commercial_agent_profile: {
              select: {
                officeName: true,
                address: true,
                city: true,
                country: true,
                postalCode: true,
              },
            },
          },
        },
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

  /** Active commercial agents (admin dropdown + proximity notes) */
  async findCommercialAgents() {
    return this.prisma.users.findMany({
      where: {
        status: UserStatus.ACTIVE,
        roles: { has: UserRole.COMMERCIAL_AGENT },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        partnerCode: true,
        email: true,
        phone: true,
        commercial_agent_profile: {
          select: {
            officeName: true,
            address: true,
            city: true,
            country: true,
            postalCode: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  private static readonly ROLES_WITH_ASSIGNED_AGENT: UserRole[] = [
    UserRole.GROWER,
    UserRole.FARMER,
    UserRole.LOGISTICS_PARTNER,
    UserRole.MATERIAL_SUPPLIER,
  ];

  private static canHaveAssignedAgent(roles: UserRole[]): boolean {
    return roles.some((r) => UsersService.ROLES_WITH_ASSIGNED_AGENT.includes(r));
  }

  async update(
    id: string,
    data: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      productionCountry?: string;
      roles?: UserRole[];
      status?: UserStatus;
      /** Buyer company profile JSON (admin + synced with buyer portal) */
      buyerCompanyProfile?: Prisma.InputJsonValue | null;
      /** Admin: link a COMMERCIAL_AGENT to this grower / logistics / material supplier */
      assignedAgentUserId?: string | null;
      /** Admin: field office for COMMERCIAL_AGENT users */
      commercialAgentProfile?: {
        officeName?: string | null;
        address: string;
        city: string;
        country: string;
        postalCode?: string | null;
      } | null;
    },
  ) {
    const existing = await this.prisma.users.findUnique({
      where: { id },
      select: { roles: true, status: true, email: true, firstName: true },
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const updateData: Prisma.usersUpdateInput = { updatedAt: new Date() };

    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.productionCountry !== undefined) updateData.productionCountry = data.productionCountry?.trim() || null;
    if (data.roles !== undefined) updateData.roles = data.roles;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.buyerCompanyProfile !== undefined) {
      updateData.buyerCompanyProfile = data.buyerCompanyProfile;
    }

    const effectiveRoles = data.roles !== undefined ? data.roles : existing.roles;
    if (data.roles !== undefined && !UsersService.canHaveAssignedAgent(data.roles)) {
      updateData.assignedCommercialAgent = { disconnect: true };
    }
    if (
      data.roles !== undefined &&
      !data.roles.includes(UserRole.COMMERCIAL_AGENT) &&
      existing.roles.includes(UserRole.COMMERCIAL_AGENT)
    ) {
      updateData.commercial_agent_profile = { delete: true };
    }

    if (data.assignedAgentUserId !== undefined) {
      if (!UsersService.canHaveAssignedAgent(effectiveRoles)) {
        if (data.assignedAgentUserId !== null) {
          throw new BadRequestException(
            'Only growers, farmers, logistics partners, and B2B suppliers can have an assigned commercial agent',
          );
        }
      } else if (data.assignedAgentUserId === null) {
        updateData.assignedCommercialAgent = { disconnect: true };
      } else {
        if (data.assignedAgentUserId === id) {
          throw new BadRequestException('A user cannot be assigned as their own commercial agent');
        }
        const agent = await this.prisma.users.findUnique({
          where: { id: data.assignedAgentUserId },
          select: { roles: true, status: true },
        });
        if (!agent || agent.status !== UserStatus.ACTIVE) {
          throw new BadRequestException('Invalid commercial agent');
        }
        if (!agent.roles.includes(UserRole.COMMERCIAL_AGENT)) {
          throw new BadRequestException('Assigned user must have the commercial agent role');
        }
        updateData.assignedCommercialAgent = { connect: { id: data.assignedAgentUserId } };
      }
    }

    if (data.commercialAgentProfile !== undefined) {
      if (!effectiveRoles.includes(UserRole.COMMERCIAL_AGENT)) {
        if (data.commercialAgentProfile != null) {
          throw new BadRequestException('Field office is only for users with the commercial agent role');
        }
        // If role was removed, office delete is already set above; null body is a no-op here.
      } else if (data.commercialAgentProfile === null) {
        updateData.commercial_agent_profile = { delete: true };
      } else {
        const p = data.commercialAgentProfile;
        updateData.commercial_agent_profile = {
          upsert: {
            create: {
              id: crypto.randomUUID(),
              address: p.address.trim(),
              city: p.city.trim(),
              country: p.country.trim(),
              postalCode: p.postalCode?.trim() || null,
              officeName: p.officeName?.trim() || null,
            },
            update: {
              address: p.address.trim(),
              city: p.city.trim(),
              country: p.country.trim(),
              postalCode: p.postalCode?.trim() || null,
              officeName: p.officeName?.trim() || null,
            },
          },
        };
      }
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data: updateData,
      include: {
        assignedCommercialAgent: {
          include: { commercial_agent_profile: true },
        },
        commercial_agent_profile: true,
      },
    });

    const becameActiveBuyer =
      existing.status === UserStatus.PENDING_VERIFICATION &&
      data.status === UserStatus.ACTIVE &&
      existing.roles.includes(UserRole.BUYER);
    if (becameActiveBuyer) {
      void this.notificationsService
        .notifyBuyerAccountApproved({
          buyerId: id,
          firstName: updated.firstName,
          email: updated.email,
        })
        .catch((e) => this.logger.warn(`notifyBuyerAccountApproved: ${e instanceof Error ? e.message : e}`));
      if (updated.email) {
        void this.emailService
          .sendBuyerAccountApprovedEmail({
            email: updated.email,
            firstName: updated.firstName,
          })
          .catch((e) => this.logger.warn(`sendBuyerAccountApprovedEmail: ${e instanceof Error ? e.message : e}`));
      }
    }

    return updated;
  }

  /** Logged-in user changes password (any role with JWT). */
  async changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from the current one');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { passwordHash, updatedAt: new Date() },
    });
    return { ok: true };
  }

  /**
   * Admin generates a new random password for a user (e.g. supplier lost temp password).
   * Returns the plain password once; old password is invalidated.
   */
  async adminResetPasswordForUser(actingAdminId: string, targetUserId: string) {
    if (actingAdminId === targetUserId) {
      throw new BadRequestException('Use “Change password” in your account settings, or ask another admin.');
    }
    const target = await this.prisma.users.findUnique({
      where: { id: targetUserId },
      select: { id: true, partnerCode: true, email: true, roles: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.roles.includes(UserRole.SUPER_ADMIN)) {
      const actor = await this.prisma.users.findUnique({
        where: { id: actingAdminId },
        select: { roles: true },
      });
      if (!actor?.roles.includes(UserRole.SUPER_ADMIN)) {
        throw new ForbiddenException('Only a super admin can reset another super admin password');
      }
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let temporaryPassword = '';
    for (let i = 0; i < 12; i++) {
      temporaryPassword += chars.charAt(crypto.randomInt(chars.length));
    }
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.users.update({
      where: { id: targetUserId },
      data: { passwordHash, updatedAt: new Date() },
    });
    return {
      partnerCode: target.partnerCode,
      email: target.email,
      temporaryPassword,
    };
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
