import { describe, it, expect } from 'vitest';
import { PassportRequestGuard } from '../../shared/passport/stale-fetch-guard.ts';

async function simulatePassportLoad(guard, batchId, delayMs, onSuccess) {
  const seq = guard.begin();
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (!guard.isLatest(seq)) return;
  onSuccess(batchId);
}

describe('PassportRequestGuard (production helper used by web passport page)', () => {
  it('keeps B when A resolves later', async () => {
    const guard = new PassportRequestGuard();
    let displayed = null;
    const pA = simulatePassportLoad(guard, 'A', 30, (id) => {
      displayed = id;
    });
    const pB = simulatePassportLoad(guard, 'B', 5, (id) => {
      displayed = id;
    });
    await pB;
    expect(displayed).toBe('B');
    await pA;
    expect(displayed).toBe('B');
  });

  it('ignores late error path after invalidate', async () => {
    const guard = new PassportRequestGuard();
    let displayed = null;
    const seq = guard.begin();
    guard.invalidate();
    await new Promise((r) => setTimeout(r, 10));
    if (guard.isLatest(seq)) displayed = 'A';
    expect(displayed).toBeNull();
  });
});
