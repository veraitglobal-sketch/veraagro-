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
import { SeedsModule } from '../src/seeds/seeds.module';
import { SmartLockModule } from '../src/smart-lock/smart-lock.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { buildSeedSerial, parseSeedSerial } from '../src/seed-production/seed-serial';

const testUrl = process.env.BIOVERA_TEST_DATABASE_URL;
if (!testUrl || process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL !== testUrl) {
  throw new Error('Run with npm run test:integration; an isolated test database is required.');
}

describe('Seed production — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const jwt = new JwtService({ secret: 'isolated-integration-test-secret' });
  const token = (id: string) => jwt.sign({ sub: id });
  const admin = 'admin-seed-test';
  const farmer = 'farmer-seed-test';

  beforeAll(async () => {
    process.env.SEED_LABEL_SECRET = 'integration-seed-label-secret';
    const module = await Test.createTestingModule({
      imports: [PassportModule, PrismaModule, SeedProductionModule, SeedsModule, SmartLockModule],
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
        email: 'admin-seed@test.local',
        partnerCode: 'ADMINSEED',
        passwordHash: 'x',
        firstName: 'Admin',
        lastName: 'Seed',
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
        email: 'farmer-seed@test.local',
        passwordHash: 'x',
        firstName: 'Farmer',
        lastName: 'Seed',
        partnerCode: 'FARMSEED1',
        roles: ['FARMER'],
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('full pilot flow: labels → plant → errors → recall', async () => {
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
    expect([200, 201]).toContain(productRes.status);
    const productId = productRes.body.id;

    const producerRes = await request(app.getHttpServer())
      .post('/seed-production/producers')
      .auth(token(admin), { type: 'bearer' })
      .send({ name: 'NS Seme', country: 'RS', city: 'Novi Sad' });
    expect([200, 201]).toContain(producerRes.status);
    const producerId = producerRes.body.id;

    const runRes = await request(app.getHttpServer())
      .post('/seed-production/runs')
      .auth(token(admin), { type: 'bearer' })
      .send({
        approvedProductId: productId,
        producerId,
        lotNumber: 'TST2604',
        seedCropYear: 2026,
        originCountry: 'RS',
        bagSizeLabel: '5 kg',
        bagsPlanned: 5,
      });
    expect([200, 201]).toContain(runRes.status);
    const runId = runRes.body.id;

    const issueRes = await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/issue-labels`)
      .auth(token(admin), { type: 'bearer' });
    expect([200, 201]).toContain(issueRes.status);

    const csvRes = await request(app.getHttpServer())
      .get(`/seed-production/runs/${runId}/labels.csv`)
      .auth(token(admin), { type: 'bearer' });
    expect(csvRes.status).toBe(200);
    expect(csvRes.text.split('\n').length - 1).toBe(5);

    const pdfRes = await request(app.getHttpServer())
      .get(`/seed-production/runs/${runId}/labels.pdf?format=sheet`)
      .auth(token(admin), { type: 'bearer' });
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toMatch(/pdf/);
    expect(pdfRes.body.length).toBeGreaterThan(100);

    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/confirm-production`)
      .auth(token(admin), { type: 'bearer' })
      .send({ bagsProduced: 4, productionDate: '2026-03-02T00:00:00.000Z', germinationPct: 92 });

    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/release`)
      .auth(token(admin), { type: 'bearer' });

    const serial1 = buildSeedSerial(2026, 'TST2604', 1);
    const serial2 = buildSeedSerial(2026, 'TST2604', 2);
    const voidedSerial = buildSeedSerial(2026, 'TST2604', 5);

    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/assign`)
      .auth(token(admin), { type: 'bearer' })
      .send({ growerPartnerCode: 'FARMSEED1', serials: [serial1, serial2] });

    const validateOk = await request(app.getHttpServer())
      .get(`/seeds/validate/${encodeURIComponent(serial1)}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(validateOk.status).toBe(200);
    expect(validateOk.body.origin.lot).toBe('TST2604');

    const estateId = randomUUID();
    await prisma.estates.create({
      data: {
        id: estateId,
        name: 'Seed Test Farm',
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

    const scanRes = await request(app.getHttpServer())
      .post('/smart-lock/scan')
      .auth(token(farmer), { type: 'bearer' })
      .send({
        inputSerialNumber: serial1,
        parcelId,
        gpsLatitude: 45.0005,
        gpsLongitude: 19.0005,
        deviceId: 'test-device',
      });
    expect([200, 201]).toContain(scanRes.status);

    const validateAgain = await request(app.getHttpServer())
      .get(`/seeds/validate/${encodeURIComponent(serial1)}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(validateAgain.status).toBe(400);

    const notAssigned = await request(app.getHttpServer())
      .get(`/seeds/validate/${encodeURIComponent(buildSeedSerial(2026, 'TST2604', 3))}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(notAssigned.status).toBe(403);

    const tampered = serial1.slice(0, -1) + (serial1.endsWith('A') ? 'B' : 'A');
    const badCode = await request(app.getHttpServer())
      .get(`/seeds/validate/${encodeURIComponent(tampered)}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(badCode.status).toBe(404);

    const voided = await request(app.getHttpServer())
      .get(`/seeds/validate/${encodeURIComponent(voidedSerial)}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(voided.status).toBe(400);

    const pub = await request(app.getHttpServer()).get(`/public/seed/verify/${encodeURIComponent(serial1)}`);
    expect(pub.status).toBe(200);
    expect(pub.body.genuine).toBe(true);
    expect(pub.body).not.toHaveProperty('growerId');

    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/recall`)
      .auth(token(admin), { type: 'bearer' })
      .send({ reason: 'Test recall' });

    const recalled = await request(app.getHttpServer())
      .get(`/seeds/validate/${encodeURIComponent(serial2)}`)
      .auth(token(farmer), { type: 'bearer' });
    expect(recalled.status).toBe(400);
    expect(recalled.body.message).toMatch(/recalled/i);

    expect(parseSeedSerial(`https://biovera.app/s/${serial1}`).ok).toBe(true);
  });
});
