import { randomUUID } from 'crypto';
import { receivingCodeFor } from '../src/digital-handover/receiving-code';
import { ReturnDispositionService } from '../src/deliveries/return-disposition.service';
import { RefundReconciliationService } from '../src/deliveries/refund-reconciliation.service';
import { WalletsController } from '../src/wallets/wallets.controller';
import { ReturnsController } from '../src/deliveries/returns.controller';
import { ReturnsService } from '../src/deliveries/returns.service';
import { MissionsController } from '../src/missions/missions.controller';
import { MissionsService } from '../src/missions/missions.service';
import { FreshnessService } from '../src/freshness/freshness.service';
import { MaterialControlService } from '../src/material-control/material-control.service';
import { AuditTrailService } from '../src/audit-trail/audit-trail.service';
import sharp = require('sharp');
import { DigitalHandoverController } from '../src/digital-handover/digital-handover.controller';
import { DigitalHandoverService } from '../src/digital-handover/digital-handover.service';
import { BlockchainService } from '../src/blockchain/blockchain.service';
import { BatchesService } from '../src/batches/batches.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import request = require('supertest');
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { PaymentsController } from '../src/payments/payments.controller';
import { PaymentsService } from '../src/payments/payments.service';
import { WalletsService } from '../src/wallets/wallets.service';
import { EmailService } from '../src/email/email.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { InvoicesService } from '../src/invoices/invoices.service';
import { DeliveriesController } from '../src/deliveries/deliveries.controller';
import { DeliveriesService } from '../src/deliveries/deliveries.service';
import { WaybillsService } from '../src/waybills/waybills.service';
import { InventoryController } from '../src/inventory/inventory.controller';
import { InventoryService } from '../src/inventory/inventory.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { LocalStrategy } from '../src/auth/strategies/local.strategy';
import { UsersService } from '../src/users/users.service';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { PushNotificationService } from '../src/notifications/push-notification.service';
import { NotificationsGateway } from '../src/notifications/notifications.gateway';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as bcrypt from 'bcrypt';

const browserCheck = process.env.BIOVERA_BROWSER_TEST === '1';

const testUrl = process.env.BIOVERA_TEST_DATABASE_URL;
if (!testUrl || process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL !== testUrl) {
  throw new Error('Run with npm run test:integration; an isolated test database is required.');
}
const parsed = new URL(testUrl);
if (parsed.hostname !== '127.0.0.1' || parsed.pathname !== '/biovera_test') {
  throw new Error('Refusing to test against a non-local or non-test database.');
}

describe('Orders, payments and delivery — real PostgreSQL + HTTP', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let payments: PaymentsService;
  const jwt = new JwtService({ secret: 'isolated-integration-test-secret' });
  const token = (id: string) => jwt.sign({ sub: id });
  const post = (url: string, actor = 'buyer') => request(app.getHttpServer()).post(url).auth(token(actor), { type: 'bearer' });
  const address = { street: 'Test 1', city: 'Test City', postalCode: '10000', country: 'Serbia' };
  const payload = (changes: Record<string, unknown> = {}) => ({
    productId: 'stock', estateId: 'farm', productName: 'Tomato', quantity: 10,
    unit: 'kg', unitPrice: 2.5, deliveryAddress: address, ...changes,
  });
  const invoices = { generateInvoice: jest.fn().mockResolvedValue({}) };

  beforeAll(async () => {
    const values = { JWT_SECRET: 'isolated-integration-test-secret', PLATFORM_WALLET_USER_ID: 'admin' };
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [WalletsController, ReturnsController, MissionsController, DigitalHandoverController, OrdersController, PaymentsController, DeliveriesController, InventoryController, AuthController, NotificationsController],
      providers: [ReturnDispositionService, RefundReconciliationService, ReturnsService, DigitalHandoverService, MissionsService, AuditTrailService,
        { provide: FreshnessService, useValue: {} },
        { provide: MaterialControlService, useValue: {} },
        { provide: BlockchainService, useValue: { isEnabled: () => false } },
        { provide: BatchesService, useValue: { markDelivered: async () => undefined } },
        ...(!browserCheck ? [{ provide: NotificationsGateway, useValue: { sendNotificationToUser: async () => undefined, notifyMissionUpdate: async () => undefined } }] : []),
        PrismaService, JwtStrategy, OrdersService, PaymentsService, WalletsService, DeliveriesService, InventoryService,
        AuthService, LocalStrategy, UsersService,
        { provide: JwtService, useValue: jwt },
        { provide: PushNotificationService, useValue: { sendToUser: async () => undefined, isEnabled: () => false } },
        { provide: ConfigService, useValue: { get: (key: string, fallback?: unknown) => values[key] ?? fallback } },
        { provide: EmailService, useValue: { sendNewOrderAdminNotification: jest.fn().mockResolvedValue(undefined) } },
        ...(browserCheck ? [NotificationsService, NotificationsGateway] : [{ provide: NotificationsService, useValue: { notifyAdminsForNewOrder: jest.fn().mockResolvedValue(undefined), create: jest.fn().mockResolvedValue({}) } }]),
        { provide: InvoicesService, useValue: invoices },
        { provide: WaybillsService, useValue: { generateWaybill: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    app.enableCors({ origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/ });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    await app.listen(0, '127.0.0.1');
    prisma = app.get(PrismaService);
    payments = app.get(PaymentsService);
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(async () => {
    jest.restoreAllMocks();
    invoices.generateInvoice.mockClear();
    // This fixture only connects to the disposable database guarded above.
    await prisma.$executeRawUnsafe('TRUNCATE TABLE users, market_prices CASCADE');
    for (const [id, role] of Object.entries({ admin: UserRole.SUPER_ADMIN, buyer: UserRole.BUYER, outsider: UserRole.BUYER, farmer: UserRole.GROWER, driver: UserRole.DRIVER, logistics: UserRole.LOGISTICS_PARTNER })) {
      await prisma.users.create({ data: { id, partnerCode: id, firstName: id, lastName: 'Test', passwordHash: 'not-a-login-password', roles: [role], status: 'ACTIVE', updatedAt: new Date() } });
    }
    await prisma.estates.create({ data: { id: 'farm', ownerId: 'farmer', name: 'Test farm', polygonCoordinates: {}, calculatedArea: 1, status: 'ACTIVE', updatedAt: new Date() } });
    await prisma.estates.create({ data: { id: 'biov-vera-platform', ownerId: 'admin', name: 'Test platform', polygonCoordinates: {}, calculatedArea: 0, status: 'ACTIVE', updatedAt: new Date() } });
    await prisma.hubs.create({ data: { id: 'hub', name: 'Test hub', city: 'Test City', address: 'Test', location: {}, updatedAt: new Date() } });
    await prisma.inventory.create({ data: { id: 'stock', estateId: 'farm', hubId: 'hub', productName: 'Tomato', quantity: 100, unit: 'kg', unitPrice: 2.5, availableCities: [], updatedAt: new Date() } });
  });

  async function createApproved() {
    const created = await post('/orders').send(payload()).expect(201);
    await post(`/orders/admin/${created.body.id}/approve`, 'admin').expect(201);
    return created.body.id as string;
  }

  (browserCheck ? it : it.skip)('browser checkout persists the order through real login and UI', async () => {
    await prisma.users.update({ where: { id: 'buyer' }, data: { passwordHash: await bcrypt.hash('Buyer-test-2026!', 10) } });
    await new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(__dirname, 'browser-check.cjs')], {
        stdio: 'inherit',
        timeout: 330000,
        env: { ...process.env, BIOVERA_BROWSER_API: app.getHttpServer().address() ? `http://127.0.0.1:${app.getHttpServer().address().port}` : '' },
      });
      child.on('error', reject);
      child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Browser check exited ${code}`)));
    });
    const orders = await prisma.orders.findMany({ where: { buyerId: 'buyer' } });
    expect(orders).toHaveLength(2);
    for (const order of orders) {
      expect(order).toMatchObject({ productName: 'Tomato', quantity: 2, unitPrice: 2.5, totalAmount: 5, status: 'PENDING' });
      expect(order.deliveryAddress).toMatchObject({ street: 'Test 1', city: 'Berlin', postalCode: '10115' });
    }
    expect(await prisma.payments.count()).toBe(0);
  }, 360000);
  async function paidOrder() {
    const id = await createApproved();
    await request(app.getHttpServer()).patch(`/orders/admin/${id}/fulfillment`).auth(token('admin'), { type: 'bearer' }).send({ fulfillingEstateId: 'farm' }).expect(200);
    await post(`/orders/admin/${id}/confirm-bank-payment`, 'admin').send({ transactionId: `bank-${id}` }).expect(201);
    return id;
  }
  async function readyForRelease() {
    const orderId = await paidOrder();
    const delivery = await prisma.deliveries.create({ data: {
      id: `delivery-${orderId}`, orderId, driverId: 'driver', deliveryNumber: `DEL-${orderId}`,
      deliveryQRCode: `QR-${orderId}`, pickupLocation: {}, deliveryLocation: {},
      pickupAddress: 'Test farm', deliveryAddress: 'Test buyer', status: 'CONFIRMED', confirmedAt: new Date(), updatedAt: new Date(),
    } });
    return { orderId, delivery };
  }

  it('creates an order with a trusted catalogue price', async () => {
    const res = await post('/orders').send(payload()).expect(201);
    expect(res.body).toMatchObject({ status: 'PENDING', unitPrice: 2.5, totalAmount: 25, buyerId: 'buyer' });
  });
  it('uses the active sale price both in the catalogue and at checkout', async () => {
    await prisma.market_prices.create({ data: { id: 'price', cropType: 'Tomato', buyPrice: 1, sellPrice: 3, updatedAt: new Date() } });
    await prisma.market_prices.create({ data: { id: 'inactive-price', cropType: 'Tomato', buyPrice: 1, sellPrice: 0.01, isActive: false, createdAt: new Date(Date.now() + 1000), updatedAt: new Date() } });
    const catalogue = await request(app.getHttpServer()).get('/inventory/available').expect(200);
    expect(catalogue.body[0].price).toBe(3);
    expect(catalogue.body[0].estate.id).toBe('farm');
    await post('/orders').send(payload()).expect(409);
    const res = await post('/orders').send(payload({ unitPrice: 3 })).expect(201);
    expect(res.body.totalAmount).toBe(30);
  });
  it('supports the batch and market-price catalogue fallbacks', async () => {
    await prisma.market_prices.create({ data: { id: 'price', cropType: 'Tomato', buyPrice: 1, sellPrice: 2.5, updatedAt: new Date() } });
    await prisma.batches.create({ data: { id: 'batch', batchId: 'BATCH-1', estateId: 'farm', productName: 'Tomato', quantity: 100, unit: 'kg', harvestDate: new Date(), locationHistory: [], updatedAt: new Date() } });
    await post('/orders').send(payload({ productId: 'batch' })).expect(201);
    await post('/orders').send(payload({ productId: 'market-price' })).expect(201);
  });
  it('rejects expired stock and quantities above stock', async () => {
    await post('/orders').send(payload({ quantity: 101 })).expect(400);
    await prisma.inventory.update({ where: { id: 'stock' }, data: { expiresAt: new Date(0) } });
    await post('/orders').send(payload()).expect(400);
    expect(await prisma.orders.count()).toBe(0);
  });
  it('supports old mobile payloads while still enforcing the server price', async () => {
    const legacy = payload({ productId: undefined, deliveryAddress: { street: 'Test', city: 'Test', country: 'Serbia' } });
    await post('/orders').send(legacy).expect(201);
    await post('/orders').send({ ...legacy, unitPrice: 0.01 }).expect(409);
    expect(await prisma.orders.count()).toBe(1);
  });
  it('rejects an ambiguous old-client product instead of guessing its price', async () => {
    await prisma.inventory.create({ data: { id: 'stock-two', estateId: 'farm', hubId: 'hub', productName: 'Tomato', quantity: 100, unit: 'kg', unitPrice: 5, availableCities: [], updatedAt: new Date() } });
    await post('/orders').send(payload({ productId: undefined })).expect(400);
    expect(await prisma.orders.count()).toBe(0);
  });
  it('prevents buyers from inserting their own catalogue price', async () => {
    await post('/inventory').send({ hubId: 'hub', estateId: 'farm', productName: 'Tomato', unit: 'kg', quantity: 100, unitPrice: 0.01 }).expect(403);
    expect(await prisma.inventory.count()).toBe(1);
  });
  it.each([0, -1, '10', null])('rejects invalid quantity %j before writing an order', async (quantity) => {
    await post('/orders').send(payload({ quantity })).expect(400);
    expect(await prisma.orders.count()).toBe(0);
  });
  it('rejects a buyer-supplied discount', async () => {
    await post('/orders').send(payload({ unitPrice: 0.01 })).expect(409);
    expect(await prisma.orders.count()).toBe(0);
  });
  it('rejects a missing product and a forged product name', async () => {
    await post('/orders').send(payload({ productId: 'missing' })).expect(400);
    await post('/orders').send(payload({ productName: 'Expensive fruit' })).expect(400);
  });
  it('rejects malformed delivery addresses', async () => {
    await post('/orders').send(payload({ deliveryAddress: {} })).expect(400);
  });
  it('rejects inactive stock', async () => {
    await prisma.inventory.update({ where: { id: 'stock' }, data: { status: 'RESERVED' } });
    await post('/orders').send(payload()).expect(400);
  });
  it('only allows a buyer or administrator to create a retail order', async () => {
    await post('/orders', 'driver').send(payload()).expect(403);
  });
  it('rejects buyer confirmation of payment and unauthorized admin confirmation', async () => {
    const id = await createApproved();
    await post(`/orders/${id}/pay`).send({ paymentMethod: 'BANK_TRANSFER' }).expect(403);
    await post(`/orders/admin/${id}/confirm-bank-payment`).send({ transactionId: 'fake' }).expect(403);
    expect(await prisma.payments.count()).toBe(0);
    expect((await prisma.orders.findUnique({ where: { id } })).status).toBe('APPROVED');
  });
  it('does not expose an unrelated order payment', async () => {
    const id = await paidOrder();
    await request(app.getHttpServer()).get(`/payments/order/${id}`).auth(token('outsider'), { type: 'bearer' }).expect(404);
    for (const actor of ['buyer', 'farmer', 'admin']) {
      await request(app.getHttpServer()).get(`/payments/order/${id}`).auth(token(actor), { type: 'bearer' }).expect(200);
    }
  });
  it('rolls back PAID if escrow creation fails', async () => {
    const id = await createApproved();
    jest.spyOn(payments, 'createEscrowPayment').mockRejectedValueOnce(new Error('Injected escrow failure'));
    await post(`/orders/admin/${id}/confirm-bank-payment`, 'admin').send({ transactionId: 'bank-1' }).expect(500);
    expect((await prisma.orders.findUnique({ where: { id } })).status).toBe('APPROVED');
    expect(await prisma.payments.count()).toBe(0);
  });
  it('rolls back escrow when setting PAID fails in the same transaction', async () => {
    const id = await createApproved();
    await prisma.$executeRawUnsafe(`CREATE FUNCTION reject_paid() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status = 'PAID' THEN RAISE EXCEPTION 'Injected PAID failure'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER reject_paid BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION reject_paid()');
    try {
      await post(`/orders/admin/${id}/confirm-bank-payment`, 'admin').send({ transactionId: 'bank-1' }).expect(500);
      expect(await prisma.payments.count()).toBe(0);
      expect((await prisma.orders.findUnique({ where: { id } })).status).toBe('APPROVED');
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_paid ON orders');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_paid()');
    }
  });
  it('makes simultaneous confirmations idempotent', async () => {
    const id = await createApproved();
    const responses = await Promise.all([1, 2, 3].map(() => post(`/orders/admin/${id}/confirm-bank-payment`, 'admin').send({ transactionId: 'same-bank-ref' })));
    expect(responses.map((r) => r.status)).toEqual([201, 201, 201]);
    expect(await prisma.payments.count()).toBe(1);
    expect(invoices.generateInvoice).toHaveBeenCalledTimes(1);
  });
  it('does not release funds before delivery confirmation', async () => {
    const id = await paidOrder();
    await post(`/payments/order/${id}/release`, 'admin').expect(400);
    expect(await prisma.wallet_transactions.count()).toBe(0);
  });
  it('credits each recipient once despite simultaneous release requests', async () => {
    const { orderId } = await readyForRelease();
    const responses = await Promise.all([1, 2, 3].map(() => post(`/payments/order/${orderId}/release`, 'admin')));
    expect(responses.map((r) => r.status)).toEqual([201, 201, 201]);
    expect(await prisma.wallet_transactions.count()).toBe(3);
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(17.5);
    expect((await prisma.wallets.findUnique({ where: { userId: 'driver' } })).availableBalance).toBe(5);
    expect((await prisma.wallets.findUnique({ where: { userId: 'admin' } })).availableBalance).toBe(2.5);
  });
  it('preserves the sum when different orders credit the same existing wallets concurrently', async () => {
    const first = await readyForRelease();
    const second = await readyForRelease();
    for (const userId of ['farmer', 'driver', 'admin']) {
      await prisma.wallets.create({ data: { id: `wallet-${userId}`, userId, updatedAt: new Date() } });
    }
    // Hold both transactions after reading the farmer balance to exercise the race deterministically.
    const originalTransaction = prisma.$transaction.bind(prisma);
    let reads = 0;
    let release: () => void;
    const bothRead = new Promise<void>((resolve) => { release = resolve; });
    jest.spyOn(prisma, '$transaction').mockImplementation(((callback: any, options: any) => originalTransaction(async (tx) => {
      const originalFind = tx.wallets.findUnique.bind(tx.wallets);
      tx.wallets.findUnique = (async (args: any) => {
        const value = await originalFind(args);
        if (args.where.userId === 'farmer') {
          if (++reads === 2) release();
          await bothRead;
        }
        return value;
      }) as any;
      return callback(tx);
    }, options)) as any);
    const responses = await Promise.all([first, second].map(({ orderId }) => post(`/payments/order/${orderId}/release`, 'admin')));
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(35);
    expect(await prisma.wallet_transactions.count()).toBe(6);
  });
  it('rolls back every wallet credit if the last recipient cannot be credited', async () => {
    const { orderId } = await readyForRelease();
    const walletService = app.get(WalletsService);
    const original = walletService.creditWalletTx.bind(walletService);
    jest.spyOn(walletService, 'creditWalletTx').mockImplementation(async (...args) => {
      if (args[1] === 'admin') throw new Error('Injected treasury failure');
      return original(...args);
    });
    await post(`/payments/order/${orderId}/release`, 'admin').expect(500);
    expect(await prisma.wallet_transactions.count()).toBe(0);
    expect((await prisma.payments.findUnique({ where: { orderId } })).status).toBe('IN_ESCROW');
  });
  it('creates wallets safely for concurrent first credits from different orders', async () => {
    const first = await readyForRelease();
    const second = await readyForRelease();
    const responses = await Promise.all([first, second].map(({ orderId }) => post(`/payments/order/${orderId}/release`, 'admin')));
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect(await prisma.wallets.count()).toBe(3);
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(35);
    expect(await prisma.wallet_transactions.count()).toBe(6);
  });
  it('splits a small amount into whole cents without creating or losing money', async () => {
    await prisma.inventory.update({ where: { id: 'stock' }, data: { unitPrice: 0.07 } });
    const created = await post('/orders').send(payload({ quantity: 1, unitPrice: 0.07 })).expect(201);
    await post(`/orders/admin/${created.body.id}/approve`, 'admin').expect(201);
    await post(`/orders/admin/${created.body.id}/confirm-bank-payment`, 'admin').send({ transactionId: 'small' }).expect(201);
    const payment = await prisma.payments.findUnique({ where: { orderId: created.body.id } });
    const amounts = [payment.farmerAmount, payment.driverAmount, payment.platformFee];
    amounts.forEach((amount) => expect(Math.abs(amount * 100 - Math.round(amount * 100))).toBeLessThan(1e-8));
    expect(amounts.reduce((sum, amount) => sum + Math.round(amount * 100), 0)).toBe(7);
  });
  it('does not allow drivers to assign deliveries via the legacy logistics role alias', async () => {
    const id = await paidOrder();
    await post('/deliveries/assign', 'driver').send({ orderId: id, driverId: 'driver' }).expect(403);
    expect(await prisma.deliveries.count()).toBe(0);
  });
  it('runs the buyer → admin → driver → buyer flow over HTTP', async () => {
    const id = await paidOrder();
    const assigned = await post('/deliveries/assign', 'admin').send({ orderId: id, driverId: 'driver' }).expect(201);
    await post(`/deliveries/${assigned.body.id}/pickup`, 'driver').expect(201);
    await post(`/deliveries/${assigned.body.id}/in-transit`, 'driver').expect(201);
    await post(`/deliveries/confirm/${assigned.body.deliveryQRCode}`, 'outsider').expect(400);
    await post(`/deliveries/confirm/${assigned.body.deliveryQRCode}`, 'buyer').expect(201);
    expect((await prisma.orders.findUnique({ where: { id } })).status).toBe('COMPLETED');
    expect((await prisma.payments.findUnique({ where: { orderId: id } })).status).toBe('RELEASED');
    expect(await prisma.wallet_transactions.count()).toBe(3);
  });
  it('rejects premature receipt and out-of-order transport transitions', async () => {
    const id = await paidOrder();
    const assigned = await post('/deliveries/assign', 'admin').send({ orderId: id, driverId: 'driver' }).expect(201);
    await post(`/deliveries/confirm/${assigned.body.deliveryQRCode}`).expect(400);
    await post(`/deliveries/${assigned.body.id}/in-transit`, 'driver').expect(400);
    expect(await prisma.wallet_transactions.count()).toBe(0);
    expect((await prisma.payments.findUnique({ where: { orderId: id } })).status).toBe('IN_ESCROW');
  });

  async function transitHandover() {
    const orderId = await paidOrder();
    const delivery = (await post('/deliveries/assign', 'admin').send({ orderId, driverId: 'driver' }).expect(201)).body;
    await post(`/deliveries/${delivery.id}/pickup`, 'driver').expect(201);
    await post(`/deliveries/${delivery.id}/in-transit`, 'driver').expect(201);
    await post('/digital-handover/initiate', 'driver').send({ deliveryId: delivery.id, qrCode: 'STORE-TEST' }).expect(400);
    const handover = (await post('/digital-handover/initiate', 'driver').send({ deliveryId: delivery.id, qrCode: receivingCodeFor(delivery.id) }).expect(201)).body;
    jest.spyOn(app.get(DigitalHandoverService) as any, 'generateDeliveryReceipt').mockResolvedValue(undefined);
    const image = `data:image/png;base64,${(await sharp({ create: { width: 24, height: 24, channels: 3, background: '#298040' } }).png().toBuffer()).toString('base64')}`;
    const body = { handoverId: handover.id, qualityCheck: { visualCheck: 'FRESH', temperature: 4, photoUrls: [image, image, image, image], signature: image } };
    return { orderId, delivery, handover, body, image };
  }

  it('retries driver initiation without duplicating the handover', async () => {
    const { delivery, handover } = await transitHandover();
    const again = await post('/digital-handover/initiate', 'driver').send({ deliveryId: delivery.id, qrCode: receivingCodeFor(delivery.id) }).expect(201);
    expect(again.body.id).toBe(handover.id);
    expect(await prisma.digital_handovers.count()).toBe(1);
    await prisma.digital_handovers.deleteMany();
    const simultaneous = await Promise.all([1, 2, 3].map(() => post('/digital-handover/initiate', 'driver').send({ deliveryId: delivery.id, qrCode: receivingCodeFor(delivery.id) })));
    expect(simultaneous.map((r) => r.status)).toEqual([201, 201, 201]);
    expect(new Set(simultaneous.map((r) => r.body.id)).size).toBe(1);
  });

  it('rejects incomplete receipt/report bodies and unsigned acceptance without server errors', async () => {
    const { body, delivery } = await transitHandover();
    await post('/digital-handover/complete').send({ handoverId: body.handoverId }).expect(400);
    await post('/digital-handover/complete').send({ handoverId: body.handoverId, qualityCheck: [] }).expect(400);
    await post('/digital-handover/complete').send({ ...body, qualityCheck: { ...body.qualityCheck, signature: undefined } }).expect(400);
    await post('/deliveries/buyer/confirm-pickup').send({}).expect(400);
    await post('/deliveries/buyer/report-issue').send({ deliveryId: delivery.id, description: {}, photosBase64: [] }).expect(400);
    await post(`/deliveries/confirm/${delivery.deliveryQRCode}`).expect(400);
    expect(await prisma.wallet_transactions.count()).toBe(0);
  });

  it('rejects phone-local and corrupt image evidence before changing any receipt state', async () => {
    const { body, handover, delivery } = await transitHandover();
    for (const image of ['file:///phone/camera.jpg', 'content://photos/1', 'https://unowned.example/photo.jpg', 'data:image/jpeg;base64,bm90LWFuLWltYWdl']) {
      await post('/digital-handover/complete').send({ ...body, qualityCheck: { ...body.qualityCheck, photoUrls: [image, image] } }).expect(400);
    }
    expect((await prisma.digital_handovers.findUnique({ where: { id: handover.id } })).status).toBe('INITIATED');
    expect((await prisma.deliveries.findUnique({ where: { id: delivery.id } })).status).toBe('IN_TRANSIT');
  });

  it('persists decoded evidence readable by buyer, driver and admin, never an unrelated user', async () => {
    const { body, handover, delivery, orderId } = await transitHandover();
    await post('/digital-handover/complete', 'outsider').send(body).expect(403);
    await post('/digital-handover/complete').send(body).expect(201);
    for (const actor of ['buyer', 'driver', 'admin']) {
      const result = (await request(app.getHttpServer()).get(`/digital-handover/${handover.id}`).auth(token(actor), { type: 'bearer' }).expect(200)).body;
      expect(result.photoUrls).toHaveLength(4);
      expect(result.photoUrls.every((p) => p.startsWith('data:image/jpeg;base64,'))).toBe(true);
      expect(result.signature).toMatch(/^data:image\/png;base64,/);
      expect(JSON.stringify(result)).not.toContain('passwordHash');
      await expect(sharp(Buffer.from(result.photoUrls[0].split(',')[1], 'base64')).metadata()).resolves.toMatchObject({ format: 'jpeg' });
    }
    await request(app.getHttpServer()).get(`/digital-handover/${handover.id}`).auth(token('outsider'), { type: 'bearer' }).expect(403);
    expect((await prisma.orders.findUnique({ where: { id: orderId } })).status).toBe('DELIVERED');
    expect((await prisma.deliveries.findUnique({ where: { id: delivery.id } })).status).toBe('DELIVERED');
  });

  it('commits handover and delivery together and tolerates a lost response or concurrent completion', async () => {
    const { body } = await transitHandover();
    const results = await Promise.all([post('/digital-handover/complete').send(body), post('/digital-handover/complete').send(body)]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(results[0].body.id).toBe(results[1].body.id);
    const retry = await post('/digital-handover/complete').send(body).expect(201);
    expect(retry.body.completedAt).toBe(results[0].body.completedAt);
    expect(await prisma.digital_handovers.count()).toBe(1);
  });

  it('rolls back the receipt and photos when delivery update fails', async () => {
    const { body, handover } = await transitHandover();
    await prisma.$executeRawUnsafe(`CREATE FUNCTION reject_handover_delivery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status = 'DELIVERED' THEN RAISE EXCEPTION 'Injected failure'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER reject_handover_delivery BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION reject_handover_delivery()');
    try {
      await post('/digital-handover/complete').send(body).expect(500);
      const saved = await prisma.digital_handovers.findUnique({ where: { id: handover.id } });
      expect(saved.status).toBe('INITIATED'); expect(saved.photoUrls).toEqual([]);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_handover_delivery ON deliveries');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_handover_delivery()');
    }
    await post('/digital-handover/complete').send(body).expect(201);
  });

  it('keeps completed receipt valid even when optional PDF generation fails', async () => {
    const { body, delivery } = await transitHandover();
    jest.spyOn(app.get(DigitalHandoverService) as any, 'generateDeliveryReceipt').mockRejectedValue(new Error('Injected PDF failure'));
    const silence = jest.spyOn(console, 'error').mockImplementation(() => {});
    await post('/digital-handover/complete').send(body).expect(201);
    silence.mockRestore();
    expect((await prisma.deliveries.findUnique({ where: { id: delivery.id } })).status).toBe('DELIVERED');
  });

  it('creates one photographed dispute, prevents takeover and exposes it only in the admin inbox', async () => {
    const { body, handover, delivery } = await transitHandover();
    const damaged = { ...body, qualityCheck: { ...body.qualityCheck, visualCheck: 'DAMAGED', signature: undefined, notes: 'Damaged crates at receipt' } };
    const results = await Promise.all([post('/digital-handover/complete').send(damaged), post('/digital-handover/complete').send(damaged)]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(await prisma.disputes.count({ where: { handoverId: handover.id } })).toBe(1);
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(400);
    const inbox = (await request(app.getHttpServer()).get('/deliveries/admin/review-inbox').auth(token('admin'), { type: 'bearer' }).expect(200)).body;
    await post(`/deliveries/confirm/${delivery.deliveryQRCode}`).expect(400);
    expect(await prisma.wallet_transactions.count()).toBe(0);
    expect(inbox.disputes).toHaveLength(1);
    expect(inbox.disputes[0].evidencePhotos).toBeUndefined();
    const proof = (await request(app.getHttpServer()).get(`/deliveries/admin/review/dispute/${inbox.disputes[0].id}`).auth(token('admin'), { type: 'bearer' }).expect(200)).body;
    expect(proof.evidencePhotos).toHaveLength(4);
    await request(app.getHttpServer()).get('/deliveries/admin/review-inbox').auth(token('buyer'), { type: 'bearer' }).expect(403);
  });

  it('confirms buyer takeover once, preserves the original deadline and credits wallets once', async () => {
    const { body, delivery } = await transitHandover();
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(400);
    await post('/digital-handover/complete').send(body).expect(201);
    const results = await Promise.all([post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }), post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id })]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(results[0].body.delivery.buyerPickupConfirmedAt).toBe(results[1].body.delivery.buyerPickupConfirmedAt);
    expect(await prisma.wallet_transactions.count()).toBe(3);
    const again = await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(201);
    expect(again.body.delivery.buyerPickupConfirmedAt).toBe(results[0].body.delivery.buyerPickupConfirmedAt);
    const qrRetry = await post(`/deliveries/confirm/${delivery.deliveryQRCode}`).expect(201);
    expect(qrRetry.body.delivery.buyerPickupConfirmedAt).toBe(results[0].body.delivery.buyerPickupConfirmedAt);
  });

  it('persists a buyer report and its photos, deduplicates exact retries, and shows it on buyer reload and admin review', async () => {
    const { body, delivery, orderId, image } = await transitHandover();
    const issue = { deliveryId: delivery.id, description: 'There are damaged apples at the bottom of the crate.', photosBase64: [image] };
    await post('/deliveries/buyer/report-issue').send(issue).expect(400);
    await post('/digital-handover/complete').send(body).expect(201);
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(201);
    await post('/deliveries/buyer/report-issue', 'outsider').send(issue).expect(400);
    const results = await Promise.all([post('/deliveries/buyer/report-issue').send(issue), post('/deliveries/buyer/report-issue').send(issue)]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(results[0].body.id).toBe(results[1].body.id);
    const reloaded = (await request(app.getHttpServer()).get(`/deliveries/buyer/order/${orderId}`).auth(token('buyer'), { type: 'bearer' }).expect(200)).body;
    expect(reloaded.buyer_delivery_issues).toHaveLength(1);
    expect(reloaded.buyer_delivery_issues[0].photoUrls[0]).toMatch(/^data:image\/jpeg;base64,/);
    const byId = await request(app.getHttpServer()).get(`/deliveries/buyer/shipment/${delivery.id}`).auth(token('buyer'), { type: 'bearer' }).expect(200);
    expect(byId.body.orderId).toBe(orderId);
    await request(app.getHttpServer()).get(`/deliveries/buyer/shipment/${delivery.id}`).auth(token('outsider'), { type: 'bearer' }).expect(404);
    const inbox = (await request(app.getHttpServer()).get('/deliveries/admin/review-inbox').auth(token('admin'), { type: 'bearer' }).expect(200)).body;
    expect(inbox.issues[0].id).toBe(results[0].body.id);
    const proof = await request(app.getHttpServer()).get(`/deliveries/admin/review/issue/${results[0].body.id}`).auth(token('admin'), { type: 'bearer' }).expect(200);
    expect(proof.body.photoUrls).toHaveLength(1);
    await prisma.deliveries.update({ where: { id: delivery.id }, data: { buyerPickupConfirmedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
    await post('/deliveries/buyer/report-issue').send({ ...issue, description: 'A second issue after the reporting deadline.' }).expect(400);
    expect(await prisma.buyer_delivery_issues.count()).toBe(1);
  });

  async function dispatchMission(id = 'mission-one', data: Record<string, unknown> = {}) {
    return prisma.missions.create({ data: { id, missionNumber: id, growerId: 'farmer', logisticsPartnerId: 'logistics',
      pickupLocation: { lat: 45, lng: 20 }, pickupAddress: 'Test farm', status: 'READY_FOR_LOADING', updatedAt: new Date(), ...data } });
  }
  const lifecycle = (id: string, step: string, actor = 'logistics') => request(app.getHttpServer()).patch(`/missions/${id}/lifecycle`).auth(token(actor), { type: 'bearer' }).send({ step });
  async function linkedDelivery() {
    const orderId = await paidOrder();
    const mission = await dispatchMission();
    await prisma.logistics_handovers.create({ data: { id: 'loading-proof', missionId: mission.id, insideTruckTemperature: 4, verifiedBy: 'logistics', status: 'APPROVED' } });
    const delivery = (await post('/deliveries/admin/link-mission', 'admin').send({ missionId: mission.id, orderId }).expect(201)).body;
    return { orderId, mission, delivery };
  }
  it('links the exact mission and paid order, persists the delivery, and exposes it to its assigned carrier', async () => {
    const { mission, delivery, orderId } = await linkedDelivery();
    expect(delivery.missionId).toBe(mission.id); expect(delivery.driverId).toBe('logistics');
    const retry = await post('/deliveries/admin/link-mission', 'admin').send({ missionId: mission.id, orderId }).expect(201);
    expect(retry.body.id).toBe(delivery.id);
    expect(await prisma.deliveries.count()).toBe(1);
    const read = await request(app.getHttpServer()).get(`/missions/${mission.id}`).auth(token('logistics'), { type: 'bearer' }).expect(200);
    expect(read.body.delivery.id).toBe(delivery.id);
    expect(await prisma.audit_trails.count({ where: { entityType: 'Delivery', entityId: delivery.id } })).toBe(1);
    await post(`/deliveries/${delivery.id}/pickup`, 'logistics').expect(400);
  });
  it('rejects non-admin linkage, unpaid orders, and a mission from another farm', async () => {
    const mission = await dispatchMission();
    const orderId = await createApproved();
    await post('/deliveries/admin/link-mission', 'buyer').send({ missionId: mission.id, orderId }).expect(403);
    await post('/deliveries/admin/link-mission', 'admin').send({ missionId: mission.id, orderId }).expect(400);
    await post(`/orders/admin/${orderId}/confirm-bank-payment`, 'admin').send({ transactionId: 'paid' }).expect(201);
    await prisma.missions.update({ where: { id: mission.id }, data: { growerId: 'outsider' } });
    await post('/deliveries/admin/link-mission', 'admin').send({ missionId: mission.id, orderId }).expect(400);
    expect(await prisma.deliveries.count()).toBe(0);
  });
  it('lets admin reopen a legacy in-transit order that never got a delivery', async () => {
    const orderId = await paidOrder();
    await prisma.orders.update({ where: { id: orderId }, data: { status: 'IN_TRANSIT' } });
    await post(`/orders/admin/${orderId}/reopen-dispatch`, 'buyer').expect(403);
    await post(`/orders/admin/${orderId}/reopen-dispatch`, 'admin').expect(201);
    expect((await prisma.orders.findUnique({ where: { id: orderId } })).status).toBe('PAID');
    await post(`/orders/admin/${orderId}/reopen-dispatch`, 'admin').expect(400);
    const other = (await readyForRelease()).orderId;
    await prisma.orders.update({ where: { id: other }, data: { status: 'IN_TRANSIT' } });
    await post(`/orders/admin/${other}/reopen-dispatch`, 'admin').expect(400);
  });
  it('serializes duplicate and competing dispatch links without making a second delivery', async () => {
    const orderId = await paidOrder();
    await dispatchMission(); await dispatchMission('mission-two');
    const results = await Promise.all(['mission-one', 'mission-two'].map((missionId) => post('/deliveries/admin/link-mission', 'admin').send({ missionId, orderId })));
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    const winner = results.find((r) => r.status === 201).body;
    const retries = await Promise.all([1, 2].map(() => post('/deliveries/admin/link-mission', 'admin').send({ missionId: winner.missionId, orderId })));
    expect(retries.map((r) => r.status)).toEqual([201, 201]);
    expect(await prisma.deliveries.count()).toBe(1);
  });
  it('moves mission, delivery and order together through departure, transit, handover and buyer receipt', async () => {
    const { mission, delivery, orderId } = await linkedDelivery();
    await lifecycle(mission.id, 'DEPART_FARM', 'outsider').expect(403);
    await lifecycle(mission.id, 'START_TRANSIT').expect(400);
    await lifecycle(mission.id, 'DEPART_FARM').expect(200);
    expect((await prisma.deliveries.findUnique({ where: { id: delivery.id } })).status).toBe('PICKED_UP');
    const duplicate = await Promise.all([lifecycle(mission.id, 'START_TRANSIT'), lifecycle(mission.id, 'START_TRANSIT')]);
    expect(duplicate.map((r) => r.status)).toEqual([200, 200]);
    await lifecycle(mission.id, 'COMPLETE_DELIVERY').expect(200);
    expect((await prisma.orders.findUnique({ where: { id: orderId } })).status).toBe('IN_TRANSIT');
    await post(`/deliveries/confirm/${delivery.deliveryQRCode}`).expect(400);
    const codeUrl = `/deliveries/buyer/${delivery.id}/receiving-code`;
    await request(app.getHttpServer()).get(codeUrl).auth(token('logistics'), { type: 'bearer' }).expect(403);
    const shown = (await request(app.getHttpServer()).get(codeUrl).auth(token('buyer'), { type: 'bearer' }).expect(200)).body;
    expect(shown.code).toBe(receivingCodeFor(delivery.id));
    expect(shown.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    await post('/digital-handover/initiate', 'logistics').send({ deliveryId: delivery.id, qrCode: 'STORE-ANYTHING' }).expect(400);
    const handover = (await post('/digital-handover/initiate', 'logistics').send({ deliveryId: delivery.id, qrCode: shown.code.toLowerCase() }).expect(201)).body;
    await request(app.getHttpServer()).get(codeUrl).auth(token('buyer'), { type: 'bearer' }).expect(400);
    const image = `data:image/png;base64,${(await sharp({ create: { width: 24, height: 24, channels: 3, background: '#298040' } }).png().toBuffer()).toString('base64')}`;
    jest.spyOn(app.get(DigitalHandoverService) as any, 'generateDeliveryReceipt').mockResolvedValue(undefined);
    await post('/digital-handover/complete').send({ handoverId: handover.id, qualityCheck: { visualCheck: 'FRESH', temperature: 4, photoUrls: [image, image], signature: image } }).expect(201);
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(201);
    await lifecycle(mission.id, 'DEPART_FARM').expect(200);
    expect((await prisma.deliveries.findUnique({ where: { id: delivery.id } })).status).toBe('CONFIRMED');
    expect((await prisma.orders.findUnique({ where: { id: orderId } })).status).toBe('COMPLETED');
    expect(await prisma.wallet_transactions.count()).toBe(3);
    const order = (await request(app.getHttpServer()).get(`/orders/${orderId}`).auth(token('buyer'), { type: 'bearer' }).expect(200)).body;
    expect(order.shipmentTracking.missionNumber).toBe(mission.missionNumber);
  });
  it('rolls back mission and order when the linked delivery write fails', async () => {
    const { mission, orderId } = await linkedDelivery();
    await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_linked_delivery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected dispatch failure'; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER fail_linked_delivery BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION fail_linked_delivery()');
    try {
      await lifecycle(mission.id, 'DEPART_FARM').expect(500);
      expect((await prisma.missions.findUnique({ where: { id: mission.id } })).status).toBe('READY_FOR_LOADING');
      expect((await prisma.orders.findUnique({ where: { id: orderId } })).status).toBe('CONFIRMED');
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER fail_linked_delivery ON deliveries');
      await prisma.$executeRawUnsafe('DROP FUNCTION fail_linked_delivery()');
    }
  });
  it('refuses to advance a buyer mission that has no linked delivery', async () => {
    const orderId = await paidOrder(); const mission = await dispatchMission('missing-link', { orderId, status: 'PICKED_UP' });
    await lifecycle(mission.id, 'START_TRANSIT').expect(400);
    expect((await prisma.missions.findUnique({ where: { id: mission.id } })).status).toBe('PICKED_UP');
    expect((await prisma.orders.findUnique({ where: { id: orderId } })).status).toBe('PAID');
  });
  it.each(['ACCEPTED', 'REJECTED'])('records a buyer complaint decision %s with audit and buyer visibility, without changing payment', async (outcome) => {
    const { body, delivery, orderId, image } = await transitHandover();
    await post('/digital-handover/complete').send(body).expect(201);
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(201);
    const issue = (await post('/deliveries/buyer/report-issue').send({ deliveryId: delivery.id, description: 'Some apples were damaged inside the crate.', photosBase64: [image] }).expect(201)).body;
    const path = `/deliveries/admin/review/issue/${issue.id}`;
    const decision = { action: 'RESOLVE', revision: 1, outcome, resolution: 'We inspected the supplied evidence and recorded this decision.' };
    await post(path, 'buyer').send({ action: 'START_REVIEW', revision: 0 }).expect(403);
    await post(path, 'admin').send({ ...decision, revision: 0 }).expect(400);
    await post(path, 'admin').send({ action: 'START_REVIEW', revision: 0 }).expect(201);
    const results = await Promise.all([post(path, 'admin').send(decision), post(path, 'admin').send(decision)]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(results[0].body.resolvedAt).toBe(results[1].body.resolvedAt);
    await post(path, 'admin').send({ ...decision, outcome: outcome === 'ACCEPTED' ? 'REJECTED' : 'ACCEPTED' }).expect(409);
    const buyer = (await request(app.getHttpServer()).get(`/deliveries/buyer/order/${orderId}`).auth(token('buyer'), { type: 'bearer' }).expect(200)).body;
    expect(buyer.buyer_delivery_issues[0]).toMatchObject({ status: 'RESOLVED', outcome, resolution: decision.resolution });
    expect(await prisma.audit_trails.count({ where: { entityType: 'DeliveryReview', entityId: issue.id } })).toBe(2);
    expect(await prisma.wallet_transactions.count()).toBe(3);
    expect((await prisma.payments.findUnique({ where: { orderId } })).status).toBe('RELEASED');
  });
  it('reopens disputed handover only for a new buyer inspection, preserving original photos and rejecting stale submissions', async () => {
    const { body, handover, delivery, orderId } = await transitHandover();
    const damaged = { ...body, qualityCheck: { ...body.qualityCheck, visualCheck: 'DAMAGED', signature: undefined } };
    await post('/digital-handover/complete').send(damaged).expect(201);
    const dispute = await prisma.disputes.findFirst({ where: { handoverId: handover.id } });
    const path = `/deliveries/admin/review/dispute/${dispute.id}`;
    await post(path, 'admin').send({ action: 'START_REVIEW', revision: 0 }).expect(201);
    await post(path, 'admin').send({ action: 'RESOLVE', revision: 1, outcome: 'REINSPECTION', resolution: 'The load was sorted. Please inspect and sign the corrected delivery.' }).expect(201);
    expect((await prisma.digital_handovers.findUnique({ where: { id: handover.id } })).status).toBe('INITIATED');
    expect((await prisma.disputes.findUnique({ where: { id: dispute.id } })).evidencePhotos).toHaveLength(4);
    await post('/digital-handover/complete').send(damaged).expect(409);
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(400);
    const buyer = (await request(app.getHttpServer()).get(`/deliveries/buyer/order/${orderId}`).auth(token('buyer'), { type: 'bearer' }).expect(200)).body;
    expect(buyer.digital_handovers.disputes[0].outcome).toBe('REINSPECTION');
    await post('/digital-handover/complete').send({ ...body, revision: 1 }).expect(201);
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(201);
  });
  it('keeps a return-required shipment blocked and its escrow untouched', async () => {
    const { body, handover, delivery, orderId } = await transitHandover();
    await post('/digital-handover/complete').send({ ...body, qualityCheck: { ...body.qualityCheck, visualCheck: 'DAMAGED' } }).expect(201);
    const dispute = await prisma.disputes.findFirst({ where: { handoverId: handover.id } });
    const path = `/deliveries/admin/review/dispute/${dispute.id}`;
    await post(path, 'admin').send({ action: 'START_REVIEW', revision: 0 }).expect(201);
    await post(path, 'admin').send({ action: 'RESOLVE', revision: 1, outcome: 'RETURN_REQUIRED', resolution: 'Cargo must be returned; operations will arrange collection with the carrier.' }).expect(201);
    await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: delivery.id }).expect(400);
    await post(`/deliveries/confirm/${delivery.deliveryQRCode}`).expect(400);
    expect((await prisma.payments.findUnique({ where: { orderId } })).status).toBe('IN_ESCROW');
    expect(await prisma.wallet_transactions.count()).toBe(0);
  });

  it('keeps a dispatch link and exposes document retry when PDF services fail', async () => {
    jest.spyOn(app.get(WaybillsService), 'generateWaybill').mockRejectedValueOnce(new Error('Injected document failure'));
    const { mission, orderId, delivery } = await linkedDelivery();
    expect(delivery.documentsReady).toBe(false);
    const options = (await request(app.getHttpServer()).get('/deliveries/admin/link-options').auth(token('admin'), { type: 'bearer' }).expect(200)).body;
    expect(options.pendingDocuments.some((d) => d.id === delivery.id)).toBe(true);
    const retry = await post('/deliveries/admin/link-mission', 'admin').send({ missionId: mission.id, orderId }).expect(201);
    expect(retry.body.id).toBe(delivery.id);
    expect(await prisma.deliveries.count()).toBe(1);
    await request(app.getHttpServer()).get('/deliveries/admin/link-options').auth(token('buyer'), { type: 'bearer' }).expect(403);
  });
  it('does not attach a mission to an existing delivery assigned to a different carrier', async () => {
    const orderId = await paidOrder();
    const original = (await post('/deliveries/assign', 'admin').send({ orderId, driverId: 'driver' }).expect(201)).body;
    const mission = await dispatchMission();
    await post('/deliveries/admin/link-mission', 'admin').send({ missionId: mission.id, orderId }).expect(409);
    expect((await prisma.deliveries.findUnique({ where: { id: original.id } })).missionId).toBeNull();
    expect((await prisma.missions.findUnique({ where: { id: mission.id } })).orderId).toBeNull();
  });

  const get = (url: string, actor = 'buyer') => request(app.getHttpServer()).get(url).auth(token(actor), { type: 'bearer' });
  const approval = { reason: 'All returned goods were inspected and the full refund was approved.', amountCents: 2500, currency: 'EUR' };
  async function returnFixture(released = false, resolve = true) {
    const f = await transitHandover();
    await post('/digital-handover/complete').send({ ...f.body, qualityCheck: { ...f.body.qualityCheck, visualCheck: released ? 'FRESH' : 'DAMAGED' } }).expect(201);
    let sourceId: string;
    const kind = released ? 'issue' : 'dispute';
    if (released) {
      await post('/deliveries/buyer/confirm-pickup').send({ deliveryId: f.delivery.id }).expect(201);
      sourceId = (await post('/deliveries/buyer/report-issue').send({ deliveryId: f.delivery.id, description: 'Hidden damage was found inside all packages.', photosBase64: [f.image] }).expect(201)).body.id;
    } else sourceId = (await prisma.disputes.findFirst({ where: { handoverId: f.handover.id } })).id;
    if (resolve) {
      const path = `/deliveries/admin/review/${kind}/${sourceId}`;
      await post(path, 'admin').send({ action: 'START_REVIEW', revision: 0 }).expect(201);
      await post(path, 'admin').send({ action: 'RESOLVE', revision: 1, outcome: released ? 'ACCEPTED' : 'RETURN_REQUIRED', resolution: 'Return the whole shipment to the originating farm for inspection.' }).expect(201);
    }
    const plan = { kind, sourceId, destinationAddress: 'Receiving farm, Test Street 10', instructions: 'Collect all crates and return the full shipment to the farm.' };
    const proof = { revision: 0, fullShipment: true, photos: [f.image, f.image], notes: 'All crates accounted for and checked.' };
    return { ...f, plan, proof };
  }
  async function receivedReturn(released = false) {
    const f = await returnFixture(released);
    const row = (await post('/delivery-returns', 'admin').send(f.plan).expect(201)).body;
    await post(`/delivery-returns/${row.id}/collect`, 'driver').send(f.proof).expect(201);
    await post(`/delivery-returns/${row.id}/receive`, 'farmer').send({ ...f.proof, revision: 1 }).expect(201);
    return { ...f, row };
  }
  const bankBody = (image: string, reference: string) => ({ revision: 0, amountCents: 2500, currency: 'EUR', bankReference: reference, bankPaidAt: new Date().toISOString(), bankEvidence: image });

  it('requires an eligible complaint and an administrator to plan a return', async () => {
    const f = await returnFixture(false, false);
    await post('/delivery-returns', 'buyer').send(f.plan).expect(403);
    await post('/delivery-returns', 'admin').send(f.plan).expect(400);
    await post('/delivery-returns', 'admin').send({ ...f.plan, destinationAddress: ' '.repeat(20) }).expect(400);
    expect(await prisma.delivery_returns.count()).toBe(0);
  });
  it('creates one return under concurrent retries and scopes metadata and evidence to participants', async () => {
    const f = await returnFixture();
    const results = await Promise.all([post('/delivery-returns', 'admin').send(f.plan), post('/delivery-returns', 'admin').send(f.plan)]);
    expect(results.map(r => r.status)).toEqual([201, 201]);
    const id = results[0].body.id;
    expect(results[1].body.id).toBe(id);
    expect(await prisma.delivery_returns.count()).toBe(1);
    for (const actor of ['buyer', 'farmer', 'driver', 'admin']) {
      const list = (await get('/delivery-returns', actor).expect(200)).body;
      expect(list.map(r => r.id)).toEqual([id]);
      expect(list[0].collectionPhotos).toBeUndefined();
      await get(`/delivery-returns/${id}/evidence`, actor).expect(200);
    }
    expect((await get('/delivery-returns', 'outsider').expect(200)).body).toEqual([]);
    await get(`/delivery-returns/${id}/evidence`, 'outsider').expect(404);
    expect(await prisma.audit_trails.count({ where: { entityType: 'ReturnRefund', entityId: id } })).toBe(1);
  });
  it('requires assigned physical actors, ordered steps, real images and explicit full shipment confirmation', async () => {
    const f = await returnFixture();
    const row = (await post('/delivery-returns', 'admin').send(f.plan).expect(201)).body;
    const collect = `/delivery-returns/${row.id}/collect`, receive = `/delivery-returns/${row.id}/receive`;
    await post(collect, 'buyer').send(f.proof).expect(403);
    await post(receive, 'driver').send(f.proof).expect(403);
    await post(receive, 'farmer').send(f.proof).expect(400);
    await post(collect, 'driver').send({ ...f.proof, photos: ['file:///photo.png', f.image] }).expect(400);
    for (const fullShipment of [false, 'false', 'true', 1]) await post(collect, 'driver').send({ ...f.proof, fullShipment }).expect(400);
    await post(collect, 'driver').send({ ...f.proof, notes: ' '.repeat(20) }).expect(400);
    const results = await Promise.all([post(collect, 'driver').send(f.proof), post(collect, 'driver').send(f.proof)]);
    expect(results.map(r => r.status)).toEqual([201, 201]);
    expect(results[0].body.collectedAt).toBe(results[1].body.collectedAt);
    await post(receive, 'farmer').send(f.proof).expect(409);
    const first = (await post(receive, 'farmer').send({ ...f.proof, revision: 1 }).expect(201)).body;
    const repeated = (await post(receive, 'farmer').send({ ...f.proof, revision: 1 }).expect(201)).body;
    expect(repeated.receivedAt).toBe(first.receivedAt);
    expect(first).toMatchObject({ status: 'RECEIVED', revision: 2, collectedBy: 'driver', receivedBy: 'farmer' });
    expect((await prisma.deliveries.findUnique({ where: { id: f.delivery.id } })).status).toBe('IN_TRANSIT');
    expect((await prisma.digital_handovers.findUnique({ where: { id: f.handover.id } })).status).toBe('DISPUTED');
    expect(await prisma.audit_trails.count({ where: { entityType: 'ReturnRefund', entityId: row.id } })).toBe(3);
  });
  it('approves only the exact full paid amount after receipt and leaves escrow untouched until bank confirmation', async () => {
    const f = await returnFixture();
    const row = (await post('/delivery-returns', 'admin').send(f.plan).expect(201)).body;
    const path = `/delivery-returns/${row.id}/refund`;
    await post(path, 'admin').send(approval).expect(400);
    await post(`/delivery-returns/${row.id}/collect`, 'driver').send(f.proof).expect(201);
    await post(`/delivery-returns/${row.id}/receive`, 'farmer').send({ ...f.proof, revision: 1 }).expect(201);
    await post(path, 'farmer').send(approval).expect(403);
    await post(path, 'admin').send({ ...approval, amountCents: 2499 }).expect(400);
    await post(path, 'admin').send({ ...approval, currency: 'RSD' }).expect(400);
    await post(path, 'admin').send({ ...approval, reason: ' '.repeat(30) }).expect(400);
    const results = await Promise.all([post(path, 'admin').send(approval), post(path, 'admin').send(approval)]);
    expect(results.map(r => r.status)).toEqual([201, 201]);
    expect(results[0].body.id).toBe(results[1].body.id);
    expect(results[0].body).toMatchObject({ status: 'APPROVED', amountCents: 2500, reconciliationRequired: false });
    await post(path, 'admin').send({ ...approval, amountCents: 2600 }).expect(409);
    expect((await prisma.payments.findUnique({ where: { orderId: f.orderId } })).status).toBe('IN_ESCROW');
    expect(await prisma.wallet_transactions.count()).toBe(0);
  });
  it('blocks escrow release at the payment lock once a refund is approved, even with an otherwise payable delivery', async () => {
    const f = await receivedReturn();
    await post(`/delivery-returns/${f.row.id}/refund`, 'admin').send(approval).expect(201);
    // Isolate the financial guard from the normal DISPUTED delivery guard.
    await prisma.digital_handovers.update({ where: { id: f.handover.id }, data: { status: 'COMPLETED', signature: f.image, temperature: 4 } });
    await prisma.deliveries.update({ where: { id: f.delivery.id }, data: { status: 'DELIVERED' } });
    const response = await post(`/payments/order/${f.orderId}/release`, 'admin').expect(400);
    expect(response.body.message).toContain('reserved for an approved refund');
    expect((await prisma.payments.findUnique({ where: { orderId: f.orderId } })).status).toBe('IN_ESCROW');
    expect(await prisma.wallet_transactions.count()).toBe(0);
  });
  it('records one bank refund across concurrent retries, atomically updates payment/order and keeps bank evidence private', async () => {
    const f = await receivedReturn();
    await request(app.getHttpServer()).patch(`/orders/admin/${f.orderId}/status`).auth(token('admin'), { type: 'bearer' }).send({ status: 'REFUNDED' }).expect(400);
    const refund = (await post(`/delivery-returns/${f.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    const path = `/delivery-returns/refunds/${refund.id}/confirm`, bank = bankBody(f.image, 'BANK-REFUND-001');
    await post(path, 'buyer').send(bank).expect(403);
    const results = await Promise.all([post(path, 'admin').send(bank), post(path, 'admin').send(bank)]);
    expect(results.map(r => r.status)).toEqual([201, 201]);
    expect(results[0].body.confirmedAt).toBe(results[1].body.confirmedAt);
    await post(path, 'admin').send({ ...bank, bankReference: 'BANK-DIFFERENT' }).expect(409);
    expect((await prisma.payments.findUnique({ where: { orderId: f.orderId } })).status).toBe('REFUNDED');
    expect((await prisma.orders.findUnique({ where: { id: f.orderId } })).status).toBe('REFUNDED');
    expect(await prisma.wallet_transactions.count()).toBe(0);
    expect(await prisma.audit_trails.count({ where: { entityType: 'ReturnRefund', entityId: refund.id } })).toBe(2);
    await post(`/payments/order/${f.orderId}/release`, 'admin').expect(400);
    await request(app.getHttpServer()).patch(`/orders/admin/${f.orderId}/status`).auth(token('admin'), { type: 'bearer' }).send({ status: 'PAID' }).expect(400);
    const buyer = (await get(`/deliveries/buyer/order/${f.orderId}`).expect(200)).body;
    expect(buyer.returnCase.refund).toMatchObject({ status: 'CONFIRMED', amountCents: 2500 });
    expect(buyer.returnCase.refund.bankReference).toBeUndefined();
    expect(buyer.returnCase.refund.bankEvidence).toBeUndefined();
    for (const actor of ['buyer', 'driver', 'farmer', 'outsider']) await get(`/delivery-returns/refunds/${refund.id}/bank-evidence`, actor).expect(403);
    expect((await get(`/delivery-returns/refunds/${refund.id}/bank-evidence`, 'admin').expect(200)).body.bankReference).toBe(bank.bankReference);
  });
  it('rejects invalid bank amount, time, proof and stale revision without changing financial records', async () => {
    const f = await receivedReturn();
    const refund = (await post(`/delivery-returns/${f.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    const path = `/delivery-returns/refunds/${refund.id}/confirm`, bank = bankBody(f.image, 'BANK-REFUND-002');
    for (const change of [{ amountCents: 2400 }, { currency: 'USD' }, { bankPaidAt: '2000-01-01T00:00:00.000Z' }, { bankPaidAt: new Date(Date.now() + 3600000).toISOString() }, { bankEvidence: 'https://example.com/proof.jpg' }]) {
      await post(path, 'admin').send({ ...bank, ...change }).expect(400);
    }
    await post(path, 'admin').send({ ...bank, revision: 1 }).expect(409);
    expect((await prisma.delivery_refunds.findUnique({ where: { id: refund.id } })).status).toBe('APPROVED');
    expect((await prisma.payments.findUnique({ where: { orderId: f.orderId } })).status).toBe('IN_ESCROW');
  });
  it('rolls back refund confirmation and payment when the order update fails, then safely retries', async () => {
    const f = await receivedReturn();
    const refund = (await post(`/delivery-returns/${f.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    const path = `/delivery-returns/refunds/${refund.id}/confirm`, bank = bankBody(f.image, 'BANK-REFUND-003');
    await prisma.$executeRawUnsafe(`CREATE FUNCTION reject_refunded_order() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status = 'REFUNDED' THEN RAISE EXCEPTION 'Injected refund failure'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER reject_refunded_order BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION reject_refunded_order()');
    try {
      await post(path, 'admin').send(bank).expect(500);
      expect((await prisma.delivery_refunds.findUnique({ where: { id: refund.id } })).status).toBe('APPROVED');
      expect((await prisma.payments.findUnique({ where: { orderId: f.orderId } })).status).toBe('IN_ESCROW');
      expect(await prisma.audit_trails.count({ where: { entityType: 'ReturnRefund', entityId: refund.id } })).toBe(1);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_refunded_order ON orders');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_refunded_order()');
    }
    await post(path, 'admin').send(bank).expect(201);
  });
  it('does not reuse a bank reference for a second payment and leaves its refund pending', async () => {
    const a = await receivedReturn(), b = await receivedReturn();
    const ra = (await post(`/delivery-returns/${a.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    const rb = (await post(`/delivery-returns/${b.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    const bank = bankBody(a.image, 'BANK-UNIQUE-REFERENCE');
    await post(`/delivery-returns/refunds/${ra.id}/confirm`, 'admin').send(bank).expect(201);
    await post(`/delivery-returns/refunds/${rb.id}/confirm`, 'admin').send(bank).expect(409);
    expect((await prisma.delivery_refunds.findUnique({ where: { id: rb.id } })).status).toBe('APPROVED');
    expect((await prisma.payments.findUnique({ where: { orderId: b.orderId } })).status).toBe('IN_ESCROW');
  });
  it('flags already distributed money for reconciliation and preserves original wallet credits after the external refund', async () => {
    const f = await receivedReturn(true);
    const balances = await prisma.wallets.findMany({ orderBy: { id: 'asc' } });
    const refund = (await post(`/delivery-returns/${f.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    expect(refund).toMatchObject({ originalPaymentStatus: 'RELEASED', reconciliationRequired: true });
    await post(`/delivery-returns/refunds/${refund.id}/confirm`, 'admin').send(bankBody(f.image, 'BANK-RELEASED-REFUND')).expect(201);
    expect(await prisma.wallets.findMany({ orderBy: { id: 'asc' } })).toEqual(balances);
    expect(await prisma.wallet_transactions.count()).toBe(3);
    expect((await prisma.payments.findUnique({ where: { orderId: f.orderId } })).status).toBe('REFUNDED');
  });

  async function reconciliationFixture() {
    const f = await receivedReturn(true);
    const refund = (await post(`/delivery-returns/${f.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    await post(`/delivery-returns/refunds/${refund.id}/confirm`, 'admin').send(bankBody(f.image, `BANK-${refund.id}`)).expect(201);
    const url = `/delivery-returns/refunds/${refund.id}/reconciliation`;
    const details = (await get(url, 'admin').expect(200)).body;
    const decision = { revision: details.revision, currency: 'EUR', amountCents: 2500,
      reason: 'Operations reviewed liability and approved this exact settlement of the original shares.',
      entries: details.sources.map(s => ({ sourceKey: s.sourceKey, amountCents: s.amountCents, method: 'WALLET_RECOVERY' })) };
    return { ...f, refund, url, details, decision };
  }
  it('restricts financial reconciliation and balances to administrators and requires a recorded released-payment refund', async () => {
    const f = await reconciliationFixture();
    for (const actor of ['buyer', 'farmer', 'driver', 'outsider']) {
      await get(f.url, actor).expect(403);
      await post(f.url, actor).send(f.decision).expect(403);
    }
    const buyer = (await get(`/deliveries/buyer/order/${f.orderId}`).expect(200)).body;
    expect(buyer.returnCase.refund.reconciliation).toBeUndefined();
    const g = await receivedReturn();
    const refund = (await post(`/delivery-returns/${g.row.id}/refund`, 'admin').send(approval).expect(201)).body;
    await get(`/delivery-returns/refunds/${refund.id}/reconciliation`, 'admin').expect(400);
    await post(`/delivery-returns/refunds/${refund.id}/confirm`, 'admin').send(bankBody(g.image, 'BANK-ESCROW-RECON')).expect(201);
    await post(`/delivery-returns/refunds/${refund.id}/reconciliation`, 'admin').send(f.decision).expect(400);
    expect(await prisma.refund_reconciliations.count()).toBe(0);
  });
  it('recovers original wallet shares once across concurrent retries, preserves gross earnings and exposes signed debits to their owner', async () => {
    const f = await reconciliationFixture();
    const original = await prisma.wallet_transactions.findMany({ where: { orderId: f.orderId }, orderBy: { id: 'asc' } });
    const responses = await Promise.all([post(f.url, 'admin').send(f.decision), post(f.url, 'admin').send({ ...f.decision, entries: [...f.decision.entries].reverse() })]);
    expect(responses.map(r => r.status)).toEqual([201, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    expect(responses[0].body).toMatchObject({ recoveredCents: 2500, platformCostCents: 0 });
    expect(await prisma.wallet_transactions.findMany({ where: { id: { in: original.map(t => t.id) } }, orderBy: { id: 'asc' } })).toEqual(original);
    for (const [userId, totalEarned] of [['farmer', 17.5], ['driver', 5], ['admin', 2.5]] as const) {
      const wallet = (await get('/wallets/me', userId).expect(200)).body;
      expect(wallet).toMatchObject({ availableBalance: 0, totalEarned });
      const txs = (await get('/wallets/me/transactions', userId).expect(200)).body;
      expect(txs.filter(t => t.type === 'REFUNDED')).toHaveLength(1);
      expect(txs.find(t => t.type === 'REFUNDED')).toMatchObject({ amount: -totalEarned, orderId: f.orderId, status: 'COMPLETED' });
    }
    expect(await prisma.wallet_transactions.count({ where: { type: 'REFUNDED' } })).toBe(3);
    expect(await prisma.refund_reconciliation_entries.count()).toBe(3);
    expect(await prisma.audit_trails.count({ where: { entityId: f.refund.id } })).toBe(3);
    expect((await prisma.delivery_refunds.findUnique({ where: { id: f.refund.id } })).reconciliationRequired).toBe(false);
    const changed = { ...f.decision, entries: f.decision.entries.map(e => ({ ...e, method: 'PLATFORM_COST' })) };
    await post(f.url, 'admin').send(changed).expect(409);
    const saved = (await get(f.url, 'admin').expect(200)).body;
    expect(saved.reconciliation.id).toBe(responses[0].body.id);
    expect(saved.sources).toEqual([]);
    for (const [actor, amountCents] of [['farmer', 1750], ['driver', 500]] as const) {
      const list = (await get('/delivery-returns', actor).expect(200)).body;
      const own = list.find(r => r.id === f.row.id).refund.reconciliation;
      expect(own.entries).toHaveLength(1);
      expect(own.entries[0]).toMatchObject({ amountCents, method: 'WALLET_RECOVERY' });
      expect(own.recoveredCents).toBeUndefined(); expect(own.reason).toBeUndefined();
    }
    const buyerList = (await get('/delivery-returns', 'buyer').expect(200)).body;
    expect(buyerList.find(r => r.id === f.row.id).refund.reconciliation.entries).toEqual([]);

  });
  it('records platform cost separately from wallet recovery without claiming that the cost was collected', async () => {
    const f = await reconciliationFixture();
    const farmerKey = f.details.sources.find(s => s.recipient.id === 'farmer').sourceKey;
    const response = await post(f.url, 'admin').send({ ...f.decision, entries: f.decision.entries.map(e => ({ ...e, method: e.sourceKey === farmerKey ? 'WALLET_RECOVERY' : 'PLATFORM_COST' })) }).expect(201);
    expect(response.body).toMatchObject({ recoveredCents: 1750, platformCostCents: 750 });
    expect(response.body.entries.filter(e => e.method === 'PLATFORM_COST').every(e => e.debitId === null)).toBe(true);
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(0);
    expect((await prisma.wallets.findUnique({ where: { userId: 'driver' } })).availableBalance).toBe(5);
    expect((await prisma.wallets.findUnique({ where: { userId: 'admin' } })).availableBalance).toBe(2.5);
    expect(await prisma.wallet_transactions.count({ where: { type: 'REFUNDED' } })).toBe(1);
  });
  it('rejects missing, duplicated, foreign or altered original shares, currency, reason and stale revision', async () => {
    const f = await reconciliationFixture();
    const invalid = [
      { entries: f.decision.entries.slice(1) },
      { entries: [...f.decision.entries, f.decision.entries[0]] },
      { entries: f.decision.entries.map((e, i) => i === 0 ? { ...e, sourceKey: 'another-payment-credit' } : e) },
      { entries: f.decision.entries.map((e, i) => i === 0 ? { ...e, amountCents: e.amountCents + 1 } : e) },
      { entries: f.decision.entries.map(e => ({ ...e, method: 'FORGIVEN' })) },
      { amountCents: 2400 }, { currency: 'USD' }, { reason: ' '.repeat(30) },
    ];
    for (const change of invalid) await post(f.url, 'admin').send({ ...f.decision, ...change }).expect(400);
    await post(f.url, 'admin').send({ ...f.decision, revision: 0 }).expect(409);
    expect(await prisma.refund_reconciliations.count()).toBe(0);
    expect(await prisma.wallet_transactions.count({ where: { type: 'REFUNDED' } })).toBe(0);
  });
  it('does not partially settle or overdraw when a recipient has already withdrawn the money', async () => {
    const f = await reconciliationFixture();
    await app.get(WalletsService).debitWallet('farmer', 16, 'Withdrawal before reconciliation');
    const before = await prisma.wallets.findMany({ orderBy: { id: 'asc' } });
    await post(f.url, 'admin').send(f.decision).expect(409);
    expect(await prisma.wallets.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
    expect(await prisma.refund_reconciliations.count()).toBe(0);
    expect(await prisma.wallet_transactions.count({ where: { type: 'REFUNDED' } })).toBe(0);
    expect((await prisma.delivery_refunds.findUnique({ where: { id: f.refund.id } })).reconciliationRequired).toBe(true);
  });
  it('serializes different refunds against shared wallets so only the affordable reconciliation succeeds', async () => {
    const a = await reconciliationFixture(), b = await reconciliationFixture();
    await app.get(WalletsService).debitWallet('farmer', 15, 'Earlier withdrawal');
    const responses = await Promise.all([post(a.url, 'admin').send(a.decision), post(b.url, 'admin').send(b.decision)]);
    expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(2.5);
    expect(await prisma.refund_reconciliations.count()).toBe(1);
    expect(await prisma.wallet_transactions.count({ where: { type: 'REFUNDED' } })).toBe(3);
  });
  it('does not lose a concurrent credit or allow a withdrawal and recovery to spend the same money', async () => {
    const f = await reconciliationFixture();
    const walletService = app.get(WalletsService);
    const [response] = await Promise.all([post(f.url, 'admin').send(f.decision), walletService.creditWallet('farmer', 10, 'BONUS')]);
    expect(response.status).toBe(201);
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(10);
    const g = await reconciliationFixture();
    await walletService.debitWallet('farmer', 10, 'Remove unrelated bonus');
    const [recovery, withdrawal] = await Promise.allSettled([post(g.url, 'admin').send(g.decision), walletService.debitWallet('farmer', 15, 'Concurrent withdrawal')]);
    expect(recovery.status).toBe('fulfilled');
    const status = recovery.status === 'fulfilled' ? recovery.value.status : 0;
    expect([201, 409]).toContain(status);
    expect(withdrawal.status).toBe(status === 201 ? 'rejected' : 'fulfilled');
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(status === 201 ? 0 : 2.5);
  });
  it('rolls back balances, reconciliation and audit if writing a reversal transaction fails, and can then retry', async () => {
    const f = await reconciliationFixture();
    const before = await prisma.wallets.findMany({ orderBy: { id: 'asc' } });
    await prisma.$executeRawUnsafe(`CREATE FUNCTION reject_refund_debit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.type = 'REFUNDED' THEN RAISE EXCEPTION 'Injected reversal failure'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER reject_refund_debit BEFORE INSERT ON wallet_transactions FOR EACH ROW EXECUTE FUNCTION reject_refund_debit()');
    try {
      await post(f.url, 'admin').send(f.decision).expect(500);
      expect(await prisma.wallets.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
      expect(await prisma.refund_reconciliations.count()).toBe(0);
      expect(await prisma.refund_reconciliation_entries.count()).toBe(0);
      expect(await prisma.audit_trails.count({ where: { entityId: f.refund.id } })).toBe(2);
      expect((await prisma.delivery_refunds.findUnique({ where: { id: f.refund.id } })).reconciliationRequired).toBe(true);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_refund_debit ON wallet_transactions');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_refund_debit()');
    }
    await post(f.url, 'admin').send(f.decision).expect(201);
  });
  it('requires an explicit platform cost for a historically uncredited platform fee and blocks inconsistent historical splits', async () => {
    const f = await reconciliationFixture();
    // Represents a release made before PLATFORM_WALLET_USER_ID was configured.
    await prisma.wallet_transactions.deleteMany({ where: { orderId: f.orderId, type: 'PLATFORM_FEE' } });
    await prisma.wallets.update({ where: { userId: 'admin' }, data: { availableBalance: 0, totalEarned: 0 } });
    const details = (await get(f.url, 'admin').expect(200)).body;
    const entries = details.sources.map(s => ({ sourceKey: s.sourceKey, amountCents: s.amountCents, method: 'WALLET_RECOVERY' }));
    await post(f.url, 'admin').send({ ...f.decision, entries }).expect(400);
    const response = await post(f.url, 'admin').send({ ...f.decision, entries: entries.map(e => ({ ...e, method: e.sourceKey === 'uncredited-platform-fee' ? 'PLATFORM_COST' : 'WALLET_RECOVERY' })) }).expect(201);
    expect(response.body).toMatchObject({ recoveredCents: 2250, platformCostCents: 250 });
    const g = await reconciliationFixture();
    await prisma.wallet_transactions.update({ where: { id: g.decision.entries[0].sourceKey }, data: { amount: 123 } });
    await get(g.url, 'admin').expect(400);
    await post(g.url, 'admin').send(g.decision).expect(400);
  });
  it('aggregates multiple original shares credited to one wallet before checking affordability', async () => {
    const f = await reconciliationFixture();
    const farmer = await prisma.wallets.findUnique({ where: { userId: 'farmer' } });
    const driverSource = f.details.sources.find(s => s.recipient.id === 'driver');
    // Historical fixture where the same user earned both production and transport shares.
    await prisma.wallet_transactions.update({ where: { id: driverSource.creditId }, data: { walletId: farmer.id } });
    await prisma.wallets.update({ where: { userId: 'driver' }, data: { availableBalance: 0, totalEarned: 0 } });
    await prisma.wallets.update({ where: { id: farmer.id }, data: { availableBalance: 22.5, totalEarned: 22.5 } });
    await post(f.url, 'admin').send(f.decision).expect(201);
    expect((await prisma.wallets.findUnique({ where: { id: farmer.id } })).availableBalance).toBe(0);
    expect(await prisma.wallet_transactions.count({ where: { walletId: farmer.id, type: 'REFUNDED' } })).toBe(2);
  });
  it('creates one empty wallet for simultaneous first reads and rejects negative withdrawals', async () => {
    const results = await Promise.all([get('/wallets/me', 'farmer'), get('/wallets/me/transactions', 'farmer')]);
    expect(results.map(r => r.status)).toEqual([200, 200]);
    expect(await prisma.wallets.count({ where: { userId: 'farmer' } })).toBe(1);
    await expect(app.get(WalletsService).debitWallet('farmer', -20, 'Invalid')).rejects.toThrow();
    expect((await prisma.wallets.findUnique({ where: { userId: 'farmer' } })).availableBalance).toBe(0);
  });

  async function dispositionFixture() {
    const f = await receivedReturn();
    const url = `/delivery-returns/${f.row.id}/disposition`;
    const detail = (await get(url, 'admin').expect(200)).body;
    const inspect = { revision: 0, action: 'QUARANTINE', quantity: 10, unit: 'kg',
      notes: 'All crates inspected and kept separate pending a final quality decision.', photos: [f.image, f.image] };
    const stock = detail.candidates.find(s => s.id === 'stock');
    const stockCount = { inventoryId: stock.id, expectedQuantity: stock.quantity, expectedUpdatedAt: stock.updatedAt,
      countedQuantity: 100, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), qualityApproved: true, stockCountConfirmed: true, locationConfirmed: true };
    return { ...f, url, detail, inspect, stockCount };
  }
  it('quarantines received goods without creating saleable stock and restricts disposition decisions to administrators', async () => {
    const f = await dispositionFixture();
    expect(f.detail).toMatchObject({ stockStatus: 'QUARANTINED', revision: 0, history: [] });
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
    for (const actor of ['farmer', 'driver', 'buyer', 'outsider']) {
      await get(f.url, actor).expect(403);
      await post(f.url, actor).send(f.inspect).expect(403);
    }
    await request(app.getHttpServer()).post(f.url).send(f.inspect).expect(401);
    const buyer = (await get(`/deliveries/buyer/order/${f.orderId}`).expect(200)).body;
    expect(buyer.returnCase.stockStatus).toBe('QUARANTINED');
    expect(await prisma.return_dispositions.count()).toBe(0);
  });
  it('rejects stock decisions before physical receipt and invalid, incomplete or different-unit evidence', async () => {
    const f = await returnFixture();
    const row = (await post('/delivery-returns', 'admin').send(f.plan).expect(201)).body;
    const url = `/delivery-returns/${row.id}/disposition`;
    const inspect = { revision: 0, action: 'WRITE_OFF', quantity: 10, unit: 'kg', notes: 'Full shipment inspected and rejected for further sale.', photos: [f.image, f.image] };
    await post(url, 'admin').send(inspect).expect(400);
    await post(`/delivery-returns/${row.id}/collect`, 'driver').send(f.proof).expect(201);
    await post(url, 'admin').send(inspect).expect(400);
    await post(`/delivery-returns/${row.id}/receive`, 'farmer').send({ ...f.proof, revision: 1 }).expect(201);
    for (const change of [{ quantity: 9 }, { quantity: 0 }, { unit: 'crate' }, { notes: ' '.repeat(30) }, { photos: [f.image] }, { photos: ['file:///image.png', f.image] }, { photos: ['data:image/png;base64,YWJj', f.image] }]) {
      await post(url, 'admin').send({ ...inspect, ...change }).expect(400);
    }
    expect(await prisma.return_dispositions.count()).toBe(0);
  });
  it('preserves quarantine history and proof, then records a final write-off without changing inventory or refund state', async () => {
    const f = await dispositionFixture();
    const responses = await Promise.all([post(f.url, 'admin').send(f.inspect), post(f.url, 'admin').send(f.inspect)]);
    expect(responses.map(r => r.status)).toEqual([201, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    const decision = { ...f.inspect, revision: 1, action: 'WRITE_OFF', notes: 'Inspection confirms the whole returned shipment is unsuitable and written off.' };
    await post(f.url, 'admin').send(decision).expect(201);
    const details = (await get(f.url, 'admin').expect(200)).body;
    expect(details.stockStatus).toBe('WRITTEN_OFF'); expect(details.history).toHaveLength(2);
    expect(details.history[1].id).toBe(responses[0].body.id);
    expect(details.history[1].photos).toBeUndefined();
    const evidence = (await get(`/delivery-returns/${f.row.id}/evidence`, 'farmer').expect(200)).body;
    expect(evidence.dispositions).toHaveLength(2);
    for (const d of evidence.dispositions) {
      expect(d.photos).toBeUndefined();
      const photoPath = `/delivery-returns/${f.row.id}/disposition/${d.id}/evidence`;
      const images = (await get(photoPath, 'farmer').expect(200)).body.photos;
      expect(images).toHaveLength(2); expect(images[0].startsWith('data:image/jpeg;base64,')).toBe(true);
      await get(photoPath, 'outsider').expect(404);
      await get(`/delivery-returns/wrong-return/disposition/${d.id}/evidence`, 'admin').expect(404);
    }
    await get(`/delivery-returns/${f.row.id}/evidence`, 'outsider').expect(404);
    await post(f.url, 'admin').send({ ...decision, revision: 2, action: 'QUARANTINE' }).expect(409);
    const oldRetry = await post(f.url, 'admin').send(f.inspect).expect(201);
    expect(oldRetry.body.id).toBe(responses[0].body.id);
    expect((await prisma.delivery_returns.findUnique({ where: { id: f.row.id } })).stockStatus).toBe('WRITTEN_OFF');
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
    expect((await prisma.payments.findUnique({ where: { orderId: f.orderId } })).status).toBe('IN_ESCROW');
    expect(await prisma.audit_trails.count({ where: { entityType: 'ReturnDisposition', entityId: f.row.id } })).toBe(2);
    const buyer = (await get(`/deliveries/buyer/order/${f.orderId}`).expect(200)).body;
    expect(buyer.returnCase.stockStatus).toBe('WRITTEN_OFF');
  });
  it('sets a verified physical count once instead of blindly adding the returned quantity, and makes the saved stock orderable', async () => {
    const f = await dispositionFixture();
    const body = { ...f.inspect, action: 'RESTOCK', stockCount: f.stockCount };
    const responses = await Promise.all([post(f.url, 'admin').send(body), post(f.url, 'admin').send(body)]);
    expect(responses.map(r => r.status)).toEqual([201, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    const stock = await prisma.inventory.findUnique({ where: { id: 'stock' } });
    expect(stock.quantity).toBe(100); // 90 free units plus the verified returned 10; retries do not add another 10.
    expect(stock.status).toBe('AVAILABLE'); expect(stock.expiresAt.toISOString()).toBe(f.stockCount.expiresAt);
    expect(responses[0].body).toMatchObject({ inventoryId: 'stock', previousQuantity: 90, countedQuantity: 100 });
    expect((await prisma.delivery_returns.findUnique({ where: { id: f.row.id } })).stockStatus).toBe('RESTOCKED');
    expect(await prisma.return_dispositions.count()).toBe(1);
    const catalog = (await request(app.getHttpServer()).get('/inventory/available?city=Test').expect(200)).body;
    expect(catalog.find(s => s.id === 'stock').quantity).toBe(100);
    await post('/orders').send(payload({ quantity: 101 })).expect(400);
    await post('/orders').send(payload({ quantity: 1 })).expect(201);
    await post(f.url, 'admin').send({ ...body, stockCount: { ...f.stockCount, countedQuantity: 110 } }).expect(409);
    await post(f.url, 'admin').send({ ...f.inspect, action: 'WRITE_OFF', revision: 1 }).expect(409);
  });
  it('requires explicit quality, location and count confirmations and a valid expiry before stock can be changed', async () => {
    const f = await dispositionFixture();
    await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK' }).expect(400);
    await post(f.url, 'admin').send({ ...f.inspect, stockCount: f.stockCount }).expect(400);
    for (const field of ['qualityApproved', 'stockCountConfirmed', 'locationConfirmed']) {
      for (const value of [false, 'true', 'false', 1, undefined]) {
        await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: { ...f.stockCount, [field]: value } }).expect(400);
      }
    }
    for (const change of [{ countedQuantity: 9 }, { countedQuantity: -5 }, { expiresAt: '2000-01-01T00:00:00.000Z' }]) {
      await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: { ...f.stockCount, ...change } }).expect(400);
    }
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
    expect(await prisma.return_dispositions.count()).toBe(0);
  });
  it('does not restock another farm, product, unit, expired stock or already allocated quantities', async () => {
    const f = await dispositionFixture();
    await prisma.estates.create({ data: { id: 'other-farm', ownerId: 'outsider', name: 'Other farm', polygonCoordinates: {}, calculatedArea: 1, status: 'ACTIVE', updatedAt: new Date() } });
    const invalid = [{ estateId: 'other-farm' }, { productName: 'Apple' }, { unit: 'crate' }, { status: 'IN_TRANSIT' }, { status: 'SOLD' }, { status: 'RESERVED' }, { expiresAt: new Date('2000-01-01') }];
    for (const change of invalid) {
      await prisma.inventory.update({ where: { id: 'stock' }, data: { estateId: 'farm', productName: 'Tomato', unit: 'kg', status: 'AVAILABLE', expiresAt: null, ...change } as any });
      const detail = (await get(f.url, 'admin').expect(200)).body;
      expect(detail.candidates.some(s => s.id === 'stock')).toBe(false);
      await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: f.stockCount }).expect(400);
    }
    expect(await prisma.return_dispositions.count()).toBe(0);
  });
  it('does not extend an existing expiry and can reopen an empty reserved stock after a confirmed count', async () => {
    const f = await dispositionFixture();
    const expiry = new Date(Date.now() + 3 * 86400000);
    await prisma.inventory.update({ where: { id: 'stock' }, data: { quantity: 0, status: 'RESERVED', expiresAt: expiry, updatedAt: new Date() } });
    const stock = (await get(f.url, 'admin').expect(200)).body.candidates.find(s => s.id === 'stock');
    const count = { ...f.stockCount, expectedQuantity: 0, expectedUpdatedAt: stock.updatedAt, countedQuantity: 10 };
    await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: count }).expect(400);
    await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: { ...count, expiresAt: expiry.toISOString() } }).expect(201);
    expect(await prisma.inventory.findUnique({ where: { id: 'stock' } })).toMatchObject({ quantity: 10, status: 'AVAILABLE' });
  });
  it('rejects a stale physical count after a reservation, including an unchanged-quantity stock revision', async () => {
    const f = await dispositionFixture();
    await app.get(InventoryService).reserveInventory('stock', 0.1);
    await app.get(InventoryService).reserveInventory('stock', 0.1);
    await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: f.stockCount }).expect(409);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBeCloseTo(89.8);
    await prisma.inventory.update({ where: { id: 'stock' }, data: { quantity: 100 } });
    await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: f.stockCount }).expect(409);
    expect(await prisma.return_dispositions.count()).toBe(0);
    // Legacy Float round-off must remain a valid server snapshot for a corrective count.
    await prisma.inventory.update({ where: { id: 'stock' }, data: { quantity: 99.80000000000001 } });
    const updated = (await get(f.url, 'admin').expect(200)).body.candidates.find(s => s.id === 'stock');
    await post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: { ...f.stockCount, expectedQuantity: updated.quantity, expectedUpdatedAt: updated.updatedAt } }).expect(201);
  });
  it('does not let two return counts based on the same stock revision silently overwrite one another', async () => {
    const a = await dispositionFixture(), b = await dispositionFixture();
    const snapshot = (await get(a.url, 'admin').expect(200)).body.candidates.find(s => s.id === 'stock');
    a.stockCount.expectedQuantity = b.stockCount.expectedQuantity = snapshot.quantity;
    a.stockCount.expectedUpdatedAt = b.stockCount.expectedUpdatedAt = snapshot.updatedAt;
    const responses = await Promise.all([
      post(a.url, 'admin').send({ ...a.inspect, action: 'RESTOCK', stockCount: { ...a.stockCount, countedQuantity: 110 } }),
      post(b.url, 'admin').send({ ...b.inspect, action: 'RESTOCK', stockCount: { ...b.stockCount, countedQuantity: 120 } }),
    ]);
    expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.return_dispositions.count()).toBe(1);
    expect(await prisma.delivery_returns.count({ where: { stockStatus: 'RESTOCKED' } })).toBe(1);
    expect(await prisma.delivery_returns.count({ where: { stockStatus: 'QUARANTINED' } })).toBe(1);
  });
  it('rolls back stock, return decision and audit if saving inspection evidence fails, then safely retries', async () => {
    const f = await dispositionFixture();
    const before = await prisma.inventory.findUnique({ where: { id: 'stock' } });
    const body = { ...f.inspect, action: 'RESTOCK', stockCount: { ...f.stockCount, countedQuantity: 110 } };
    await prisma.$executeRawUnsafe(`CREATE FUNCTION reject_return_disposition() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected inspection failure'; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER reject_return_disposition BEFORE INSERT ON return_dispositions FOR EACH ROW EXECUTE FUNCTION reject_return_disposition()');
    try {
      await post(f.url, 'admin').send(body).expect(500);
      expect(await prisma.inventory.findUnique({ where: { id: 'stock' } })).toEqual(before);
      expect((await prisma.delivery_returns.findUnique({ where: { id: f.row.id } })).stockStatus).toBe('QUARANTINED');
      expect(await prisma.return_dispositions.count()).toBe(0);
      expect(await prisma.audit_trails.count({ where: { entityType: 'ReturnDisposition' } })).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_return_disposition ON return_dispositions');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_return_disposition()');
    }
    await post(f.url, 'admin').send(body).expect(201);
  });
  it('serializes a reservation with a return count without losing the reservation or reviving expired stock', async () => {
    const f = await dispositionFixture();
    const [response] = await Promise.all([
      post(f.url, 'admin').send({ ...f.inspect, action: 'RESTOCK', stockCount: f.stockCount }),
      app.get(InventoryService).reserveInventory('stock', 5),
    ]);
    expect([201, 409]).toContain(response.status);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(response.status === 201 ? 95 : 85);
    await prisma.inventory.update({ where: { id: 'stock' }, data: { expiresAt: new Date('2000-01-01') } });
    await expect(app.get(InventoryService).reserveInventory('stock', 1)).rejects.toThrow();
    const catalog = (await request(app.getHttpServer()).get('/inventory/available?city=Test').expect(200)).body;
    expect(catalog.some(s => s.id === 'stock')).toBe(false);
    await post('/orders').send(payload()).expect(400);
  });

  it('reserves concrete stock atomically and exposes the same reservation to the buyer and operations', async () => {
    const order = (await post('/orders').send(payload()).expect(201)).body;
    expect(order).toMatchObject({ sourceCatalogId: 'stock', fulfillingEstateId: 'farm', stockReservation: { status: 'RESERVED', quantity: 10, unit: 'kg', inventoryId: 'stock' } });
    expect(await prisma.order_items.findMany({ where: { orderId: order.id } })).toEqual([expect.objectContaining({ inventoryId: 'stock', quantity: 10 })]);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
    expect((await get(`/orders/${order.id}`).expect(200)).body.stockReservation.id).toBe(order.stockReservation.id);
    expect((await get('/orders/admin/all', 'admin').expect(200)).body[0].stockReservation.id).toBe(order.stockReservation.id);
    expect(await prisma.audit_trails.count({ where: { entityType: 'OrderStock', entityId: order.id } })).toBe(1);
  });
  it('does not oversell the last stock when two buyers submit concurrently', async () => {
    await prisma.inventory.update({ where: { id: 'stock' }, data: { quantity: 10 } });
    const responses = await Promise.all(['buyer', 'outsider'].map(actor => post('/orders', actor).send(payload())));
    expect(responses.filter(r => r.status === 201)).toHaveLength(1);
    expect([400, 409]).toContain(responses.find(r => r.status !== 201).status);
    expect(await prisma.orders.count()).toBe(1); expect(await prisma.order_items.count()).toBe(1);
    expect(await prisma.order_stock_reservations.count()).toBe(1);
    expect(await prisma.inventory.findUnique({ where: { id: 'stock' } })).toMatchObject({ quantity: 0, status: 'RESERVED' });
  });
  it('rolls back the complete order if the reservation audit cannot be saved', async () => {
    await prisma.$executeRawUnsafe(`CREATE FUNCTION reject_stock_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."entityType" = 'OrderStock' THEN RAISE EXCEPTION 'Injected stock audit failure'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER reject_stock_audit BEFORE INSERT ON audit_trails FOR EACH ROW EXECUTE FUNCTION reject_stock_audit()');
    try {
      await post('/orders').send(payload()).expect(500);
      expect(await prisma.orders.count()).toBe(0); expect(await prisma.order_items.count()).toBe(0);
      expect(await prisma.order_stock_reservations.count()).toBe(0);
      expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(100);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_stock_audit ON audit_trails');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_stock_audit()');
    }
    await post('/orders').send(payload()).expect(201);
  });
  it('releases an unpaid order exactly once, enforces ownership, and permits a new buyer to reserve the last stock', async () => {
    await prisma.inventory.update({ where: { id: 'stock' }, data: { quantity: 10 } });
    const order = (await post('/orders').send(payload()).expect(201)).body;
    await post(`/orders/${order.id}/cancel`, 'outsider').expect(404);
    const results = await Promise.all([1, 2].map(() => post(`/orders/${order.id}/cancel`)));
    expect(results.map(r => r.status)).toEqual([201, 201]);
    expect(await prisma.inventory.findUnique({ where: { id: 'stock' } })).toMatchObject({ quantity: 10, status: 'AVAILABLE' });
    expect((await prisma.order_stock_reservations.findUnique({ where: { orderId: order.id } })).status).toBe('RELEASED');
    expect(await prisma.audit_trails.count({ where: { entityType: 'OrderStock', entityId: order.id } })).toBe(2);
    await post(`/orders/admin/${order.id}/approve`, 'admin').expect(400);
    await post('/orders', 'outsider').send(payload()).expect(201);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(0);
  });
  it('returns expired reservations to an expired balance without making them saleable', async () => {
    const order = (await post('/orders').send(payload()).expect(201)).body;
    await prisma.inventory.update({ where: { id: 'stock' }, data: { expiresAt: new Date(0) } });
    await post(`/orders/admin/${order.id}/approve`, 'admin').expect(400);
    await post(`/orders/${order.id}/cancel`).expect(201);
    expect(await prisma.inventory.findUnique({ where: { id: 'stock' } })).toMatchObject({ quantity: 100, status: 'EXPIRED' });
    await post('/orders').send(payload()).expect(400);
  });
  async function unallocatedOrder() {
    await prisma.market_prices.upsert({ where: { id: 'price' }, update: {}, create: { id: 'price', cropType: 'Tomato', buyPrice: 1, sellPrice: 2.5, updatedAt: new Date() } });
    return (await post('/orders').send(payload({ productId: 'market-price' })).expect(201)).body;
  }
  it('requires explicit compatible allocation for catalogue requests before approval and bank confirmation', async () => {
    const order = await unallocatedOrder();
    expect(order.stockReservation).toBeNull();
    await post(`/orders/admin/${order.id}/approve`, 'admin').expect(400);
    const url = `/orders/admin/${order.id}/reserve-stock`;
    await post(url).send({ inventoryId: 'stock' }).expect(403);
    await get(`/orders/admin/${order.id}/stock-options`).expect(403);
    await post(url, 'admin').send({ inventoryId: 'missing' }).expect(400);
    await prisma.inventory.update({ where: { id: 'stock' }, data: { productName: 'Apple' } });
    await post(url, 'admin').send({ inventoryId: 'stock' }).expect(400);
    await prisma.inventory.update({ where: { id: 'stock' }, data: { productName: 'Tomato' } });
    await prisma.orders.update({ where: { id: order.id }, data: { status: 'APPROVED' } }); // Legacy approved request.
    await post(`/orders/admin/${order.id}/confirm-bank-payment`, 'admin').send({ transactionId: 'no-stock' }).expect(400);
    expect(await prisma.payments.count()).toBe(0);
    const options = (await get(`/orders/admin/${order.id}/stock-options`, 'admin').expect(200)).body;
    expect(options.candidates.map(s => s.id)).toEqual(['stock']);
    const results = await Promise.all([1, 2].map(() => post(url, 'admin').send({ inventoryId: 'stock' })));
    expect(results.map(r => r.status)).toEqual([201, 201]); expect(results[0].body.id).toBe(results[1].body.id);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
    await post(`/orders/admin/${order.id}/confirm-bank-payment`, 'admin').send({ transactionId: 'allocated' }).expect(201);
  });
  it('requires the exact stock linked to a batch and prevents changing an allocated farm', async () => {
    await prisma.market_prices.create({ data: { id: 'price', cropType: 'Tomato', buyPrice: 1, sellPrice: 2.5, updatedAt: new Date() } });
    await prisma.batches.create({ data: { id: 'batch', batchId: 'BATCH-ALLOC', estateId: 'farm', productName: 'Tomato', quantity: 100, unit: 'kg', harvestDate: new Date(), locationHistory: [], updatedAt: new Date() } });
    const order = (await post('/orders').send(payload({ productId: 'batch' })).expect(201)).body;
    await post(`/orders/admin/${order.id}/reserve-stock`, 'admin').send({ inventoryId: 'stock' }).expect(400);
    await prisma.batches.update({ where: { id: 'batch' }, data: { inventoryId: 'stock' } });
    await post(`/orders/admin/${order.id}/reserve-stock`, 'admin').send({ inventoryId: 'stock' }).expect(201);
    await request(app.getHttpServer()).patch(`/orders/admin/${order.id}/fulfillment`).auth(token('admin'), { type: 'bearer' }).send({ fulfillingEstateId: null }).expect(400);
    const item = await prisma.order_items.findFirst({ where: { orderId: order.id } });
    expect(item).toMatchObject({ batchId: 'batch', inventoryId: 'stock' });
  });
  it('serializes bank confirmation and cancellation without releasing paid stock', async () => {
    const orderId = await createApproved();
    const [paid, cancelled] = await Promise.all([
      post(`/orders/admin/${orderId}/confirm-bank-payment`, 'admin').send({ transactionId: 'race-payment' }),
      post(`/orders/${orderId}/cancel`),
    ]);
    expect([paid.status, cancelled.status].sort()).toEqual([201, 400]);
    const stock = await prisma.inventory.findUnique({ where: { id: 'stock' } });
    const order = await prisma.orders.findUnique({ where: { id: orderId }, include: { payments: true, stockReservation: true } });
    if (order.status === 'PAID') { expect(stock.quantity).toBe(90); expect(order.stockReservation.status).toBe('RESERVED'); expect(order.payments.status).toBe('IN_ESCROW'); }
    else { expect(order.status).toBe('CANCELLED'); expect(stock.quantity).toBe(100); expect(order.stockReservation.status).toBe('RELEASED'); expect(order.payments).toBeNull(); }
  });
  it('prevents status overrides and paid cancellation from bypassing stock, payment or receipt workflows', async () => {
    const id = await paidOrder();
    await post(`/orders/${id}/cancel`).expect(400);
    for (const status of ['CANCELLED', 'PENDING', 'PICKED_UP', 'COMPLETED', 'REFUNDED']) {
      await request(app.getHttpServer()).patch(`/orders/admin/${id}/status`).auth(token('admin'), { type: 'bearer' }).send({ status }).expect(400);
    }
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
  });
  it('marks direct pickup issued exactly once and preserves stock through transport retries', async () => {
    const orderId = await paidOrder();
    const assignments = await Promise.all([1, 2].map(() => post('/deliveries/assign', 'admin').send({ orderId, driverId: 'driver' })));
    expect(assignments.map(r => r.status)).toEqual([201, 201]); expect(assignments[0].body.id).toBe(assignments[1].body.id);
    const deliveryId = assignments[0].body.id;
    const pickups = await Promise.all([1, 2].map(() => post(`/deliveries/${deliveryId}/pickup`, 'driver')));
    expect(pickups.map(r => r.status)).toEqual([201, 201]);
    await post(`/deliveries/${deliveryId}/in-transit`, 'driver').expect(201);
    await post(`/deliveries/${deliveryId}/pickup`, 'driver').expect(201);
    expect((await prisma.deliveries.findUnique({ where: { id: deliveryId } })).status).toBe('IN_TRANSIT');
    expect((await prisma.order_stock_reservations.findUnique({ where: { orderId } })).status).toBe('ISSUED');
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
    expect(await prisma.audit_trails.count({ where: { entityType: 'OrderStock', entityId: orderId } })).toBe(2);
  });
  it('records issue on mission departure without a second stock debit', async () => {
    const { mission, orderId } = await linkedDelivery();
    await lifecycle(mission.id, 'DEPART_FARM').expect(200);
    await lifecycle(mission.id, 'DEPART_FARM').expect(200);
    await lifecycle(mission.id, 'START_TRANSIT').expect(200);
    expect((await prisma.order_stock_reservations.findUnique({ where: { orderId } })).status).toBe('ISSUED');
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
    expect(await prisma.audit_trails.count({ where: { entityType: 'OrderStock', entityId: orderId } })).toBe(2);
  });
  it('blocks physical recounts while another order holds stock, including a refreshed count', async () => {
    const f = await dispositionFixture();
    const order = (await post('/orders').send(payload()).expect(201)).body;
    expect((await get(f.url, 'admin').expect(200)).body.candidates).toHaveLength(0);
    const stock = await prisma.inventory.findUnique({ where: { id: 'stock' } });
    const body = { ...f.inspect, action: 'RESTOCK', stockCount: { ...f.stockCount, expectedQuantity: stock.quantity, expectedUpdatedAt: stock.updatedAt.toISOString() } };
    await post(f.url, 'admin').send(body).expect(409);
    expect(await prisma.return_dispositions.count()).toBe(0);
    await post(`/orders/${order.id}/cancel`).expect(201);
    const refreshed = (await get(f.url, 'admin').expect(200)).body.candidates[0];
    await post(f.url, 'admin').send({ ...body, stockCount: { ...body.stockCount, expectedQuantity: refreshed.quantity, expectedUpdatedAt: refreshed.updatedAt } }).expect(201);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(100);
  });

  it('blocks legacy unallocated dispatch until stock is assigned and refuses expired pickup atomically', async () => {
    const order = await unallocatedOrder();
    await prisma.orders.update({ where: { id: order.id }, data: { status: 'APPROVED' } });
    // A historical bank payment exists, but no stock issue or reservation was recorded.
    await app.get(PaymentsService).createEscrowPayment(order.id, 25, { paymentMethod: 'BANK_TRANSFER', transactionId: 'legacy-paid' });
    await prisma.orders.update({ where: { id: order.id }, data: { status: 'PAID', fulfillingEstateId: 'farm' } });
    await post('/deliveries/assign', 'admin').send({ orderId: order.id, driverId: 'driver' }).expect(400);
    expect(await prisma.deliveries.count()).toBe(0);
    await post(`/orders/admin/${order.id}/reserve-stock`, 'admin').send({ inventoryId: 'stock' }).expect(201);
    const delivery = (await post('/deliveries/assign', 'admin').send({ orderId: order.id, driverId: 'driver' }).expect(201)).body;
    await prisma.inventory.update({ where: { id: 'stock' }, data: { expiresAt: new Date(0) } });
    await post(`/deliveries/${delivery.id}/pickup`, 'driver').expect(400);
    expect((await prisma.deliveries.findUnique({ where: { id: delivery.id } })).status).toBe('ASSIGNED');
    expect((await prisma.orders.findUnique({ where: { id: order.id } })).status).toBe('CONFIRMED');
    expect((await prisma.order_stock_reservations.findUnique({ where: { orderId: order.id } })).status).toBe('RESERVED');
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
  });
  it('retains a committed delivery assignment when documents fail and retries without another stock debit', async () => {
    const orderId = await paidOrder();
    const generator = jest.spyOn(app.get(WaybillsService), 'generateWaybill').mockRejectedValueOnce(new Error('Document service unavailable'));
    const delivery = (await post('/deliveries/assign', 'admin').send({ orderId, driverId: 'driver' }).expect(201)).body;
    expect((await prisma.orders.findUnique({ where: { id: orderId } })).status).toBe('CONFIRMED');
    const retry = await post('/deliveries/assign', 'admin').send({ orderId, driverId: 'driver' }).expect(201);
    expect(retry.body.id).toBe(delivery.id); expect(generator).toHaveBeenCalled();
    expect(await prisma.deliveries.count()).toBe(1);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
  });

  it('deduplicates concurrent checkout retries before reserving the last stock', async () => {
    await prisma.inventory.update({ where: { id: 'stock' }, data: { quantity: 10 } });
    const clientRequestId = randomUUID();
    const results = await Promise.all(Array.from({ length: 5 }, () => post('/orders').send(payload({ clientRequestId }))));
    expect(results.map(r => r.status)).toEqual([201, 201, 201, 201, 201]);
    expect(new Set(results.map(r => r.body.id)).size).toBe(1);
    expect(results.filter(r => r.body.checkoutReplay)).toHaveLength(4);
    expect(await prisma.orders.count()).toBe(1); expect(await prisma.order_items.count()).toBe(1);
    expect(await prisma.order_stock_reservations.count()).toBe(1);
    expect(await prisma.audit_trails.count({ where: { entityType: 'OrderStock' } })).toBe(1);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(0);
  });
  it('recovers a committed checkout after price, stock and order status change without notifying twice', async () => {
    const body = payload({ clientRequestId: randomUUID() });
    const notification = app.get(NotificationsService).notifyAdminsForNewOrder as jest.Mock;
    const before = notification.mock.calls.length;
    const order = (await post('/orders').send(body).expect(201)).body;
    await post(`/orders/${order.id}/cancel`).expect(201);
    await prisma.inventory.update({ where: { id: 'stock' }, data: { unitPrice: 9, expiresAt: new Date(0) } });
    const retry = (await post('/orders').send(body).expect(201)).body;
    expect(retry).toMatchObject({ id: order.id, status: 'CANCELLED', checkoutReplay: true, unitPrice: 2.5 });
    expect(notification.mock.calls.length - before).toBe(1);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(100);
    expect(await prisma.orders.count()).toBe(1);
  });
  it('rejects changed checkout details and lets only the original buyer recover the request', async () => {
    const clientRequestId = randomUUID(), body = payload({ clientRequestId });
    const order = (await post('/orders').send(body).expect(201)).body;
    for (const change of [{ quantity: 11 }, { unitPrice: 3 }, { deliveryNotes: 'Changed notes' }, { deliveryAddress: { ...body.deliveryAddress, street: 'Changed street' } }]) {
      const conflict = await post('/orders').send({ ...body, ...change }).expect(409);
      expect(conflict.body.code).toBe('ORDER_REQUEST_MISMATCH');
    }
    const recovered = (await get(`/orders/checkout/${clientRequestId}`).expect(200)).body;
    expect(recovered).toMatchObject({ id: order.id, quantity: 10, checkoutReplay: true });
    await get(`/orders/checkout/${clientRequestId}`, 'outsider').expect(404);
    await get(`/orders/checkout/${clientRequestId}`, 'admin').expect(404);
    await request(app.getHttpServer()).get(`/orders/checkout/${clientRequestId}`).expect(401);
    expect(await prisma.orders.count()).toBe(1);
  });
  it('scopes a checkout key to its buyer and permits a deliberate fresh purchase with a fresh key', async () => {
    const clientRequestId = randomUUID();
    const first = (await post('/orders').send(payload({ clientRequestId })).expect(201)).body;
    const second = (await post('/orders', 'outsider').send(payload({ clientRequestId })).expect(201)).body;
    expect(second.id).not.toBe(first.id);
    const third = (await post('/orders').send(payload({ clientRequestId: randomUUID() })).expect(201)).body;
    expect(third.id).not.toBe(first.id);
    expect(await prisma.orders.count()).toBe(3);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(70);
  });
  it('canonicalizes delivery address property order and validates checkout identifiers', async () => {
    for (const clientRequestId of ['bad-key', '', 1, 'x'.repeat(500)]) {
      await post('/orders').send(payload({ clientRequestId })).expect(400);
    }
    const body = payload({ clientRequestId: randomUUID() });
    const first = (await post('/orders').send(body).expect(201)).body;
    const a = body.deliveryAddress;
    const retry = await post('/orders').send({ ...body, deliveryAddress: { country: a.country, postalCode: a.postalCode, city: a.city, street: a.street } }).expect(201);
    expect(retry.body.id).toBe(first.id); expect(await prisma.orders.count()).toBe(1);
  });
  it('can retry the same checkout key after a transaction rollback without phantom success', async () => {
    const clientRequestId = randomUUID();
    const body = payload({ clientRequestId });
    await prisma.$executeRawUnsafe(`CREATE FUNCTION reject_checkout_stock() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected checkout failure'; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER reject_checkout_stock BEFORE INSERT ON order_stock_reservations FOR EACH ROW EXECUTE FUNCTION reject_checkout_stock()');
    try {
      await post('/orders').send(body).expect(500);
      await get(`/orders/checkout/${clientRequestId}`).expect(404);
      expect(await prisma.orders.count()).toBe(0);
      expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(100);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER reject_checkout_stock ON order_stock_reservations');
      await prisma.$executeRawUnsafe('DROP FUNCTION reject_checkout_stock()');
    }
    const created = (await post('/orders').send(body).expect(201)).body;
    const retry = (await post('/orders').send(body).expect(201)).body;
    expect(retry.id).toBe(created.id);
    expect((await prisma.inventory.findUnique({ where: { id: 'stock' } })).quantity).toBe(90);
  });

});
