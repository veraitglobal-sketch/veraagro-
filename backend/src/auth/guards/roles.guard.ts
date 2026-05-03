import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // Support both old (single role) and new (multiple roles) format
    let userRoles: string[] = [];
    if (user.roles && Array.isArray(user.roles)) {
      userRoles = user.roles;
    } else if (user.role) {
      // Backward compatibility: convert single role to array
      userRoles = [user.role];
    }

    // Map old roles to new roles for backward compatibility
    const roleMapping: Record<string, string> = {
      'FARMER': 'GROWER',
      'PARTNER': 'LOGISTICS_PARTNER',
      'ADMIN': 'SUPER_ADMIN',
      'DRIVER': 'LOGISTICS_PARTNER',
    };

    // Map legacy role names onto newer guard checks; Prisma/UserRole still has both variants.
    const mappedUserRoles = userRoles.map((role) => roleMapping[role] || role);

    /** Raw JWT roles plus mapped equivalents (PARTNER ⇒ must still match decorators that list PARTNER). */
    const effectiveRoles = [...new Set([...userRoles, ...mappedUserRoles])];

    return requiredRoles.some((requiredRole) => effectiveRoles.includes(requiredRole));
  }
}
