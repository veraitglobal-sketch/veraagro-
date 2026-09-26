import { NotFoundException } from '@nestjs/common';
import { BatchesService } from './batches.service';

// Service contract tests: no network, photo storage or real database writes.
describe('producer packing workflow', () => {
  const batch = { id: 'internal-lot', batchId: 'BATCH-2026-0002', status: 'PACKED',
    harvestedByUserId: 'producer', productName: 'Apple', quantity: 20, unit: 'kg', order_items: [] };
  let records: any[];
  let prisma: any;
  let service: BatchesService;
  beforeEach(() => {
    records = [];
    prisma = {
      batches: { findFirst: jest.fn(async ({ where }) => {
        const matches = where.OR.some((r: any) => r.id === batch.id || r.batchId === batch.batchId);
        return matches && (!where.harvestedByUserId || where.harvestedByUserId === 'producer') ? batch : null;
      }) },
      missions: { findFirst: jest.fn().mockResolvedValue(null) },
      audit_trails: {
        create: jest.fn(async ({ data }) => { records.push(data); return data; }),
        findFirst: jest.fn(async ({ where }) => records.filter((r) => r.batchId === where.batchId &&
          r.eventType === where.eventType && r.newValue.source === where.newValue.equals)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] ?? null),
      },
    };
    service = new BatchesService(prisma, {} as any, {} as any, {} as any);
  });

  it('returns an explicit absent packing record before anything is saved', async () => {
    const result = await service.getBatchTraceability(batch.batchId);
    expect(result.batch.id).toBe(batch.id);
    expect(result.traceability.packing).toBeNull();
  });

  it('saves using the public code and reads the same persisted record with either reference', async () => {
    const timestamp = '2026-09-26T10:00:00.000Z';
    await expect(service.recordPackingFlowCheck('producer', batch.batchId, {
      latitude: 44, longitude: 20, completedAt: timestamp,
    })).resolves.toMatchObject({ success: true, id: batch.id, batchId: batch.batchId });
    for (const reference of [batch.id, batch.batchId]) {
      const result = await service.getBatchTraceability(reference);
      expect(result.batch.id).toBe(batch.id);
      expect(result.traceability.packing).toEqual({ completedAt: new Date(timestamp) });
      expect(result.traceability.packing).not.toHaveProperty('gps');
    }
    expect(prisma.audit_trails.findFirst).toHaveBeenCalledWith({
      where: { batchId: batch.id, eventType: 'QUALITY_CHECK',
        newValue: { path: ['source'], equals: 'mobile_packing_flow' } },
      orderBy: { timestamp: 'desc' }, select: { timestamp: true },
    });
  });

  it('shows the latest packing record and ignores unrelated quality checks', async () => {
    for (const completedAt of ['2026-09-26T09:00:00Z', '2026-09-26T11:00:00Z']) {
      await service.recordPackingFlowCheck('producer', batch.id, { latitude: 44, longitude: 20, completedAt });
    }
    records.push({ batchId: batch.id, eventType: 'QUALITY_CHECK',
      newValue: { source: 'other' }, timestamp: new Date('2026-09-26T12:00:00Z') });
    expect((await service.getBatchTraceability(batch.id)).traceability.packing)
      .toEqual({ completedAt: new Date('2026-09-26T11:00:00Z') });
  });

  it('does not write a packing record for another producer or an unknown lot', async () => {
    for (const [user, reference] of [['other-producer', batch.id], ['producer', 'unknown']]) {
      await expect(service.recordPackingFlowCheck(user, reference, { latitude: 44, longitude: 20 }))
        .rejects.toBeInstanceOf(NotFoundException);
    }
    expect(prisma.audit_trails.create).not.toHaveBeenCalled();
  });
});
