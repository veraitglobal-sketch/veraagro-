import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JWT account authorization', () => {
  const findUnique = jest.fn();
  let strategy: JwtStrategy;

  beforeEach(() => {
    findUnique.mockReset();
    strategy = new JwtStrategy(
      { get: () => 'unit-test-only' } as unknown as ConfigService,
      { users: { findUnique } } as unknown as PrismaService,
    );
  });

  it('uses current database roles rather than elevated stale token claims', async () => {
    findUnique.mockResolvedValue({ id: 'user', partnerCode: 'U1', roles: ['BUYER'], status: 'ACTIVE' });
    await expect(strategy.validate({ sub: 'user', roles: ['SUPER_ADMIN'] })).resolves.toEqual({
      id: 'user', partnerCode: 'U1', roles: ['BUYER'], role: 'BUYER',
    });
  });

  it.each(['SUSPENDED', 'PENDING_VERIFICATION'])('rejects an existing token for a %s user', async (status) => {
    findUnique.mockResolvedValue({ id: 'user', roles: ['ADMIN'], status });
    await expect(strategy.validate({ sub: 'user' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects tokens belonging to deleted users', async () => {
    findUnique.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'deleted' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([undefined, '', 123])('rejects invalid subjects without querying the database: %s', async (sub) => {
    await expect(strategy.validate({ sub })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
