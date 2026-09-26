import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

describe('Administrator account management', () => {
  const findUnique = jest.fn();
  let service: UsersService;
  let controller: UsersController;
  let create: jest.SpyInstance;
  let update: jest.SpyInstance;
  const admin = { user: { id: 'admin', roles: [UserRole.ADMIN] } };
  const superAdmin = { user: { id: 'super', roles: [UserRole.SUPER_ADMIN] } };

  beforeEach(() => {
    findUnique.mockReset();
    service = new UsersService({ users: { findUnique } } as any);
    create = jest.spyOn(service, 'create').mockResolvedValue({ id: 'new-user' } as any);
    update = jest.spyOn(service, 'update').mockResolvedValue({ id: 'target' } as any);
    controller = new UsersController(service, {} as any);
  });

  it.each([
    { roles: [UserRole.SUPER_ADMIN] },
    { role: UserRole.SUPER_ADMIN },
  ])('prevents creating a superadministrator using modern or legacy role fields: %j', async (roles) => {
    await expect(controller.createUser(admin, {
      partnerCode: 'NEW', firstName: 'New', lastName: 'User', ...roles,
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(create).not.toHaveBeenCalled();
  });

  it('prevents an administrator promoting their own account', async () => {
    await expect(controller.updateUser(admin, 'admin', { roles: [UserRole.SUPER_ADMIN] })).rejects.toBeInstanceOf(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    { roles: [UserRole.BUYER] },
    { email: 'changed@example.invalid' },
  ])('prevents modifying an existing superadministrator: %j', async (body) => {
    findUnique.mockResolvedValue({ roles: [UserRole.SUPER_ADMIN] });
    await expect(controller.updateUser(admin, 'super', body)).rejects.toBeInstanceOf(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });

  it('allows administrators to manage ordinary users', async () => {
    findUnique.mockResolvedValue({ roles: [UserRole.BUYER] });
    await controller.updateUser(admin, 'buyer', { firstName: 'Updated' });
    expect(update).toHaveBeenCalledWith('buyer', { firstName: 'Updated' });
  });

  it('allows actual superadministrators to assign elevated roles', async () => {
    await controller.updateUser(superAdmin, 'target', { roles: [UserRole.SUPER_ADMIN] });
    expect(update).toHaveBeenCalledWith('target', { roles: [UserRole.SUPER_ADMIN] });
  });
});
