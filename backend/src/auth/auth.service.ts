import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UserRole, UserStatus, HubStatus } from '@prisma/client';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterGrowerDto } from './dto/register-grower.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    // Support both email and partnerCode for login
    const user = await this.usersService.findByEmailOrPartnerCode(identifier);
    
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const { passwordHash, ...result } = user;
    
    // Ensure roles is always an array
    if (!result.roles) {
      result.roles = [];
    }
    
    return result;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      partnerCode: user.partnerCode,
      roles: user.roles || [user.role] // Support both old (single role) and new (multiple roles) format
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        partnerCode: user.partnerCode,
        roles: user.roles || [user.role], // Return array of roles
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Register a commercial buyer (self-registration or with partner code)
   * Email is required; partnerCode is auto-generated if not provided.
   * Automatically creates a Hub location if location data is provided.
   */
  async registerBuyer(data: RegisterBuyerDto) {
    // Email must be unique
    const existingEmail = await this.prisma.users.findFirst({ where: { email: data.email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Resolve partner code: use provided or generate unique (BUYER-{timestamp}-{random})
    let partnerCode = (data.partnerCode || '').trim();
    if (!partnerCode) {
      partnerCode = `BUYER-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    } else {
      const existingPartner = await this.usersService.findByPartnerCode(partnerCode);
      if (existingPartner) {
        throw new ConflictException('Partner code already exists');
      }
    }

    // Validate location data if provided
    if (data.location && (!data.address || !data.city)) {
      throw new BadRequestException('Address and city are required when location is provided');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create buyer user
      const user = await tx.users.create({
        data: {
          id: crypto.randomUUID(),
          partnerCode,
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          companyPosition: data.companyPosition,
          passwordHash,
          roles: [UserRole.BUYER],
          status: UserStatus.PENDING_VERIFICATION, // Requires admin approval
          updatedAt: new Date(),
        } as any,
      });

      // If location data is provided, create Hub automatically
      let hub = null;
      if (data.location && data.address && data.city) {
        hub = await tx.hubs.create({
          data: {
            name: data.businessName || `${data.firstName} ${data.lastName} - ${data.city}`,
            location: {
              lat: data.location.latitude,
              lng: data.location.longitude,
            },
            address: data.address,
            city: data.city,
            status: HubStatus.ACTIVE,
            managerId: user.id, // Link hub to buyer
            updatedAt: new Date(),
          } as any,
        });
      }

      return { user, hub };
    });

    // Generate JWT token
    const payload = {
      sub: result.user.id,
      partnerCode: result.user.partnerCode,
      roles: result.user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: result.user.id,
        partnerCode: result.user.partnerCode,
        roles: result.user.roles,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      hub: result.hub ? {
        id: result.hub.id,
        name: result.hub.name,
        address: result.hub.address,
        city: result.hub.city,
        location: result.hub.location,
      } : null,
      message: result.hub 
        ? 'Buyer registered successfully. Hub location created and will appear on the map after admin approval.'
        : 'Buyer registered successfully. Add location in profile to appear on map.',
    };
  }

  /**
   * Register a grower (farmer) - requires email verification to activate
   */
  async registerGrower(data: RegisterGrowerDto) {
    const existingEmail = await this.prisma.users.findFirst({ where: { email: data.email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const partnerCode = await this.generateUniquePartnerCode();

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id: crypto.randomUUID(),
          partnerCode,
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
          roles: [UserRole.FARMER],
          status: UserStatus.PENDING_VERIFICATION,
          farmerQrCode: `FARMER-${partnerCode}`,
          farmerProfileUrl: `${process.env.FRONTEND_URL || 'https://biovera.app'}/farmer/FARMER-${partnerCode}`,
          updatedAt: new Date(),
        } as any,
      });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await tx.email_verification_tokens.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          token,
          expiresAt,
        },
      });

      return { user, token };
    });

    const webUrl = process.env.FRONTEND_URL || process.env.WEB_URL || 'https://biovera.app';
    const verificationLink = `${webUrl}/verify-email?token=${result.token}`;

    await this.emailService.sendVerificationEmail({
      email: data.email,
      firstName: data.firstName,
      verificationLink,
      expiresInHours: 24,
    });

    return {
      message: 'Registration successful. Please check your email to verify your account and continue.',
      email: data.email,
      requiresEmailVerification: true,
    };
  }

  /**
   * Verify email from token - activates account
   */
  async verifyEmail(token: string) {
    const record = await this.prisma.email_verification_tokens.findUnique({
      where: { token },
      include: { users: true },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification link');
    }
    if (record.expiresAt < new Date()) {
      await this.prisma.email_verification_tokens.delete({ where: { id: record.id } });
      throw new BadRequestException('Verification link has expired');
    }

    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: record.userId },
        data: { status: UserStatus.ACTIVE, updatedAt: new Date() } as any,
      }),
      this.prisma.email_verification_tokens.delete({ where: { id: record.id } }),
    ]);

    const user = await this.prisma.users.findUnique({
      where: { id: record.userId },
    });

    const payload = {
      sub: user!.id,
      partnerCode: user!.partnerCode,
      roles: user!.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user!.id,
        partnerCode: user!.partnerCode,
        roles: user!.roles,
        firstName: user!.firstName,
        lastName: user!.lastName,
      },
      message: 'Email verified. Account activated. You can now add your fields and continue.',
    };
  }

  private async generateUniquePartnerCode(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const code = `FARMER-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const existing = await this.usersService.findByPartnerCode(code);
      if (!existing) return code;
      attempts++;
    }
    throw new BadRequestException('Could not generate unique partner code. Please try again.');
  }
}
