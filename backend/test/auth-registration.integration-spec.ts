import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request = require('supertest');
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { EmailService } from '../src/email/email.service';
import { NotificationsService } from '../src/notifications/notifications.service';

const testUrl = process.env.DATABASE_URL;
if (!testUrl || process.env.NODE_ENV !== 'test') {
  throw new Error('Set NODE_ENV=test and DATABASE_URL to the local biovera_db.');
}
const parsed = new URL(testUrl);
const localHost = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
const allowedDb = parsed.pathname === '/biovera_db' || parsed.pathname === '/biovera_test';
if (!localHost || !allowedDb) {
  throw new Error('Refusing to test against a non-local database.');
}

describe('Auth registration — buyer/grower location (no hubs)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        PrismaService,
        AuthService,
        UsersService,
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback?: unknown) => fallback },
        },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('test-token') } },
        {
          provide: EmailService,
          useValue: { sendVerificationEmail: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: NotificationsService,
          useValue: { notifyAdminsForNewBuyerRegistration: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('buyer registration with location succeeds, creates no hub, stores GPS on delivery location', async () => {
    const email = `buyer-loc-${Date.now()}@test.local`;
    const latitude = 53.551086;
    const longitude = 9.993682;

    const res = await request(app.getHttpServer())
      .post('/auth/register/buyer')
      .send({
        email,
        firstName: 'Test',
        lastName: 'Buyer',
        password: 'secret123',
        businessName: 'Test GmbH',
        address: 'Hafenstraße 12',
        city: 'Hamburg',
        postalCode: '20457',
        country: 'Germany',
        location: { latitude, longitude },
      })
      .expect(201);

    expect(res.body.status).toBe('PENDING_APPROVAL');

    const user = await prisma.users.findFirst({ where: { email } });
    expect(user).toBeTruthy();
    expect(user!.roles).toContain('BUYER');

    const profile = user!.buyerCompanyProfile as {
      deliveryLocations: Array<{ latitude: number; longitude: number; address: string; city: string }>;
    };
    expect(profile.deliveryLocations).toHaveLength(1);
    expect(profile.deliveryLocations[0].latitude).toBe(latitude);
    expect(profile.deliveryLocations[0].longitude).toBe(longitude);
    expect(profile.deliveryLocations[0].address).toBe('Hafenstraße 12');
    expect(profile.deliveryLocations[0].city).toBe('Hamburg');

    const hubCount = await prisma.hubs.count({ where: { managerId: user!.id } });
    expect(hubCount).toBe(0);
  });

  it('grower registration with location succeeds, creates no hub, stores farm anchor on estate', async () => {
    const email = `grower-loc-${Date.now()}@test.local`;
    const latitude = 44.786568;
    const longitude = 20.448922;

    const res = await request(app.getHttpServer())
      .post('/auth/register/grower')
      .send({
        email,
        firstName: 'Grow',
        lastName: 'Er',
        password: 'secret123',
        totalHectares: 12.5,
        farmName: 'Sunrise Farm',
        address: 'Village road 1',
        city: 'Novi Sad',
        country: 'Serbia',
        location: { latitude, longitude },
      })
      .expect(201);

    expect(res.body.requiresEmailVerification).toBe(true);

    const user = await prisma.users.findFirst({ where: { email } });
    expect(user).toBeTruthy();
    expect(user!.roles).toContain('FARMER');

    const hubCount = await prisma.hubs.count({ where: { managerId: user!.id } });
    expect(hubCount).toBe(0);

    const estates = await prisma.estates.findMany({ where: { ownerId: user!.id } });
    expect(estates).toHaveLength(1);
    expect(estates[0].name).toBe('Sunrise Farm');
    expect(estates[0].calculatedArea).toBe(12.5);

    const polygon = estates[0].polygonCoordinates as Array<{ lat: number; lng: number }>;
    expect(Array.isArray(polygon)).toBe(true);
    expect(polygon[0].lat).toBeCloseTo(latitude, 4);
    expect(polygon[0].lng).toBeCloseTo(longitude, 4);
  });
});
