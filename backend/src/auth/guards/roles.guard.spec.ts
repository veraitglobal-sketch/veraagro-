import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('Role boundaries', () => {
  const allowed = (roles: string[], required: string[]) => {
    const reflector = { getAllAndOverride: () => required } as unknown as Reflector;
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user: { roles } }) }),
    } as unknown as ExecutionContext;
    return new RolesGuard(reflector).canActivate(context);
  };

  it('does not promote ADMIN to SUPER_ADMIN', () => {
    expect(allowed(['ADMIN'], ['SUPER_ADMIN'])).toBe(false);
  });
  it('accepts an actual SUPER_ADMIN', () => {
    expect(allowed(['SUPER_ADMIN'], ['SUPER_ADMIN'])).toBe(true);
  });
  it('keeps ordinary administrator routes accessible', () => {
    expect(allowed(['ADMIN'], ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
  });
  it('keeps legacy grower aliases working', () => {
    expect(allowed(['FARMER'], ['GROWER'])).toBe(true);
  });
  it('does not give a buyer administrator access', () => {
    expect(allowed(['BUYER'], ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
  });
});
