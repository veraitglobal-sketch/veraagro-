import { NotFoundException } from '@nestjs/common';
import { QrService } from './qr.service';
import { inflateSync } from 'zlib';

describe('QrService.getCertificateData', () => {
  const plantingA = {
    id: 'planting-a',
    sourcePlantingId: null,
    status: 'CONFIRMED',
    announcementType: 'PLANTING',
    cropType: 'Raspberry',
    estimatedDate: new Date('2026-05-01'),
    actualDate: null,
    notes: null,
  };
  const harvestA = {
    id: 'harvest-a',
    sourcePlantingId: 'planting-a',
    status: 'CONFIRMED',
    announcementType: 'HARVEST',
    cropType: 'Raspberry',
    estimatedDate: new Date('2026-08-01'),
    actualDate: new Date('2026-08-05'),
    actualQuantity: 100,
    estimatedQuantity: 120,
    notes: null,
    sortingSpec: null,
  };
  const harvestB = {
    ...harvestA,
    id: 'harvest-b',
    sourcePlantingId: 'planting-b',
  };

  function baseBatch(overrides: Record<string, unknown> = {}) {
    return {
      id: 'batch-internal',
      batchId: 'BATCH-2026-0001',
      estateId: 'estate-1',
      parcelId: 'parcel-1',
      harvestAnnouncementId: 'harvest-a',
      productName: 'Raspberry',
      quantity: 120,
      unit: 'kg',
      harvestDate: new Date('2026-08-05'),
      status: 'PACKED',
      estates: {
        name: 'Farm A',
        calculatedArea: 10,
        polygonCoordinates: [],
        users: { firstName: 'Marko', productionCountry: 'Serbia', farmerBio: null, farmerPhoto: null },
      },
      parcels: { cropType: 'Raspberry', calculatedArea: 2, polygonCoordinates: [] },
      compliance_photos: [],
      freshness_trackers: {
        shelfLifeHours: 72,
        remainingShelfLifeHours: 48,
        expiresAt: new Date('2026-08-07'),
        timestampHarvested: new Date('2026-08-05'),
        isExpired: false,
      },
      quality_entries: null,
      temperature_logs: [{ timestamp: new Date(), temperature: 4, humidity: null, location: 'farm', missionId: null }],
      missions: [],
      package_badges: [],
      ...overrides,
    };
  }

  function prismaMock(batch: ReturnType<typeof baseBatch>) {
    const growthByPlanting: Record<string, unknown[]> = {
      'planting-a': [
        {
          id: 'g-a',
          harvestAnnouncementId: 'planting-a',
          moderationStatus: 'APPROVED',
          networkTimestamp: new Date('2026-06-01'),
          deviceTimestamp: new Date('2026-06-01'),
          imageUrl: 'https://example/a.jpg',
          growthStage: 'flowering',
          notes: 'Field diary',
          labTestDate: null,
          labResultUrl: null,
          gpsLatitude: 44,
          gpsLongitude: 20,
          gpsAccuracy: 5,
          materialBarcode: null,
          materialKind: null,
        },
      ],
      'planting-b': [
        {
          id: 'g-b',
          harvestAnnouncementId: 'planting-b',
          moderationStatus: 'APPROVED',
          networkTimestamp: new Date('2026-06-02'),
          deviceTimestamp: new Date('2026-06-02'),
          imageUrl: 'https://example/b.jpg',
          growthStage: 'other',
          notes: null,
          labTestDate: null,
          labResultUrl: null,
          gpsLatitude: 44,
          gpsLongitude: 20,
          gpsAccuracy: 5,
          materialBarcode: null,
          materialKind: null,
        },
      ],
    };

    return {
      batches: {
        findFirst: jest.fn(async () => batch),
        findMany: jest.fn(async () => []),
      },
      harvest_announcements: {
        findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'harvest-a') return harvestA;
          if (where.id === 'harvest-b') return harvestB;
          if (where.id === 'planting-a') return plantingA;
          if (where.id === 'planting-b') return { ...plantingA, id: 'planting-b' };
          return null;
        }),
      },
      growth_logs: {
        findMany: jest.fn(async ({ where }: { where: { harvestAnnouncementId: { in: string[] } } }) => {
          const ids = where.harvestAnnouncementId.in;
          return ids.flatMap((id) => growthByPlanting[id] ?? []);
        }),
      },
      field_entries: { findMany: jest.fn(async () => []) },
      compliance_logs: { findMany: jest.fn(async () => []) },
      seeds: { findMany: jest.fn(async () => []) },
      orders: {
        findMany: jest.fn(async () => [
          { packLabel: '500 g punnet', packSizeKg: 0.5, packedPackCount: 10, packedKg: 5, packedAt: new Date() },
          { packLabel: '5 kg crate', packSizeKg: 5, packedPackCount: 2, packedKg: 10, packedAt: new Date() },
        ]),
      },
      catalog_products: { findFirst: jest.fn(async () => null) },
      bio_vera_standards: {
        findFirst: jest.fn(async () => ({
          requiredTemperatureMin: 2,
          requiredTemperatureMax: 8,
        })),
      },
      package_badges: {
        findUnique: jest.fn(async ({ where }: { where: { serial: string } }) =>
          where.serial === 'LBL-001'
            ? { serial: 'LBL-001', type: 'LABEL', batchId: batch.id, lifecycle: 'ACTIVE' }
            : null,
        ),
      },
      audit_trails: { findFirst: jest.fn(async (_args?: any) => null) },
    };
  }

  function serviceWith(batch: ReturnType<typeof baseBatch>) {
    const prisma = prismaMock(batch);
    const qualityControlLevelsService = {
      getProtocol360Status: jest.fn(async () => ({ overallStatus: 'OK', levels: [], brandingSlogan: '' })),
    };
    const passportDocumentsService = {
      listPublicForCatalogProduct: jest.fn(async () => []),
      listPublicForBatch: jest.fn(async () => []),
      documentPublicUrl: (id: string) => `/documents/${id}`,
    };
    return {
      svc: new QrService(prisma as any, qualityControlLevelsService as any, passportDocumentsService as any),
      prisma,
    };
  }

  it('scopes growth logs to the lot planting chain — not the other planting on the same parcel', async () => {
    const { svc } = serviceWith(baseBatch());
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.growthLogs).toHaveLength(1);
    expect((data.growthLogs as { imageUrl: string }[])[0].imageUrl).toBe('https://example/a.jpg');
    expect(data.growthLogs?.some((g: { notes?: string }) => g.notes === 'Field diary')).toBe(true);
  });

  it('lists distinct lot packaging formats without treating order packing as this physical pack', async () => {
    const { svc } = serviceWith(baseBatch());
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.lotPackagingFormats).toHaveLength(2);
    expect(data.summary?.identifiedPackaging).toBeNull();
    expect(data.summary?.lot.totalQuantity).toBe(120);
    expect(data.lotPackagingFormats?.map((p) => p.packSizeKg)).toEqual([0.5, 5]);
  });

  it('uses captured product data instead of a later catalogue edit', async () => {
    const { svc } = serviceWith(baseBatch({ passportProductSnapshot: {
      name: 'Original product', variety: 'Original variety', description: 'Original description',
      storageConditions: 'Original storage', imageUrl: null,
    } }));
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.summary).toMatchObject({ productName: 'Original product', variety: 'Original variety',
      productDescription: 'Original description', storage: { productStorageConditions: 'Original storage' } });
  });

  it('does not apply one order declaration to every package in the lot', async () => {
    const { svc, prisma } = serviceWith(baseBatch());
    prisma.orders.findMany.mockResolvedValue([
      {packLabel:'Small',packSizeKg:0.5,packedAt:new Date(),declaredShelfLifeHours:24,declaredExpiresAt:new Date('2026-08-06')},
      {packLabel:'Large',packSizeKg:5,packedAt:new Date(),declaredShelfLifeHours:72,declaredExpiresAt:new Date('2026-08-08')},
    ] as any);
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.summary.storage.declaredShelfLifeHours).toBeNull();
    expect(data.summary.storage.declaredExpiresAt).toBeNull();
    expect(data.packingRecords.map(row => row.declaredShelfLifeHours)).toEqual([24,72]);
  });

  it('identifies packaging only when badge serial matches the lot', async () => {
    const { svc } = serviceWith(baseBatch());
    const withBadge = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001', { packageBadgeSerial: 'LBL-001' });
    expect(withBadge.summary?.identifiedPackaging).toMatchObject({ badgeSerial: 'LBL-001', linkage: 'confirmed' });
    const wrongBadge = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001', { packageBadgeSerial: 'OTHER' });
    expect(wrongBadge.summary?.identifiedPackaging).toBeNull();
  });

  it('rejects inactive badge and badge from another lot', async () => {
    const { svc, prisma } = serviceWith(baseBatch());
    (prisma.package_badges.findUnique as jest.Mock).mockImplementation(
      async ({ where }: { where: { serial: string } }) => {
        if (where.serial === 'LBL-INACTIVE') {
          return { serial: 'LBL-INACTIVE', type: 'LABEL', batchId: 'batch-internal', lifecycle: 'RETURNED_TO_SUPPLIER' };
        }
        if (where.serial === 'LBL-OTHER-LOT') {
          return { serial: 'LBL-OTHER-LOT', type: 'LABEL', batchId: 'other-batch', lifecycle: 'ACTIVE' };
        }
        if (where.serial === 'LBL-001') {
          return { serial: 'LBL-001', type: 'LABEL', batchId: 'batch-internal', lifecycle: 'ACTIVE' };
        }
        return null;
      },
    );
    const inactive = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001', { packageBadgeSerial: 'LBL-INACTIVE' });
    expect(inactive.summary?.identifiedPackaging).toBeNull();
    const otherLot = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001', { packageBadgeSerial: 'LBL-OTHER-LOT' });
    expect(otherLot.summary?.identifiedPackaging).toBeNull();
  });

  it('lists all distinct lot packaging formats beyond the first five orders', async () => {
    const sixFormats = Array.from({ length: 6 }, (_, i) => ({
      packLabel: `Format ${i + 1}`,
      packSizeKg: 0.25 * (i + 1),
      packedPackCount: 1,
      packedKg: 0.25 * (i + 1),
      packedAt: new Date(),
    }));
    const { svc, prisma } = serviceWith(baseBatch());
    (prisma.orders.findMany as jest.Mock).mockResolvedValue(sixFormats);
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.lotPackagingFormats).toHaveLength(6);
    expect(data.lotPackagingFormats?.map((p) => p.label)).toEqual(
      sixFormats.map((o) => o.packLabel),
    );
  });

  it('forwards badge to PDF generation path via getCertificateData options', async () => {
    const { svc, prisma } = serviceWith(baseBatch());
    const pdfData = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001', { packageBadgeSerial: 'LBL-001' });
    expect(pdfData.summary?.identifiedPackaging?.badgeSerial).toBe('LBL-001');
    expect(prisma.package_badges.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { serial: 'LBL-001' } }),
    );
  });

  it('exposes freshness as system estimate — declared shelf life stays null', async () => {
    const { svc } = serviceWith(baseBatch());
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.summary?.storage.declaredShelfLifeHours).toBeNull();
    expect(data.summary?.storage.declaredExpiresAt).toBeNull();
    expect(data.summary?.storage.freshnessEstimate?.source).toBe('freshness_trackers');
    expect(data.summary?.storage.freshnessEstimate?.remainingHours).toBe(48);
    expect(data.freshness?.estimate?.modelShelfLifeHours).toBe(72);
  });

  it('evaluates temperature against platform standard — not a hardcoded range', async () => {
    const { svc, prisma } = serviceWith(
      baseBatch({
        temperature_logs: [
          { timestamp: new Date(), temperature: 9, humidity: null, location: 'truck', missionId: 'm1' },
        ],
        missions: [{ id: 'm1', missionNumber: 'M-1', location_logs: [], border_wait_times: [], pickedUpAt: null, completedAt: null }],
      }),
    );
    (prisma.bio_vera_standards.findFirst as jest.Mock).mockResolvedValue({
      requiredTemperatureMin: 0,
      requiredTemperatureMax: 6,
    });
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.coldChainProof?.evaluationCriteria).toContain('bio_vera_standards');
    expect(data.coldChainProof?.readingsWithinCriteria).toBe(false);
    expect(data.coldChainProof?.continuousControlConfirmed).toBe(false);
  });

  it('surfaces compromised lot and recalled seed warnings', async () => {
    const { svc } = serviceWith(baseBatch({ id: 'batch-internal' }));
    (svc as any).checkBatchCompromised = jest.fn(async () => true);
    const prisma = prismaMock(baseBatch());
    (prisma.seeds.findMany as jest.Mock).mockResolvedValue([
      {
        plantingId: 'planting-a',
        productionRunId: 'run-1',
        plantedAt: new Date(),
        status: 'RECALLED',
        productionRun: {
          status: 'RECALLED',
          lotNumber: 'LOT-1',
          seedCropYear: 2026,
          productionDate: new Date(),
          germinationPct: 95,
          purityPct: 99,
          certificateUrls: [],
          approvedProduct: { name: 'Seed', variety: 'Willamette' },
          producer: { name: 'Bio Vera', city: 'Novi Sad', country: 'RS' },
        },
      },
    ]);
    const qualityControlLevelsService = {
      getProtocol360Status: jest.fn(async () => ({ overallStatus: 'OK', levels: [], brandingSlogan: '' })),
    };
    const passportDocumentsService = {
      listPublicForCatalogProduct: jest.fn(async () => []),
      listPublicForBatch: jest.fn(async () => []),
      documentPublicUrl: (id: string) => `/documents/${id}`,
    };
    const compromisedSvc = new QrService(
      prisma as any,
      qualityControlLevelsService as any,
      passportDocumentsService as any,
    );
    (compromisedSvc as any).checkBatchCompromised = jest.fn(async () => true);
    const data = await compromisedSvc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.warnings?.map((w) => w.code)).toEqual(expect.arrayContaining(['TEMPERATURE_DEVIATION', 'SEED_RECALLED']));
    expect(data.batch.isCompromised).toBe(true);
    expect(data.seedOrigin?.[0]?.recalled).toBe(true);
  });

  it('includes history beyond 20 events in the generated PDF', async () => {
    const { svc } = serviceWith(baseBatch());
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    data.productionHistory = Array.from({ length: 25 }, (_, i) => ({
      id: `weather-${i}`, kind: 'weather', source: 'fieldDiary',
      date: '2026-03-20T01:00:00Z', endDate: '2026-03-20T05:00:00Z',
      facts: [{ label: 'notes', value: i === 24 ? 'ZZZ999999' : `Observation ${i}` }],
    }));
    jest.spyOn(svc, 'getCertificateData').mockResolvedValue(data);
    const pdf = await svc.generatePassportPDF('BATCH-2026-0001');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    // Inspect actual PDF content streams, including pages after the first 20 events.
    const raw = pdf.toString('latin1');
    const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map(match => {
      try { return inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1'); }
      catch { return ''; }
    }).join('\n');
    expect(streams).toContain(Buffer.from('ZZZ999999').toString('hex'));
  });

  it('keeps a provisional supplier separate from confirmed seed origin and quality', async () => {
    const { svc, prisma } = serviceWith(baseBatch());
    prisma.audit_trails.findFirst.mockImplementation(async (args: any) => args.where.entityType === 'PassportOriginCandidate' ? {
      timestamp: new Date('2026-10-04T12:00:00Z'),
      newValue: { supplierName: 'Institut za voćarstvo Čačak', status: 'PENDING_DOCUMENTATION', verified: false },
    } as any : null);
    const data = await svc.getCertificateData('BIO-VERA-BATCH-2026-0001');
    expect(data.originCandidate).toMatchObject({ supplierName: 'Institut za voćarstvo Čačak', verified: false, status: 'PENDING_DOCUMENTATION' });
    expect(data.seedOrigin).toEqual([]);
    expect(data.historyGaps).toContain('seed');
    expect(data.timeline.verified).toBeNull();
    expect(prisma.audit_trails.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { entityType: 'PassportOriginCandidate', entityId: 'batch-internal', batchId: 'batch-internal', eventType: 'STATUS_CHANGE' },
    }));
  });

  it('throws when batch is missing', async () => {
    const prisma = prismaMock(baseBatch());
    (prisma.batches.findFirst as jest.Mock).mockResolvedValue(null);
    const passportDocumentsService = {
      listPublicForCatalogProduct: jest.fn(async () => []),
      listPublicForBatch: jest.fn(async () => []),
      documentPublicUrl: (id: string) => `/documents/${id}`,
    };
    const svc = new QrService(
      prisma as any,
      { getProtocol360Status: jest.fn() } as any,
      passportDocumentsService as any,
    );
    await expect(svc.getCertificateData('BIO-VERA-MISSING')).rejects.toBeInstanceOf(NotFoundException);
  });
});
