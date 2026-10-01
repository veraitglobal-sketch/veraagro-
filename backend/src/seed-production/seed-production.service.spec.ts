import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SeedProductionService } from './seed-production.service';
import { buildSeedSerial } from './seed-serial';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

describe('SeedProductionService', () => {
  let service: SeedProductionService;
  const prisma = {
    seed_production_runs: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    seeds: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    users: { findMany: jest.fn().mockResolvedValue([]) },
    parcels: { findMany: jest.fn().mockResolvedValue([]) },
    seed_custody_events: { create: jest.fn(), groupBy: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<void>) => fn(prisma)),
    audit_trails: { create: jest.fn() },
  };
  const notifications = { create: jest.fn() };
  const email = { sendFarmerWelcomeEmail: jest.fn(), sendProducerPortalInviteEmail: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.SEED_LABEL_SECRET = 'unit-test-secret';
    const module = await Test.createTestingModule({
      providers: [
        SeedProductionService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = module.get(SeedProductionService);
  });

  it('confirmProduction voids bags above bagsProduced', async () => {
    prisma.seed_production_runs.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'LABELS_ISSUED',
      bagsPlanned: 5,
    });
    prisma.seeds.findMany
      .mockResolvedValueOnce([{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }, { id: 'b4' }])
      .mockResolvedValueOnce([{ id: 'b5' }]);
    prisma.seed_production_runs.update.mockResolvedValue({});
    prisma.seeds.update.mockResolvedValue({});
    prisma.seed_custody_events.create.mockResolvedValue({});
    prisma.audit_trails.create.mockResolvedValue({});

    jest.spyOn(service, 'getRun').mockResolvedValue({ id: 'run1' } as never);

    await service.confirmProduction(
      'run1',
      { bagsProduced: 4, productionDate: '2026-03-02T00:00:00.000Z' },
      'admin',
    );

    expect(prisma.seeds.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b5' }, data: { status: 'VOIDED' } }),
    );
    expect(prisma.seed_production_runs.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PRODUCED', bagsProduced: 4 }) }),
    );
  });

  it('rejects confirmProduction when not LABELS_ISSUED', async () => {
    prisma.seed_production_runs.findUnique.mockResolvedValue({ id: 'run1', status: 'PLANNED', bagsPlanned: 5 });
    await expect(
      service.confirmProduction('run1', { bagsProduced: 3, productionDate: '2026-03-02' }, 'admin'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('publicVerify rejects VOIDED bags', async () => {
    const serial = buildSeedSerial(2026, 'NS2604', 1);
    prisma.seeds.findUnique.mockResolvedValue({
      status: 'VOIDED',
      productionRun: {
        status: 'RELEASED',
        approvedProduct: { name: 'Test', variety: null, instructions: null },
        producer: { name: 'P', city: 'C', country: 'RS' },
        lotNumber: 'L1',
        seedCropYear: 2026,
        bagSizeLabel: '5 kg',
        productionDate: null,
        germinationPct: null,
        purityPct: null,
        certificateUrls: [],
      },
    });
    const voided = await service.publicVerify(serial);
    expect(voided).toEqual({ genuine: false, reason: 'NOT_ISSUED_FOR_SALE' });
  });

  it('recall skips VOIDED bags', async () => {
    prisma.seed_production_runs.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'RELEASED',
      lotNumber: 'NS2604',
    });
    prisma.seeds.findMany
      .mockResolvedValueOnce([{ id: 'b1', status: 'AVAILABLE', assignedToUserId: 'f1', soldToGrowerId: null }])
      .mockResolvedValueOnce([]);
    prisma.seeds.update.mockResolvedValue({});
    prisma.seed_custody_events.create.mockResolvedValue({});
    prisma.seed_production_runs.update.mockResolvedValue({});
    prisma.audit_trails.create.mockResolvedValue({});
    jest.spyOn(service, 'getRun').mockResolvedValue({ id: 'run1' } as never);

    await service.recallRun('run1', 'Test', 'admin');
    expect(prisma.seeds.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['AVAILABLE', 'ASSIGNED', 'IN_SUPPLIER_STOCK', 'SOLD', 'LABELED'] },
        }),
      }),
    );
  });

  it('getReportsSummary aggregates funnel columns from runs and bags', async () => {
    prisma.seed_production_runs.findMany.mockResolvedValue([
      {
        id: 'run-a',
        approvedProductId: 'prod1',
        seedCropYear: 2026,
        bagsProduced: 22,
        approvedProduct: { name: 'Raspberry seed', variety: 'Willamette' },
        producer: { name: 'NS Seme' },
      },
      {
        id: 'run-b',
        approvedProductId: 'prod1',
        seedCropYear: 2026,
        bagsProduced: 8,
        approvedProduct: { name: 'Raspberry seed', variety: 'Willamette' },
        producer: { name: 'NS Seme' },
      },
    ]);
    prisma.seeds.groupBy
      .mockResolvedValueOnce([
        { status: 'AVAILABLE', _count: 5 },
        { status: 'VOIDED', _count: 2 },
        { status: 'SOLD', _count: 3 },
        { status: 'PLANTED', _count: 4 },
      ])
      .mockResolvedValueOnce([
        { status: 'AVAILABLE', _count: 1 },
        { status: 'ASSIGNED', _count: 2 },
        { status: 'IN_SUPPLIER_STOCK', _count: 1 },
      ]);
    prisma.seeds.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1);
    prisma.seed_custody_events.groupBy
      .mockResolvedValueOnce([{ seedId: 's1' }, { seedId: 's2' }, { seedId: 's3' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ seedId: 'a1' }, { seedId: 'a2' }]);
    prisma.seeds.findMany.mockResolvedValue([]);
    prisma.users.findMany.mockResolvedValue([]);

    const summary = await service.getReportsSummary({ year: 2026 });
    expect(summary.byProductYear).toHaveLength(1);
    const row = summary.byProductYear[0];
    expect(row.produced).toBe(30);
    expect(row.labeled).toBe(18);
    expect(row.voided).toBe(2);
    expect(row.atProducer).toBe(6);
    expect(row.shipped).toBe(5);
    expect(row.sold).toBe(3);
    expect(row.assignedAdmin).toBe(2);
    expect(row.planted).toBe(4);
  });

  it('getReportsSummary sold is cumulative (ever SOLD_TO_GROWER, not current status)', async () => {
    prisma.seed_production_runs.findMany.mockResolvedValue([
      {
        id: 'run-sold',
        approvedProductId: 'prod1',
        seedCropYear: 2026,
        bagsProduced: 2,
        approvedProduct: { name: 'Raspberry seed', variety: 'Willamette' },
        producer: { name: 'NS Seme' },
      },
    ]);
    prisma.seeds.groupBy.mockResolvedValue([
      { status: 'PLANTED', _count: 1 },
      { status: 'SOLD', _count: 1 },
    ]);
    prisma.seeds.count.mockResolvedValue(0);
    prisma.seed_custody_events.groupBy
      .mockResolvedValueOnce([{ seedId: 'bag1' }, { seedId: 'bag2' }])
      .mockResolvedValueOnce([]);
    prisma.seeds.findMany.mockResolvedValue([]);
    prisma.users.findMany.mockResolvedValue([]);

    const summary = await service.getReportsSummary({ year: 2026 });
    expect(summary.byProductYear[0].sold).toBe(2);
    expect(summary.byProductYear[0].planted).toBe(1);
  });

  it('recall notifies growers and marks bags', async () => {
    prisma.seed_production_runs.findUnique.mockResolvedValue({
      id: 'run1',
      status: 'RELEASED',
      lotNumber: 'NS2604',
    });
    prisma.seeds.findMany
      .mockResolvedValueOnce([
        { id: 'b1', assignedToUserId: 'farmer1', soldToGrowerId: null, parcels: [] },
        { id: 'b2', assignedToUserId: 'farmer2', soldToGrowerId: null, parcels: [] },
      ])
      .mockResolvedValueOnce([{ plantedParcelId: 'p1', serialNumber: 'BV-26-NS2604-000001-AAAA' }]);
    prisma.seeds.update.mockResolvedValue({});
    prisma.seed_custody_events.create.mockResolvedValue({});
    prisma.seed_production_runs.update.mockResolvedValue({});
    prisma.audit_trails.create.mockResolvedValue({});
    jest.spyOn(service, 'getRun').mockResolvedValue({ id: 'run1' } as never);

    const result = await service.recallRun('run1', 'Quality issue', 'admin');
    expect(notifications.create).toHaveBeenCalledTimes(2);
    expect(result.affectedGrowers).toEqual(expect.arrayContaining(['farmer1', 'farmer2']));
  });
});
