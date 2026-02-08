import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
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
    return { 
      id: payload.sub, 
      partnerCode: payload.partnerCode,
      roles: payload.roles || (payload.role ? [payload.role] : []), // Support both formats
      role: payload.role, // Backward compatibility
    };
  }
}
