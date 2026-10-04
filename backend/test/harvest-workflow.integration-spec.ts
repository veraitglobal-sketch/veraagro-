import { ImageResizeService } from '../src/common/image/image-resize.service';
import { B2bSuppliersController } from '../src/b2b-suppliers/b2b-suppliers.controller';
import { B2bSuppliersService } from '../src/b2b-suppliers/b2b-suppliers.service';
import { GrowerPortalController } from '../src/grower-portal/grower-portal.controller';
import { GrowerPortalService } from '../src/grower-portal/grower-portal.service';
import { QrService } from '../src/qr/qr.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import request = require('supertest');
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { BatchesService } from '../src/batches/batches.service';
import { BatchesController } from '../src/batches/batches.controller';
import { MissionsService } from '../src/missions/missions.service';
import { MissionsController } from '../src/missions/missions.controller';
import { HarvestAnnouncementsService } from '../src/harvest-announcements/harvest-announcements.service';
import { HarvestAnnouncementsController } from '../src/harvest-announcements/harvest-announcements.controller';
import { MaterialControlService } from '../src/material-control/material-control.service';
import { TreatmentLogsService } from '../src/treatment-logs/treatment-logs.service';
import { FreshnessService } from '../src/freshness/freshness.service';
import { AuditTrailService } from '../src/audit-trail/audit-trail.service';
import { NotificationsGateway } from '../src/notifications/notifications.gateway';
import { NotificationsService } from '../src/notifications/notifications.service';
import { BlockchainService } from '../src/blockchain/blockchain.service';
import { GrowthLogsController } from '../src/growth-logs/growth-logs.controller';
import { GrowthLogsService } from '../src/growth-logs/growth-logs.service';
import { AntiFraudService } from '../src/anti-fraud/anti-fraud.service';
import { MaterialBarcodeValidationService } from '../src/compliance/material-barcode-validation.service';
import { GrowthLogTreatmentSyncService } from '../src/treatment-logs/growth-log-treatment-sync.service';
import { SmartLockService } from '../src/smart-lock/smart-lock.service';

const url = process.env.BIOVERA_TEST_DATABASE_URL;
if (!url || process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL !== url ||
    new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/biovera_test') {
  throw new Error('Use npm run test:integration with its disposable PostgreSQL database.');
}

describe('Harvest plan → lot → mission (real HTTP and PostgreSQL)', () => {
  let app: INestApplication;
  let db: PrismaService;
  const jwt = new JwtService({ secret: 'isolated-integration-test-secret' });
  const auth = (id: string) => jwt.sign({ sub: id });
  const post = (path: string, actor = 'farmer') => request(app.getHttpServer()).post(path).auth(auth(actor), { type: 'bearer' });
  const get = (path: string, actor = 'farmer') => request(app.getHttpServer()).get(path).auth(auth(actor), { type: 'bearer' });
  const polygon = [{ lat: 44, lng: 20 }, { lat: 44.01, lng: 20.01 }];
  const batchBody = (extra = {}) => ({ estateId: 'farm', parcelId: 'plot', productName: 'Apple', quantity: 20,
    unit: 'kg', harvestDate: '2026-09-26', harvestAnnouncementId: 'plan', ...extra });
  const missionBody = (batchId: string, extra = {}) => ({ batchId, pickupAddress: 'Test farm',
    pickupLocation: { lat: 44, lng: 20 }, ...extra });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [B2bSuppliersController, GrowerPortalController, BatchesController, MissionsController, HarvestAnnouncementsController, GrowthLogsController],
      providers: [{ provide: ImageResizeService, useValue: {} }, B2bSuppliersService, GrowerPortalService, { provide: QrService, useValue: {} }, PrismaService, JwtStrategy, BatchesService, MissionsService, HarvestAnnouncementsService, MaterialControlService,
        GrowthLogsService, AntiFraudService,
        // Ordinary progress entries do not use material scanning or treatment synchronization.
        { provide: MaterialBarcodeValidationService, useValue: {} },
        { provide: GrowthLogTreatmentSyncService, useValue: {} },
        { provide: SmartLockService, useValue: {} },
        { provide: ConfigService, useValue: { get: (key: string, fallback?: string) => key === 'JWT_SECRET' ? 'isolated-integration-test-secret' : fallback } },
        { provide: FreshnessService, useValue: { createFreshnessTracker: async () => undefined } },
        { provide: TreatmentLogsService, useValue: { getEarliestHarvestDate: async () => ({ date: null }) } },
        { provide: AuditTrailService, useValue: { createAuditTrail: async () => undefined } },
        { provide: NotificationsGateway, useValue: { notifyMissionUpdate: async () => undefined } },
        { provide: NotificationsService, useValue: { create: async () => undefined,
          notifyAdminsNewGrowthPhoto: async () => undefined,
          notifyAdminsForNewTransportRequest: async () => undefined, sendSmartNotification: async () => undefined } },
        { provide: BlockchainService, useValue: { isEnabled: () => false } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    db = app.get(PrismaService);
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(async () => {
    delete process.env.MISSIONS_SKIP_ADMIN_APPROVAL;
    delete process.env.MISSIONS_AUTO_ASSIGN_LOGISTICS_PARTNER;
    delete process.env.MISSIONS_REQUIRE_CONFIRMED_HARVEST_PLAN;
    await db.$executeRawUnsafe('TRUNCATE TABLE users, bio_vera_standards CASCADE');
    for (const [id, role] of Object.entries({ farmer: UserRole.GROWER, other: UserRole.GROWER, admin: UserRole.SUPER_ADMIN, logistics: UserRole.LOGISTICS_PARTNER, supplier: UserRole.MATERIAL_SUPPLIER })) {
      await db.users.create({ data: { id, partnerCode: id, firstName: id, lastName: 'Test', passwordHash: 'not-a-login-password', roles: [role], status: 'ACTIVE', updatedAt: new Date() } });
    }
    await db.estates.create({ data: { id: 'farm', ownerId: 'farmer', name: 'Test farm', polygonCoordinates: polygon,
      calculatedArea: 1, status: 'ACTIVE', updatedAt: new Date() } });
    await db.parcels.create({ data: { id: 'plot', estateId: 'farm', polygonCoordinates: polygon, calculatedArea: 1,
      status: 'ACTIVE', cropType: 'Apple', updatedAt: new Date() } });
    await db.harvest_announcements.create({ data: { id: 'plan', userId: 'farmer', parcelId: 'plot', announcementType: 'HARVEST',
      cropType: 'Apple', estimatedDate: new Date('2026-09-26'), estimatedQuantity: 20, status: 'CONFIRMED', updatedAt: new Date() } });
    // This suite tests linkage; a separate test below enables the real photo gate.
    await db.bio_vera_standards.create({ data: { id: 'standard', requiredTemperatureMin: 2, requiredTemperatureMax: 8,
      requiredPackagingType: 'BIO_VERA_CRATE', requiredFilmType: 'BIO_VERA_FILM', requiresCompliancePhotos: false,
      requiredPhotoTypes: [], updatedAt: new Date() } });
  });

  async function planting() {
    await db.harvest_announcements.update({ where: { id: 'plan' }, data: { status: 'COMPLETED' } });
    return (await post('/harvest-announcements').send({ parcelId: 'plot', announcementType: 'PLANTING',
      cropType: 'Apple', estimatedDate: '2026-03-01' }).expect(201)).body;
  }

  it('preserves the chosen planting through journal, harvest and lot, with owner and admin visibility', async () => {
    const source = await planting();
    await db.parcels.update({ where: { id: 'plot' }, data: { approvedAt: new Date() } });
    const entry = {
      estateId: 'farm', parcelId: 'plot', harvestAnnouncementId: source.id,
      imageUrl: 'https://example.invalid/progress.jpg', imageHash: 'a'.repeat(64),
      gpsLatitude: 44.005, gpsLongitude: 20.005, deviceId: 'integration-device',
      deviceTimestamp: new Date().toISOString(), growthStage: 'Flowering',
      notes: 'Visible progress on the selected planting.',
    };
    const log = (await post('/growth-logs').send(entry).expect(201)).body;
    const diary = (await get('/growth-logs/parcel/plot').expect(200)).body;
    expect(diary).toHaveLength(1);
    expect(diary[0]).toMatchObject({ id: log.id, ...entry, harvest_announcements: { id: source.id } });
    expect(await db.growth_logs.findUniqueOrThrow({ where: { id: log.id } })).toMatchObject({
      userId: 'farmer', parcelId: 'plot', harvestAnnouncementId: source.id,
      gpsLatitude: entry.gpsLatitude, gpsLongitude: entry.gpsLongitude, notes: entry.notes,
    });
    await get('/growth-logs/parcel/plot', 'other').expect(403);
    await post('/growth-logs', 'other').send(entry).expect(403);
    await get('/growth-logs/admin/list').expect(403);
    expect((await get('/growth-logs/admin/list', 'admin').expect(200)).body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: log.id, harvestAnnouncementId: source.id })]),
    );
    const harvest = (await post('/harvest-announcements').send({ parcelId: 'plot', announcementType: 'HARVEST',
      cropType: 'Apple', estimatedDate: '2026-09-26', estimatedQuantity: 20, sourcePlantingId: source.id }).expect(201)).body;
    expect(harvest.sourcePlantingId).toBe(source.id);
    const lot = (await post('/batches').send(batchBody({ harvestAnnouncementId: harvest.id })).expect(201)).body;
    const workflow = (await get(`/batches/${lot.id}/workflow`).expect(200)).body;
    expect(workflow.harvestPlan).toMatchObject({ sourcePlantingId: source.id, parcelId: 'plot' });
    const plans = (await get('/harvest-announcements/my-announcements').expect(200)).body;
    expect(plans.find(row => row.id === harvest.id).sourcePlantingId).toBe(source.id);
    expect(plans.find(row => row.id === source.id).plantingProgress.lastGrowthLogAt).toBe(log.networkTimestamp);
    await expect(app.get(HarvestAnnouncementsService).adminDeletePlanting('admin', source.id)).rejects.toThrow('linked harvests');
  });

  it.each(['foreign', 'parcel', 'type', 'cancelled', 'local'])('rejects invalid source planting: %s', async (kind) => {
    const source = await planting();
    if (kind === 'foreign') await db.harvest_announcements.update({ where: { id: source.id }, data: { userId: 'other' } });
    if (kind === 'type') await db.harvest_announcements.update({ where: { id: source.id }, data: { announcementType: 'HARVEST', status: 'COMPLETED' } });
    if (kind === 'cancelled') await db.harvest_announcements.update({ where: { id: source.id }, data: { status: 'CANCELLED' } });
    if (kind === 'parcel') {
      await db.parcels.create({ data: { id: 'plot2', estateId: 'farm', polygonCoordinates: polygon, calculatedArea: 1, status: 'ACTIVE', updatedAt: new Date() } });
      await db.harvest_announcements.update({ where: { id: source.id }, data: { parcelId: 'plot2' } });
    }
    await post('/harvest-announcements').send({ parcelId: 'plot', announcementType: 'HARVEST', cropType: 'Apple',
      estimatedDate: '2026-09-26', estimatedQuantity: 20, sourcePlantingId: kind === 'local' ? 'local:queued' : source.id }).expect(400);
    expect(await db.harvest_announcements.count()).toBe(2);
  });

  it('returns linked lots with the saved harvest plan', async () => {
    const lot = (await post('/batches').send(batchBody()).expect(201)).body;
    const plans = (await get('/harvest-announcements/my-announcements').expect(200)).body;
    expect(plans.find(plan => plan.id === 'plan').batches).toEqual([{ id: lot.id, batchId: lot.batchId, status: lot.status }]);
    expect((await get('/harvest-announcements/my-announcements', 'other').expect(200)).body).toEqual([]);
  });

  async function supplierOrder(status: 'PENDING' | 'CONFIRMED' = 'CONFIRMED') {
    return db.supplier_direct_orders.create({ data: { farmerId: 'farmer', supplierUserId: 'supplier', status,
      items: [{ label: 'Tomato seed', quantity: 2, unit: 'bag' }, { label: 'Crates', quantity: 4, unit: 'pcs' }] } });
  }

  it('receives procurement once under concurrent HTTP requests and reads products back for only its owner', async () => {
    const order = await supplierOrder();
    const responses = await Promise.all([1, 2, 3].map(() => post(`/b2b-suppliers/orders/${order.id}/farmer-received`)));
    expect(responses.map(r => r.status)).toEqual([201, 201, 201]);
    const rows = (await get('/grower-portal/products').expect(200)).body;
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.quantity).sort()).toEqual([2, 4]);
    expect(rows.every(r => r.sourceOrderId === order.id && r.status === 'synced')).toBe(true);
    expect((await get('/grower-portal/products', 'other').expect(200)).body).toEqual([]);
    expect((await db.supplier_direct_orders.findUniqueOrThrow({ where: { id: order.id } })).farmerReceivedAt).not.toBeNull();
  });

  it('does not record products for a foreign or unconfirmed supplier order', async () => {
    const order = await supplierOrder('PENDING');
    await post(`/b2b-suppliers/orders/${order.id}/farmer-received`, 'other').expect(404);
    await post(`/b2b-suppliers/orders/${order.id}/farmer-received`).expect(400);
    expect(await db.grower_mobile_ingest.count()).toBe(0);
  });

  it('rolls back the receipt when product recording fails', async () => {
    const order = await supplierOrder();
    const service = app.get(B2bSuppliersService);
    const transaction = db.$transaction.bind(db);
    const spy = jest.spyOn(db, '$transaction').mockImplementation(((callback: any) => transaction(async (tx: any) => {
      tx.grower_mobile_ingest.createMany = async () => { throw new Error('product store unavailable'); };
      return callback(tx);
    })) as any);
    try { await expect(service.markFarmerReceived('farmer', order.id)).rejects.toThrow('product store unavailable'); }
    finally { spy.mockRestore(); }
    expect((await db.supplier_direct_orders.findUniqueOrThrow({ where: { id: order.id } })).farmerReceivedAt).toBeNull();
    expect(await db.grower_mobile_ingest.count()).toBe(0);
  });

  it('persists exactly the selected plan and returns it after reloading the lot', async () => {
    const lot = (await post('/batches').send(batchBody()).expect(201)).body;
    expect(lot.harvestAnnouncementId).toBe('plan');
    const result = (await get(`/batches/${lot.id}/workflow`).expect(200)).body;
    expect(result.harvestPlan.id).toBe('plan');
    expect(result.mission).toBeNull();
    expect((await get(`/batches/${lot.batchId}/workflow`).expect(200)).body).toEqual(result);
    await get(`/batches/${lot.id}/workflow`, 'other').expect(404);
    await request(app.getHttpServer()).get(`/batches/${lot.id}/workflow`).expect(401);
  });

  it.each(['unknown', 'local:queued'])('rejects an invalid selected plan %s without creating a lot', async (id) => {
    await post('/batches').send(batchBody({ harvestAnnouncementId: id })).expect(400);
    expect(await db.batches.count()).toBe(0);
  });

  it.each([{ userId: 'other' }, { announcementType: 'PLANTING' }, { status: 'CANCELLED' }])('rejects a foreign, planting or cancelled plan: %j', async (data) => {
    await db.harvest_announcements.update({ where: { id: 'plan' }, data });
    await post('/batches').send(batchBody()).expect(400);
    expect(await db.batches.count()).toBe(0);
  });

  it('rejects a plan from a different parcel and a foreign estate even without a parcel', async () => {
    await db.parcels.create({ data: { id: 'plot2', estateId: 'farm', polygonCoordinates: polygon, calculatedArea: 1, status: 'ACTIVE', updatedAt: new Date() } });
    await post('/batches').send(batchBody({ parcelId: 'plot2' })).expect(400);
    await post('/batches', 'other').send(batchBody({ parcelId: undefined, harvestAnnouncementId: undefined })).expect(403);
  });

  it('attaches the lot to the existing plan mission, with concurrent retry returning the same ID', async () => {
    const planned = (await post('/harvest-announcements/plan/retry-transport').send({}).expect(201)).body;
    expect(planned.status).toBe('AWAITING_APPROVAL');
    await db.missions.update({ where: { id: planned.id }, data: {
      destinationAddress: 'Operations destination', loadInstructions: 'Reserved dock',
    } });
    const lot = (await post('/batches').send(batchBody()).expect(201)).body;
    const results = await Promise.all([post('/missions').send(missionBody(lot.id)), post('/missions').send(missionBody(lot.id))]);
    for (const r of results) { expect({ status: r.status, body: r.body }).toMatchObject({ status: 201, body: { id: planned.id, batchId: lot.id } }); }
    expect(await db.missions.count()).toBe(1);
    const stored = await db.missions.findUnique({ where: { id: planned.id } });
    expect(stored.pickupLocation).toEqual({ lat: 44, lng: 20 });
    expect(stored.pickupAddress).toBe('Test farm');
    expect(stored.destinationAddress).toBe('Operations destination');
    expect(stored.loadInstructions).toBe('Reserved dock');
    expect(stored.status).toBe('AWAITING_APPROVAL');
    const reloaded = (await get(`/batches/${lot.id}/workflow`).expect(200)).body;
    expect(reloaded.mission.id).toBe(planned.id);
    expect(reloaded.mission.batchId).toBe(lot.id);
    const growerList = (await get('/missions/my-missions').expect(200)).body;
    expect(growerList.some((m) => m.id === planned.id && m.batchId === lot.id)).toBe(true);
    await db.missions.update({ where: { id: planned.id }, data: { status: 'ASSIGNED', logisticsPartnerId: 'logistics' } });
    const logisticsList = (await get('/missions/my-missions?scope=logistics', 'logistics').expect(200)).body;
    expect(logisticsList.some((m) => m.id === planned.id && m.batchId === lot.id)).toBe(true);
  });

  it('concurrent harvest recovery and lot transport create one shared mission', async () => {
    const lot = (await post('/batches').send(batchBody()).expect(201)).body;
    const results = await Promise.all([post('/harvest-announcements/plan/retry-transport').send({}), post('/missions').send(missionBody(lot.id))]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(results[0].body.id).toBe(results[1].body.id);
    expect(await db.missions.count()).toBe(1);
    expect((await db.missions.findFirst()).batchId).toBe(lot.id);
  });

  it('lost response retry and public lot code do not create another mission for an unplanned lot', async () => {
    const lot = (await post('/batches').send(batchBody({ harvestAnnouncementId: undefined })).expect(201)).body;
    const first = (await post('/missions').send(missionBody(lot.id)).expect(201)).body;
    const retry = (await post('/missions').send(missionBody(lot.batchId)).expect(201)).body;
    expect(first.id).toBe(retry.id);
    expect(first.harvestAnnouncementId).toBeNull(); // Does not guess the existing plan on the same parcel.
    expect(await db.missions.count()).toBe(1);
  });

  it('does not steal the plan mission from another lot or accept a conflicting explicit plan', async () => {
    const first = (await post('/batches').send(batchBody()).expect(201)).body;
    const second = (await post('/batches').send(batchBody()).expect(201)).body;
    await post('/missions').send(missionBody(first.id)).expect(201);
    await post('/missions').send(missionBody(second.id)).expect(409);
    await post('/missions').send(missionBody(first.id, { harvestAnnouncementId: 'another' })).expect(400);
    expect(await db.missions.count()).toBe(1);
  });

  it('keeps the compliance gate and blocks other growers from retrying', async () => {
    const lot = (await post('/batches').send(batchBody()).expect(201)).body;
    await db.bio_vera_standards.update({ where: { id: 'standard' }, data: { requiresCompliancePhotos: true, requiredPhotoTypes: ['PUNNETS'] } });
    await post('/missions').send(missionBody(lot.id)).expect(400);
    await post('/missions', 'other').send(missionBody(lot.id)).expect(403);
    await post('/harvest-announcements/plan/retry-transport', 'other').send({}).expect(404);
    expect(await db.missions.count()).toBe(0);
  });

  it('persists the harvest even if transport fails, exposes that on reload, and recovers without a second plan', async () => {
    await db.harvest_announcements.delete({ where: { id: 'plan' } });
    await db.estates.update({ where: { id: 'farm' }, data: { polygonCoordinates: {} } });
    const plan = (await post('/harvest-announcements').send({ parcelId: 'plot', announcementType: 'HARVEST',
      cropType: 'Apple', estimatedDate: '2026-09-26', estimatedQuantity: 20 }).expect(201)).body;
    expect(plan.transportStatus).toBe('RETRY_REQUIRED');
    expect((await get('/harvest-announcements/my-announcements').expect(200)).body[0].transportStatus).toBe('RETRY_REQUIRED');
    await post(`/harvest-announcements/${plan.id}/retry-transport`).send({}).expect(400);
    await db.estates.update({ where: { id: 'farm' }, data: { polygonCoordinates: polygon } });
    const recovered = (await post(`/harvest-announcements/${plan.id}/retry-transport`).send({}).expect(201)).body;
    const again = (await post(`/harvest-announcements/${plan.id}/retry-transport`).send({}).expect(201)).body;
    expect(again.id).toBe(recovered.id);
    expect(await db.harvest_announcements.count()).toBe(1);
    const reloaded = (await get('/harvest-announcements/my-announcements').expect(200)).body[0];
    expect(reloaded.transportStatus).toBe('CREATED');
    expect(reloaded.mission.id).toBe(recovered.id);
  });

  it('does not attach a new lot to a closed mission', async () => {
    const mission = (await post('/harvest-announcements/plan/retry-transport').send({}).expect(201)).body;
    await db.missions.update({ where: { id: mission.id }, data: { status: 'COMPLETED' } });
    const lot = (await post('/batches').send(batchBody()).expect(201)).body;
    await post('/missions').send(missionBody(lot.id)).expect(409);
    expect((await db.missions.findUnique({ where: { id: mission.id } })).batchId).toBeNull();
  });
  it('initializes material balance once when two first-time requests both read an absent row', async () => {
    const original = db.farmer_material_balances.findUnique.bind(db.farmer_material_balances);
    let arrived = 0, release: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const spy = jest.spyOn(db.farmer_material_balances as any, 'findUnique').mockImplementation(async (args: any) => {
      const value = await original(args);
      if (++arrived === 2) release();
      await gate;
      return value;
    });
    try {
      const service = app.get(MaterialControlService);
      const [first, second] = await Promise.all([service.getFarmerMaterialBalance('farmer'), service.getFarmerMaterialBalance('farmer')]);
      expect(first.id).toBe(second.id);
      expect(await db.farmer_material_balances.count({ where: { userId: 'farmer' } })).toBe(1);
      await db.farmer_material_balances.update({ where: { userId: 'farmer' }, data: { crateBalance: 17 } });
      expect((await service.getFarmerMaterialBalance('farmer')).crateBalance).toBe(17);
    } finally { spy.mockRestore(); }
  });

});
