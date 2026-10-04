import { PassportReportsService } from './passport-reports.service';

describe('PassportReportsService.createPublicReport', () => {
  function svc(batch: { id: string; batchId: string } | null) {
    const prisma = {
      batches: { findFirst: jest.fn(async () => batch) },
      package_badges: { findUnique: jest.fn(async () => ({ batchId: batch?.id, lifecycle: 'ACTIVE' })) },
      passport_reports: {
        findFirst: jest.fn(async () => null),
        create: jest.fn(async ({ data }: { data: { reportNumber: string } }) => ({
          reportNumber: data.reportNumber,
          status: 'NEW',
        })),
      },
    };
    const documents = { storeDataUrl: jest.fn(async () => 'doc-1') };
    return { service: new PassportReportsService(prisma as any, documents as any), prisma };
  }

  it('returns report number for valid batch', async () => {
    const { service } = svc({ id: 'int', batchId: 'BATCH-2026-0001' });
    const result = await service.createPublicReport('BATCH-2026-0001', 'LBL-1', {
      description: 'Damaged pack',
    });
    expect(result.reportNumber).toMatch(/^PR-/);
    expect(result.duplicate).toBe(false);
  });

  it('deduplicates by idempotency key', async () => {
    const prisma = {
      batches: { findFirst: jest.fn(async () => ({ id: 'int', batchId: 'BATCH-2026-0001' })) },
      passport_reports: {
        findFirst: jest.fn(async () => ({ reportNumber: 'PR-2026-111111', status: 'NEW' })),
        create: jest.fn(),
      },
    };
    const service = new PassportReportsService(prisma as any, { storeDataUrl: jest.fn() } as any);
    const result = await service.createPublicReport('BATCH-2026-0001', undefined, {
      description: 'x',
      idempotencyKey: 'same-key',
    });
    expect(result.reportNumber).toBe('PR-2026-111111');
    expect(result.duplicate).toBe(true);
    expect(prisma.passport_reports.create).not.toHaveBeenCalled();
  });
});
