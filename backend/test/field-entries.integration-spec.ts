import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import request = require('supertest');
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { FieldEntriesModule } from '../src/field-entries/field-entries.module';
import { SeedProductionModule } from '../src/seed-production/seed-production.module';
import { SeedsModule } from '../src/seeds/seeds.module';
import { SmartLockModule } from '../src/smart-lock/smart-lock.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { buildSeedSerial } from '../src/seed-production/seed-serial';

const testUrl = process.env.BIOVERA_TEST_DATABASE_URL;
if (!testUrl || process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL !== testUrl) {
  throw new Error('Run with npm run test:integration; an isolated test database is required.');
}

describe('Field entries — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const jwt = new JwtService({ secret: 'isolated-integration-test-secret' });
  const token = (id: string) => jwt.sign({ sub: id });
  const admin = 'admin-field-test';
  const farmer = 'farmer-field-test';

  beforeAll(async () => {
    process.env.SEED_LABEL_SECRET = 'integration-seed-label-secret';
    process.env.FIELD_ENTRY_RELAX_GPS = '1';
    const module = await Test.createTestingModule({
      imports: [PassportModule, PrismaModule, FieldEntriesModule, SeedProductionModule, SeedsModule, SmartLockModule],
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

    await prisma.users.upsert({
      where: { id: admin },
      update: {},
      create: {
        id: admin,
        email: 'admin-field@test.local',
        partnerCode: 'ADMINFIELD',
        passwordHash: 'x',
        firstName: 'Admin',
        lastName: 'Field',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    await prisma.users.upsert({
      where: { id: farmer },
      update: {},
      create: {
        id: farmer,
        email: 'farmer-field@test.local',
        passwordHash: 'x',
        firstName: 'Farmer',
        lastName: 'Field',
        partnerCode: 'FARMFIELD1',
        roles: ['FARMER'],
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedRunWithBags(count: number, lotSuffix = randomUUID().slice(0, 4).toUpperCase()) {
    const lotNumber = `FE${lotSuffix}`;
    const productRes = await request(app.getHttpServer())
      .post('/seed-production/approved-products')
      .auth(token(admin), { type: 'bearer' })
      .send({
        category: 'SEED',
        name: 'Bio Vera Raspberry seed – Willamette',
        variety: 'Willamette',
        cropType: 'Raspberry',
        unit: 'bag',
        packSize: '5 kg',
        isBioVeraBrand: true,
      });
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
        lotNumber,
        seedCropYear: 2026,
        originCountry: 'RS',
        bagSizeLabel: '5 kg',
        bagsPlanned: count,
      });
    const runId = runRes.body.id;
    await request(app.getHttpServer()).post(`/seed-production/runs/${runId}/issue-labels`).auth(token(admin), { type: 'bearer' });
    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/confirm-production`)
      .auth(token(admin), { type: 'bearer' })
      .send({ bagsProduced: count, productionDate: '2026-03-02T00:00:00.000Z', germinationPct: 92 });
    await request(app.getHttpServer()).post(`/seed-production/runs/${runId}/release`).auth(token(admin), { type: 'bearer' });
    const serials = Array.from({ length: count }, (_, i) => buildSeedSerial(2026, lotNumber, i + 1));
    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/assign`)
      .auth(token(admin), { type: 'bearer' })
      .send({ growerPartnerCode: 'FARMFIELD1', serials });
    return { runId, serials, lotNumber, estateId: randomUUID(), parcelId: randomUUID() };
  }

  async function farmWithParcel(estateId: string, parcelId: string) {
    await prisma.estates.create({
      data: {
        id: estateId,
        name: 'Field Test Farm',
        ownerId: farmer,
        polygonCoordinates: [{ lat: 45, lng: 19 }, { lat: 45.001, lng: 19 }, { lat: 45.001, lng: 19.001 }],
        calculatedArea: 4000,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    await prisma.parcels.create({
      data: {
        id: parcelId,
        estateId,
        calculatedArea: 0.4,
        polygonCoordinates: [{ lat: 45, lng: 19 }, { lat: 45.001, lng: 19 }, { lat: 45.001, lng: 19.001 }],
        status: 'ACTIVE',
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  it('persists field entry and is idempotent on clientReference', async () => {
    const { serials, estateId, parcelId } = await seedRunWithBags(1);
    await farmWithParcel(estateId, parcelId);
    const clientReference = `test-${randomUUID()}`;
    const body = {
      type: 'SETVA',
      farmId: estateId,
      clientReference,
      seedSerialNumber: serials[0],
      data: {
        date: new Date().toISOString(),
        parcelId,
        materialName: 'Bio Vera Raspberry seed – Willamette',
        materialQuantity: 5,
        materialUnit: 'kg',
        areaHa: 0.4,
        bags: [{ serial: serials[0], quantityKg: 5 }],
        location: { lat: 45.0005, lng: 19.0005 },
        notes: 'Planting test',
      },
    };
    const first = await request(app.getHttpServer())
      .post('/field-entries')
      .auth(token(farmer), { type: 'bearer' })
      .send(body);
    expect([200, 201]).toContain(first.status);
    expect(first.body.id).toBeTruthy();
    expect(first.body.synced).toBe(true);

    const second = await request(app.getHttpServer())
      .post('/field-entries')
      .auth(token(farmer), { type: 'bearer' })
      .send(body);
    expect(second.body.id).toBe(first.body.id);

    const list = await request(app.getHttpServer())
      .get(`/field-entries?farmId=${estateId}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(list.status).toBe(200);
    expect(list.body.some((e: { id: string }) => e.id === first.body.id)).toBe(true);
  });

  it('plants 3 bags with one partial — PARTIALLY_USED then remaining', async () => {
    const { serials, estateId, parcelId } = await seedRunWithBags(3);
    await farmWithParcel(estateId, parcelId);
    const partialSerial = serials[1];

    const res = await request(app.getHttpServer())
      .post('/field-entries')
      .auth(token(farmer), { type: 'bearer' })
      .send({
        type: 'SETVA',
        farmId: estateId,
        clientReference: `multi-${randomUUID()}`,
        seedSerialNumber: serials[0],
        data: {
          date: new Date().toISOString(),
          parcelId,
          materialQuantity: 12,
          materialUnit: 'kg',
          bags: [
            { serial: serials[0], quantityKg: 5 },
            { serial: partialSerial, quantityKg: 2 },
            { serial: serials[2], quantityKg: 5 },
          ],
          location: { lat: 45.0005, lng: 19.0005 },
        },
      });
    expect([200, 201]).toContain(res.status);

    const partial = await prisma.seeds.findUnique({ where: { serialNumber: partialSerial } });
    expect(partial?.status).toBe('PARTIALLY_USED');
    expect(partial?.quantityRemaining).toBeCloseTo(3, 1);

    const planted = await prisma.seeds.findMany({ where: { serialNumber: { in: [serials[0], serials[2]] } } });
    expect(planted.every((s) => s.status === 'PLANTED')).toBe(true);

    const custody = await prisma.seed_custody_events.count({
      where: { seedId: { in: planted.map((s) => s.id).concat(partial!.id) }, event: 'PLANTED' },
    });
    expect(custody).toBe(3);

    const finish = await request(app.getHttpServer())
      .post('/field-entries')
      .auth(token(farmer), { type: 'bearer' })
      .send({
        type: 'SETVA',
        farmId: estateId,
        clientReference: `finish-${randomUUID()}`,
        seedSerialNumber: partialSerial,
        data: {
          date: new Date().toISOString(),
          parcelId,
          bags: [{ serial: partialSerial, quantityKg: 3 }],
          location: { lat: 45.0005, lng: 19.0005 },
        },
      });
    expect([200, 201]).toContain(finish.status);
    const after = await prisma.seeds.findUnique({ where: { serialNumber: partialSerial } });
    expect(after?.status).toBe('PLANTED');
    expect(after?.quantityRemaining).toBeNull();

    const tooMuch = await request(app.getHttpServer())
      .post('/field-entries')
      .auth(token(farmer), { type: 'bearer' })
      .send({
        type: 'SETVA',
        farmId: estateId,
        data: {
          date: new Date().toISOString(),
          parcelId,
          bags: [{ serial: partialSerial, quantityKg: 1 }],
          location: { lat: 45.0005, lng: 19.0005 },
        },
      });
    expect(tooMuch.status).toBe(400);
  });

  it('rejects invalid bag in multi-bag list without failing others upfront', async () => {
    const { serials, lotNumber, estateId, parcelId } = await seedRunWithBags(2);
    await farmWithParcel(estateId, parcelId);
    const badSerial = buildSeedSerial(2026, lotNumber, 99);

    const res = await request(app.getHttpServer())
      .post('/field-entries')
      .auth(token(farmer), { type: 'bearer' })
      .send({
        type: 'SETVA',
        farmId: estateId,
        data: {
          date: new Date().toISOString(),
          parcelId,
          bags: [
            { serial: serials[0], quantityKg: 5 },
            { serial: badSerial, quantityKg: 5 },
          ],
          location: { lat: 45.0005, lng: 19.0005 },
        },
      });
    expect(res.status).toBe(400);
    expect(String(res.body.message)).toMatch(badSerial);

    const bag0 = await prisma.seeds.findUnique({ where: { serialNumber: serials[0] } });
    expect(bag0?.status).not.toBe('PLANTED');
  });
});
