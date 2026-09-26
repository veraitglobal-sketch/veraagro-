import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private prisma: PrismaService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is required. Please set it in Railway environment variables. ' +
        'Go to Railway Dashboard > Your Service > Variables tab > Add JWT_SECRET'
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (typeof payload?.sub !== 'string' || !payload.sub.trim()) {
      throw new UnauthorizedException('Invalid session');
    }
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: { id: true, partnerCode: true, roles: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    // Authorize against current database roles, never stale claims in a token.
    return {
      id: user.id,
      partnerCode: user.partnerCode,
      roles: user.roles,
      role: user.roles[0], // Backward compatibility
    };
  }
}
