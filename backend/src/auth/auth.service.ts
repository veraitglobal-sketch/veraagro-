import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus, HubStatus } from '@prisma/client';
import { RegisterBuyerDto } from './dto/register-buyer.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
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
   * Register a commercial buyer (mini market, piljarnica)
   * Automatically creates a Hub location if location data is provided
   */
  async registerBuyer(data: RegisterBuyerDto) {
    // Check if partner code already exists
    const existingUser = await this.usersService.findByPartnerCode(data.partnerCode);
    if (existingUser) {
      throw new ConflictException('Partner code already exists');
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
          partnerCode: data.partnerCode,
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
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
}
