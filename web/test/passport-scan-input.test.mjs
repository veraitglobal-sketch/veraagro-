import { describe, it, expect } from 'vitest';
import { parsePassportScanInput } from '../../shared/passport/scan-input.ts';

describe('parsePassportScanInput (production)', () => {
  it('parses legacy generateBatchQR /verify/BATCH URL', () => {
    expect(parsePassportScanInput('http://localhost:3001/verify/BATCH-2026-0001')).toEqual({
      kind: 'passport',
      batchId: 'BATCH-2026-0001',
      badgeSerial: null,
    });
  });

  it('does not treat seed verify as batch passport', () => {
    const parsed = parsePassportScanInput('https://www.biovera.app/verify/seed/SB-2026-001');
    expect(parsed?.kind).not.toBe('passport');
  });
});
