import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import request = require('supertest');
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { SeedProductionModule } from '../src/seed-production/seed-production.module';
import { B2bSuppliersModule } from '../src/b2b-suppliers/b2b-suppliers.module';
import { SeedsModule } from '../src/seeds/seeds.module';
import { SmartLockModule } from '../src/smart-lock/smart-lock.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { buildSeedSerial } from '../src/seed-production/seed-serial';

const testUrl = process.env.BIOVERA_TEST_DATABASE_URL;
if (!testUrl || process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL !== testUrl) {
  throw new Error('Run with npm run test:integration; an isolated test database is required.');
}

describe('Seed supplier chain — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const jwt = new JwtService({ secret: 'isolated-integration-test-secret' });
  const token = (id: string) => jwt.sign({ sub: id });
  const admin = 'admin-supplier-chain';
  const farmer = 'farmer-supplier-chain';
  const supplierA = 'supplier-a-chain';
  const supplierB = 'supplier-b-chain';

  beforeAll(async () => {
    process.env.SEED_LABEL_SECRET = 'integration-seed-label-secret';
    const module = await Test.createTestingModule({
      imports: [PassportModule, PrismaModule, SeedProductionModule, B2bSuppliersModule, SeedsModule, SmartLockModule],
      providers: [
        JwtStrategy,
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { get: (key: string, fb?: unknown) => (key === 'JWT_SECRET' ? 'isolated-integration-test-secret' : fb) },
        },
      ],
    })
      .overrideProvider(NotificationsService)
      .useValue({ create: jest.fn().mockResolvedValue({}) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    prisma = module.get(PrismaService);

    const mkUser = async (id: string, roles: string[], partnerCode: string) => {
      await prisma.users.upsert({
        where: { id },
        update: { roles: roles as never, partnerCode },
        create: {
          id,
          email: `${id}@test.local`,
          partnerCode,
          passwordHash: 'x',
          firstName: id,
          lastName: 'Test',
          roles: roles as never,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });
    };

    await mkUser(admin, ['ADMIN'], 'ADMCHAIN');
    await mkUser(farmer, ['FARMER'], 'FARMCHAIN');
    await mkUser(supplierA, ['MATERIAL_SUPPLIER'], 'SUPACHAIN');
    await mkUser(supplierB, ['MATERIAL_SUPPLIER'], 'SUPBCHAIN');

    for (const [uid, name] of [
      [supplierA, 'Supplier A Store'],
      [supplierB, 'Supplier B Store'],
    ] as const) {
      await prisma.material_supplier_profiles.upsert({
        where: { userId: uid },
        update: { mapApproved: true, businessName: name },
        create: {
          id: randomUUID(),
          userId: uid,
          businessName: name,
          address: 'Test St 1',
          postalCode: '21000',
          city: 'Novi Sad',
          country: 'RS',
          location: { lat: 45.25, lng: 19.83 },
          mapApproved: true,
          updatedAt: new Date(),
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('ship → receive → sell → plant → map & catalog rules', async () => {
    const productRes = await request(app.getHttpServer())
      .post('/seed-production/approved-products')
      .auth(token(admin), { type: 'bearer' })
      .send({
        category: 'SEED',
        name: 'Bio Vera Raspberry seed – Willamette',
        variety: 'Willamette',
        unit: 'bag',
        isBioVeraBrand: true,
      });
    expect([200, 201]).toContain(productRes.status);
    const productId = productRes.body.id;

    const producerRes = await request(app.getHttpServer())
      .post('/seed-production/producers')
      .auth(token(admin), { type: 'bearer' })
      .send({ name: 'NS Seme', country: 'RS', city: 'Novi Sad' });
    const producerId = producerRes.body.id;

    const runRes = await request(app.getHttpServer())
      .post('/seed-production/runs')
      .auth(token(admin), { type: 'bearer' })
      .send({
        approvedProductId: productId,
        producerId,
        lotNumber: 'SUP2604',
        seedCropYear: 2026,
        originCountry: 'RS',
        bagSizeLabel: '5 kg',
        bagsPlanned: 5,
      });
    const runId = runRes.body.id;

    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/issue-labels`)
      .auth(token(admin), { type: 'bearer' });
    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/confirm-production`)
      .auth(token(admin), { type: 'bearer' })
      .send({ bagsProduced: 5, productionDate: '2026-03-02T00:00:00.000Z' });
    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/release`)
      .auth(token(admin), { type: 'bearer' });

    const serials = [1, 2, 3, 4, 5].map((n) => buildSeedSerial(2026, 'SUP2604', n));
    const sellSerial1 = serials[0];
    const sellSerial2 = serials[1];

    const shipRes = await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/ship`)
      .auth(token(admin), { type: 'bearer' })
      .send({ supplierUserId: supplierA, serials });
    expect([200, 201]).toContain(shipRes.status);
    expect(shipRes.body.results.filter((r: { ok: boolean }) => r.ok).length).toBe(5);

    const receiveA = await request(app.getHttpServer())
      .post('/b2b-suppliers/me/seed-bags/receive')
      .auth(token(supplierA), { type: 'bearer' })
      .send({ serials });
    expect([200, 201]).toContain(receiveA.status);
    expect(receiveA.body.results.every((r: { ok: boolean }) => r.ok)).toBe(true);

    const receiveB = await request(app.getHttpServer())
      .post('/b2b-suppliers/me/seed-bags/receive')
      .auth(token(supplierB), { type: 'bearer' })
      .send({ serials: [serials[2]] });
    expect(receiveB.body.results[0].ok).toBe(false);
    expect(receiveB.body.results[0].reason).toBe('WRONG_SUPPLIER');

    const sellRes = await request(app.getHttpServer())
      .post('/b2b-suppliers/me/seed-bags/sell')
      .auth(token(supplierA), { type: 'bearer' })
      .send({ growerPartnerCode: 'FARMCHAIN', serials: [sellSerial1, sellSerial2] });
    expect([200, 201]).toContain(sellRes.status);
    expect(sellRes.body.results.filter((r: { ok: boolean }) => r.ok).length).toBe(2);

    const estateId = randomUUID();
    await prisma.estates.create({
      data: {
        id: estateId,
        name: 'Chain Test Farm',
        ownerId: farmer,
        polygonCoordinates: [{ lat: 45.0, lng: 19.0 }, { lat: 45.001, lng: 19.0 }, { lat: 45.001, lng: 19.001 }],
        calculatedArea: 1000,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    const parcelId = randomUUID();
    await prisma.parcels.create({
      data: {
        id: parcelId,
        estateId,
        calculatedArea: 1000,
        polygonCoordinates: [{ lat: 45.0, lng: 19.0 }, { lat: 45.001, lng: 19.0 }, { lat: 45.001, lng: 19.001 }],
        status: 'ACTIVE',
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const validateOk = await request(app.getHttpServer())
      .get(`/seeds/validate/${encodeURIComponent(sellSerial1)}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(validateOk.status).toBe(200);

    await request(app.getHttpServer())
      .post('/smart-lock/scan')
      .auth(token(farmer), { type: 'bearer' })
      .send({
        inputSerialNumber: sellSerial1,
        parcelId,
        gpsLatitude: 45.0005,
        gpsLongitude: 19.0005,
        deviceId: 'test-device',
      });

    const sellAgain = await request(app.getHttpServer())
      .post('/b2b-suppliers/me/seed-bags/sell')
      .auth(token(supplierA), { type: 'bearer' })
      .send({ growerPartnerCode: 'FARMCHAIN', serials: [sellSerial1] });
    expect(sellAgain.body.results[0].ok).toBe(false);

    const freeTextCatalog = await request(app.getHttpServer())
      .post('/b2b-suppliers/my/catalog')
      .auth(token(supplierA), { type: 'bearer' })
      .send({ name: 'Random seed', unit: 'bag' });
    expect(freeTextCatalog.status).toBe(400);

    const unlinkedId = randomUUID();
    await prisma.supplier_catalog_items.create({
      data: {
        id: unlinkedId,
        supplierUserId: supplierA,
        name: 'Legacy free text',
        unit: 'bag',
        isActive: true,
        sortOrder: 0,
        updatedAt: new Date(),
      },
    });

    const linkedCatalog = await request(app.getHttpServer())
      .post('/b2b-suppliers/my/catalog')
      .auth(token(supplierA), { type: 'bearer' })
      .send({ approvedProductId: productId, listPrice: 12 });
    expect([200, 201]).toContain(linkedCatalog.status);

    const mapRes = await request(app.getHttpServer()).get('/b2b-suppliers/public/map');
    expect(mapRes.status).toBe(200);
    const pinA = mapRes.body.find((p: { id: string }) => p.id === supplierA);
    expect(pinA).toBeTruthy();
    const totalStock = (pinA.bioVeraSeedInStock as Array<{ bags: number }>).reduce((s, x) => s + x.bags, 0);
    expect(totalStock).toBe(3);
    const catalogNames = (pinA.catalog as Array<{ name: string }>).map((c) => c.name);
    expect(catalogNames).toContain('Bio Vera Raspberry seed – Willamette');
    expect(catalogNames).not.toContain('Legacy free text');
  });
});
