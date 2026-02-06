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

    // Map user roles to new role names
    const mappedUserRoles = userRoles.map(role => roleMapping[role] || role);

    // Check if user has at least one of the required roles
    return requiredRoles.some((requiredRole) => mappedUserRoles.includes(requiredRole));
  }
}
