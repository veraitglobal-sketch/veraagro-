import { Injectable, Logger, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole, UserStatus } from '@prisma/client';
import { GeometryUtil } from '../common/utils/geometry.util';
import { RegisterBuyerDto } from './dto/register-buyer.dto';
import { RegisterGrowerDto } from './dto/register-grower.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  /** Delivery address from registration → persisted on users.buyerCompanyProfile for checkout prefill. */
  buildBuyerCompanyProfileFromRegistration(data: RegisterBuyerDto) {
    const address = data.address?.trim();
    const city = data.city?.trim();
    if (!address || !city) return undefined;

    const postalCode = data.postalCode?.trim() || '';
    const country = data.country?.trim() || '';
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const headquarters = [address, postalCode, city, country].filter(Boolean).join(', ');

    return {
      company: {
        legalEntity: data.businessName?.trim() || fullName,
        taxId: '',
        headquarters,
        generalDirector: fullName,
        financeManager: '',
      },
      deliveryLocations: [
        {
          id: crypto.randomUUID(),
          alias: 'Primary',
          address,
          city,
          postalCode,
          country,
          latitude: data.location?.latitude ?? 0,
          longitude: data.location?.longitude ?? 0,
          responsiblePerson: fullName,
          responsiblePhone: data.phone?.trim() || '',
        },
      ],
      authorizedPersonnel: [],
    };
  }

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

    if (user.roles.includes(UserRole.BUYER)) {
      const pendingEmail = await this.prisma.email_verification_tokens.findUnique({
        where: { userId: user.id },
      });
      if (pendingEmail) {
        throw new UnauthorizedException({
          message: 'Please verify your email with the 4-digit code we sent you.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException({
        message: 'Your account is waiting for approval by Bio Vera.',
        code: 'ACCOUNT_PENDING_APPROVAL',
      });
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
        /** Admin-assigned commercial agent (growers, logistics, B2B suppliers) */
        assignedCommercialAgent: user.assignedCommercialAgent ?? null,
      },
    };
  }

  /** Small square polygon (~10 m) anchored on a GPS point — used for grower farm registration. */
  private farmAnchorPolygon(latitude: number, longitude: number) {
    const d = 0.0001;
    return [
      { lat: latitude, lng: longitude },
      { lat: latitude + d, lng: longitude },
      { lat: latitude + d, lng: longitude + d },
      { lat: latitude, lng: longitude + d },
    ];
  }

  /**
   * Register a commercial buyer (self-registration or with partner code).
   * Delivery location (incl. GPS) is stored on buyerCompanyProfile only — never as a hub.
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
    if (data.location) {
      if (!data.address?.trim() || !data.city?.trim()) {
        throw new BadRequestException('Address and city are required when location is provided');
      }
      if (!data.postalCode?.trim() || !data.country?.trim()) {
        throw new BadRequestException('Postal code and country are required when location is provided');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const buyerCompanyProfile = this.buildBuyerCompanyProfileFromRegistration(data);
    const verificationCode = this.generateEmailVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const createdUser = await this.prisma.$transaction(async (tx) => {
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
          status: UserStatus.PENDING_VERIFICATION,
          buyerCompanyProfile: buyerCompanyProfile as any,
          preferredLanguage: data.preferredLanguage?.trim() || 'en',
          updatedAt: new Date(),
        } as any,
      });

      await tx.email_verification_tokens.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          token: verificationCode,
          expiresAt: verificationExpiresAt,
        },
      });

      return user;
    });

    void this.emailService
      .sendBuyerVerificationCodeEmail({
        email: data.email,
        firstName: data.firstName,
        code: verificationCode,
        preferredLanguage: data.preferredLanguage,
        expiresInMinutes: 15,
      })
      .then((ok) => {
        if (!ok) {
          this.logger.error(
            `buyer verification email NOT sent user=${data.email} — check RESEND_API_KEY and EMAIL_FROM`,
          );
        }
      })
      .catch((e) =>
        this.logger.error(
          `buyer verification email failed user=${data.email}: ${e instanceof Error ? e.message : e}`,
        ),
      );

    const buyerLabel = [data.businessName, `${data.firstName} ${data.lastName}`.trim()]
      .filter(Boolean)
      .join(' — ');
    void this.notificationsService
      .notifyAdminsForNewBuyerRegistration({
        buyerLabel,
        email: data.email,
      })
      .catch(() => undefined);

    return {
      status: 'PENDING_EMAIL_VERIFICATION',
      message:
        'Registration received. Enter the 4-digit code we sent to your email. Your account will be reviewed by Bio Vera after verification.',
      email: createdUser.email,
      requiresEmailVerification: true,
      requiresAdminApproval: true,
    };
  }

  /** 4-digit numeric code for buyer email verification. */
  private generateEmailVerificationCode(): string {
    return String(crypto.randomInt(1000, 10000));
  }

  async verifyEmailCode(email: string, code: string) {
    const user = await this.prisma.users.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    const record = await this.prisma.email_verification_tokens.findUnique({
      where: { userId: user.id },
    });
    if (!record) {
      return {
        success: true,
        message: 'Email already verified. Your account is waiting for approval by Bio Vera.',
        requiresAdminApproval: user.status === UserStatus.PENDING_VERIFICATION,
      };
    }
    if (record.expiresAt < new Date()) {
      await this.prisma.email_verification_tokens.delete({ where: { id: record.id } });
      throw new BadRequestException('Verification code expired. Request a new code.');
    }
    if (record.token !== code.trim()) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.email_verification_tokens.delete({ where: { id: record.id } });

    return {
      success: true,
      message:
        'Email verified. Your buyer account is waiting for approval by Bio Vera — we will email you when you can sign in and order.',
      requiresAdminApproval: user.status === UserStatus.PENDING_VERIFICATION,
    };
  }

  async resendBuyerVerificationCode(email: string) {
    const user = await this.prisma.users.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
    if (!user || !user.roles.includes(UserRole.BUYER)) {
      return { success: true, message: 'If the account exists, a new code has been sent.' };
    }

    const existing = await this.prisma.email_verification_tokens.findUnique({
      where: { userId: user.id },
    });
    if (!existing) {
      return { success: true, message: 'Email is already verified.' };
    }

    const code = this.generateEmailVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.email_verification_tokens.update({
      where: { id: existing.id },
      data: { token: code, expiresAt },
    });

    void this.emailService
      .sendBuyerVerificationCodeEmail({
        email: user.email!,
        firstName: user.firstName,
        code,
        preferredLanguage: user.preferredLanguage,
        expiresInMinutes: 15,
      })
      .catch(() => undefined);

    return { success: true, message: 'A new verification code has been sent to your email.' };
  }

  /**
   * Register a grower (farmer) - requires email verification to activate
   */
  async registerGrower(data: RegisterGrowerDto) {
    const existingEmail = await this.prisma.users.findFirst({ where: { email: data.email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    if (data.location && (!data.address || !data.city)) {
      throw new BadRequestException('Address and city are required when location is provided');
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

      if (data.location && data.address && data.city) {
        const estateId = crypto.randomUUID();
        const polygon = this.farmAnchorPolygon(data.location.latitude, data.location.longitude);
        const calculatedArea =
          data.totalHectares && data.totalHectares > 0
            ? data.totalHectares
            : GeometryUtil.calculatePolygonArea(polygon);
        await tx.estates.create({
          data: {
            id: estateId,
            name: data.farmName?.trim() || `${data.firstName} ${data.lastName} — ${data.city}`,
            ownerId: user.id,
            estateQrCode: `ESTATE-${estateId.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
            polygonCoordinates: polygon as any,
            calculatedArea,
            status: 'PENDING_SETUP',
            updatedAt: new Date(),
          },
        });
      }

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

  /** Self-service password reset — always returns generic success (no email enumeration). */
  async requestPasswordReset(email: string) {
    const generic = {
      success: true,
      message: 'If an account exists for this email, we sent a password reset link.',
    };

    const user = await this.prisma.users.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
    if (!user?.email?.trim()) {
      return generic;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.password_reset_tokens.upsert({
      where: { userId: user.id },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        token,
        expiresAt,
      },
      update: { token, expiresAt },
    });

    void this.emailService
      .sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        resetToken: token,
        preferredLanguage: user.preferredLanguage,
        expiresInMinutes: 60,
      })
      .then((ok) => {
        if (!ok) {
          this.logger.error(`password reset email NOT sent user=${user.email} — check RESEND_API_KEY`);
        }
      })
      .catch((e) =>
        this.logger.error(
          `password reset email failed user=${user.email}: ${e instanceof Error ? e.message : e}`,
        ),
      );

    return generic;
  }

  async resetPassword(token: string, password: string) {
    const record = await this.prisma.password_reset_tokens.findUnique({
      where: { token: token.trim() },
      include: { users: true },
    });
    if (!record) {
      throw new BadRequestException('Invalid or expired reset link. Request a new one.');
    }
    if (record.expiresAt < new Date()) {
      await this.prisma.password_reset_tokens.delete({ where: { id: record.id } });
      throw new BadRequestException('Reset link expired. Request a new one.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Reset link proves email ownership — clear pending 4-digit verification so login is not blocked.
    await this.prisma.$transaction([
      this.prisma.users.update({
        where: { id: record.userId },
        data: { passwordHash, updatedAt: new Date() },
      }),
      this.prisma.password_reset_tokens.delete({ where: { id: record.id } }),
      this.prisma.email_verification_tokens.deleteMany({ where: { userId: record.userId } }),
    ]);

    return {
      success: true,
      message: 'Password updated. You can sign in with your new password.',
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
