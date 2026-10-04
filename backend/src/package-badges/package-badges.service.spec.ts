import { ConfigService } from '@nestjs/config';
import { PackageBadgesService } from './package-badges.service';

describe('PackageBadgesService.publicResolve', () => {
  function serviceWith(row: {
    serial: string;
    batchId: string | null;
    farmerQrCode?: string | null;
    type?: string;
  }) {
    const prisma = {
      package_badges: {
        findUnique: jest.fn(async () =>
          row
            ? {
                serial: row.serial,
                type: row.type ?? 'LABEL',
                batchId: row.batchId,
                farmerQrCode: row.farmerQrCode ?? 'FARM-QR',
              }
            : null,
        ),
      },
      batches: {
        findUnique: jest.fn(async () =>
          row.batchId ? { batchId: 'BATCH-2026-0099' } : null,
        ),
      },
    };
    const config = { get: jest.fn(() => 'https://www.biovera.app') } as unknown as ConfigService;
    return new PackageBadgesService(prisma as any, config);
  }

  it('includes badge serial in passportUrl when batch is linked', async () => {
    const svc = serviceWith({ serial: 'PLT-ABC-001', batchId: 'batch-internal' });
    const result = await svc.publicResolve('PLT-ABC-001');
    expect(result?.passportUrl).toBe(
      'https://www.biovera.app/passport/BATCH-2026-0099?badge=PLT-ABC-001',
    );
    expect(result?.publicBatchId).toBe('BATCH-2026-0099');
  });

  it('returns null passportUrl when badge has no batch', async () => {
    const svc = serviceWith({ serial: 'PLT-ORPHAN', batchId: null });
    const result = await svc.publicResolve('PLT-ORPHAN');
    expect(result?.passportUrl).toBeNull();
    expect(result?.publicBatchId).toBeNull();
  });
});
