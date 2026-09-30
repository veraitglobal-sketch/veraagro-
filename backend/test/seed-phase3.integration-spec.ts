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
import { EmailService } from '../src/email/email.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { buildSeedSerial } from '../src/seed-production/seed-serial';

const testUrl = process.env.BIOVERA_TEST_DATABASE_URL;
if (!testUrl || process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL !== testUrl) {
  throw new Error('Run with npm run test:integration; an isolated test database is required.');
}

describe('Seed phase 3 — integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const jwt = new JwtService({ secret: 'isolated-integration-test-secret' });
  const token = (id: string) => jwt.sign({ sub: id });
  const admin = 'admin-phase3-test';
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
      .useValue({ create: jest.fn().mockResolvedValue({}), notifyAdmins: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(EmailService)
      .useValue({
        sendFarmerWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        sendProducerPortalInviteEmail: jest.fn().mockResolvedValue(undefined),
      })
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
        email: 'admin-phase3@test.local',
        partnerCode: 'ADMINP3',
        passwordHash: 'x',
        firstName: 'Admin',
        lastName: 'P3',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  async function createProducerWithRun(lotNumber: string) {
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
    const producerRes = await request(app.getHttpServer())
      .post('/seed-production/producers')
      .auth(token(admin), { type: 'bearer' })
      .send({ name: `Factory ${lotNumber}`, country: 'RS', city: 'Novi Sad' });
    const runRes = await request(app.getHttpServer())
      .post('/seed-production/runs')
      .auth(token(admin), { type: 'bearer' })
      .send({
        approvedProductId: productRes.body.id,
        producerId: producerRes.body.id,
        lotNumber,
        seedCropYear: 2026,
        originCountry: 'RS',
        bagSizeLabel: '5 kg',
        bagsPlanned: 4,
      });
    return { producerId: producerRes.body.id, runId: runRes.body.id, lotNumber };
  }

  it('invite links SEED_PRODUCER user; second invite returns 409', async () => {
    const lot = `P3${randomUUID().slice(0, 4).toUpperCase()}`;
    const { producerId } = await createProducerWithRun(lot);

    const first = await request(app.getHttpServer())
      .post(`/seed-production/producers/${producerId}/invite`)
      .auth(token(admin), { type: 'bearer' })
      .send({ firstName: 'Prod', lastName: 'A', email: `prod-a-${lot}@test.local` });
    expect([200, 201]).toContain(first.status);
    expect(first.body.userId).toBeTruthy();

    const second = await request(app.getHttpServer())
      .post(`/seed-production/producers/${producerId}/invite`)
      .auth(token(admin), { type: 'bearer' })
      .send({ firstName: 'Prod', lastName: 'B', email: `prod-b-${lot}@test.local` });
    expect(second.status).toBe(409);
  });

  it('producer A cannot read producer B run', async () => {
    const lotA = `PA${randomUUID().slice(0, 3).toUpperCase()}`;
    const lotB = `PB${randomUUID().slice(0, 3).toUpperCase()}`;
    const runA = await createProducerWithRun(lotA);
    const runB = await createProducerWithRun(lotB);

    const inviteA = await request(app.getHttpServer())
      .post(`/seed-production/producers/${runA.producerId}/invite`)
      .auth(token(admin), { type: 'bearer' })
      .send({ firstName: 'A', lastName: 'Factory', email: `a-${lotA}@test.local` });

    const forbidden = await request(app.getHttpServer())
      .get(`/seed-producer/runs/${runB.runId}`)
      .auth(token(inviteA.body.userId), { type: 'bearer' });
    expect([403, 404]).toContain(forbidden.status);
  });

  it('reports summary and CSV export match bag count', async () => {
    const lot = `RP${randomUUID().slice(0, 4).toUpperCase()}`;
    const { runId } = await createProducerWithRun(lot);
    await request(app.getHttpServer()).post(`/seed-production/runs/${runId}/issue-labels`).auth(token(admin), { type: 'bearer' });

    const summary = await request(app.getHttpServer())
      .get('/seed-production/reports/summary?year=2026')
      .auth(token(admin), { type: 'bearer' });
    expect(summary.status).toBe(200);
    expect(Array.isArray(summary.body.byProductYear)).toBe(true);

    const csv = await request(app.getHttpServer())
      .get(`/seed-production/reports/bags.csv?runId=${runId}`)
      .auth(token(admin), { type: 'bearer' });
    expect(csv.status).toBe(200);
    const lines = String(csv.text).trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(5);
    expect(lines[0]).toContain('serial');
  });

  it('recall-impact lists growers for assigned bags', async () => {
    const lot = `RC${randomUUID().slice(0, 4).toUpperCase()}`;
    const { runId } = await createProducerWithRun(lot);
    await request(app.getHttpServer()).post(`/seed-production/runs/${runId}/issue-labels`).auth(token(admin), { type: 'bearer' });
    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/confirm-production`)
      .auth(token(admin), { type: 'bearer' })
      .send({ bagsProduced: 4, productionDate: '2026-03-02T00:00:00.000Z' });
    await request(app.getHttpServer()).post(`/seed-production/runs/${runId}/release`).auth(token(admin), { type: 'bearer' });

    const farmerId = 'farmer-recall-p3';
    await prisma.users.upsert({
      where: { id: farmerId },
      update: {},
      create: {
        id: farmerId,
        email: 'farmer-recall@test.local',
        partnerCode: 'FARMRECALL',
        passwordHash: 'x',
        firstName: 'Farmer',
        lastName: 'Recall',
        roles: ['FARMER'],
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    const serial = buildSeedSerial(2026, lot, 1);
    await request(app.getHttpServer())
      .post(`/seed-production/runs/${runId}/assign`)
      .auth(token(admin), { type: 'bearer' })
      .send({ growerPartnerCode: 'FARMRECALL', serials: [serial] });

    const impact = await request(app.getHttpServer())
      .get(`/seed-production/reports/recall-impact/${runId}`)
      .auth(token(admin), { type: 'bearer' });
    expect(impact.status).toBe(200);
    expect(impact.body.bagsToRecall).toBeGreaterThan(0);
    expect(impact.body.growers.some((g: { partnerCode?: string }) => g.partnerCode === 'FARMRECALL')).toBe(true);
  });
});
