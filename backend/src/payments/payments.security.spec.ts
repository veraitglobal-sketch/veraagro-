import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import request = require('supertest');
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { WalletsService } from '../wallets/wallets.service';

describe('Payment endpoint authorization (HTTP)', () => {
  let app: INestApplication;
  const payments = { getPayment: jest.fn(), releaseEscrowPayment: jest.fn() };
  const findUnique = jest.fn();
  const jwt = new JwtService({ secret: 'http-test-only' });
  const token = jwt.sign({ sub: 'actor', roles: ['SUPER_ADMIN'] });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [PaymentsController],
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { get: () => 'http-test-only' } },
        { provide: PrismaService, useValue: { users: { findUnique } } },
        { provide: PaymentsService, useValue: payments },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(() => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue({ id: 'actor', roles: ['BUYER'], status: 'ACTIVE' });
    payments.releaseEscrowPayment.mockResolvedValue({ message: 'Payment released and distributed' });
    payments.getPayment.mockResolvedValue({ id: 'payment' });
  });

  it('requires authentication to read payments', async () => {
    await request(app.getHttpServer()).get('/payments/order/order').expect(401);
    expect(payments.getPayment).not.toHaveBeenCalled();
  });
  it('requires authentication to release payments', async () => {
    await request(app.getHttpServer()).post('/payments/order/order/release').expect(401);
    expect(payments.releaseEscrowPayment).not.toHaveBeenCalled();
  });
  it.each(['BUYER', 'GROWER', 'DRIVER', 'LOGISTICS_PARTNER'])('denies direct release by %s even with stale admin claims', async (role) => {
    findUnique.mockResolvedValue({ id: 'actor', roles: [role], status: 'ACTIVE' });
    await request(app.getHttpServer()).post('/payments/order/order/release').auth(token, { type: 'bearer' }).expect(403);
    expect(payments.releaseEscrowPayment).not.toHaveBeenCalled();
  });
  it.each(['ADMIN', 'SUPER_ADMIN'])('allows operational release by %s', async (role) => {
    findUnique.mockResolvedValue({ id: 'actor', roles: [role], status: 'ACTIVE' });
    await request(app.getHttpServer()).post('/payments/order/order/release').auth(token, { type: 'bearer' }).expect(201);
    expect(payments.releaseEscrowPayment).toHaveBeenCalledWith('order');
  });
  it('passes the verified actor to the scoped payment read', async () => {
    await request(app.getHttpServer()).get('/payments/order/order').auth(token, { type: 'bearer' }).expect(200);
    expect(payments.getPayment).toHaveBeenCalledWith('order', expect.objectContaining({ id: 'actor', roles: ['BUYER'] }));
  });
  it('denies a suspended administrator with an unexpired token', async () => {
    findUnique.mockResolvedValue({ id: 'actor', roles: ['ADMIN'], status: 'SUSPENDED' });
    await request(app.getHttpServer()).post('/payments/order/order/release').auth(token, { type: 'bearer' }).expect(401);
    expect(payments.releaseEscrowPayment).not.toHaveBeenCalled();
  });
});

describe('Payment read scope', () => {
  const findFirst = jest.fn();
  let service: PaymentsService;
  beforeEach(() => {
    findFirst.mockReset();
    service = new PaymentsService(
      { payments: { findFirst } } as unknown as PrismaService,
      {} as WalletsService,
      new ConfigService(),
    );
  });
  it('requires a buyer, estate owner, fulfilling grower or assigned driver relation', async () => {
    findFirst.mockResolvedValue(null);
    await expect(service.getPayment('other-order', { id: 'outsider', roles: ['BUYER'] })).rejects.toBeInstanceOf(NotFoundException);
    const where = findFirst.mock.calls[0][0].where;
    expect(where).toEqual({
      orderId: 'other-order',
      orders: { OR: [
        { buyerId: 'outsider' },
        { estates: { ownerId: 'outsider' } },
        { fulfilling_estate: { ownerId: 'outsider' } },
        { deliveries: { driverId: 'outsider' } },
      ] },
    });
  });
  it.each(['ADMIN', 'SUPER_ADMIN'])('allows %s to read a payment without an order relationship', async (role) => {
    findFirst.mockResolvedValue({ id: 'payment' });
    await expect(service.getPayment('order', { id: 'admin', roles: [role] })).resolves.toEqual({ id: 'payment' });
    expect(findFirst.mock.calls[0][0].where).toEqual({ orderId: 'order' });
  });
});
