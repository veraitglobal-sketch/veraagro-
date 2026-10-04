import {
  buildFreshnessEstimate,
  buildLotPackagingFormats,
  buildPlatformStandard,
  coldChainPresentation,
  isLinkedFieldEntry,
  isLinkedGrowthLog,
  readingsWithinRange,
  resolvePlantingChain,
} from './passport-lot-scope';

describe('resolvePlantingChain', () => {
  it('keeps two plantings on the same parcel separate via announcement ids', () => {
    const chainA = resolvePlantingChain('harvest-a', {
      id: 'harvest-a',
      sourcePlantingId: 'planting-a',
      status: 'CONFIRMED',
    });
    const chainB = resolvePlantingChain('harvest-b', {
      id: 'harvest-b',
      sourcePlantingId: 'planting-b',
      status: 'CONFIRMED',
    });
    expect(chainA.announcementIds).toEqual(['planting-a', 'harvest-a']);
    expect(chainB.announcementIds).toEqual(['planting-b', 'harvest-b']);
    expect(isLinkedGrowthLog({ harvestAnnouncementId: 'planting-b' }, chainA)).toBe(false);
    expect(isLinkedGrowthLog({ harvestAnnouncementId: 'planting-a' }, chainA)).toBe(true);
  });

  it('drops cancelled harvest announcements from the chain', () => {
    const chain = resolvePlantingChain('harvest-x', {
      id: 'harvest-x',
      sourcePlantingId: 'planting-x',
      status: 'CANCELLED',
    });
    expect(chain.harvestId).toBeNull();
    expect(chain.plantingId).toBeNull();
    expect(chain.announcementIds).toEqual([]);
  });
});

describe('isLinkedGrowthLog', () => {
  const chain = resolvePlantingChain('harvest-1', {
    id: 'harvest-1',
    sourcePlantingId: 'planting-1',
    status: 'CONFIRMED',
  });

  it('excludes rejected and unlinked parcel logs', () => {
    expect(isLinkedGrowthLog({ harvestAnnouncementId: 'planting-1' }, chain)).toBe(true);
    expect(isLinkedGrowthLog({ harvestAnnouncementId: 'other-planting', moderationStatus: 'APPROVED' }, chain)).toBe(false);
    expect(isLinkedGrowthLog({ harvestAnnouncementId: 'planting-1', moderationStatus: 'REJECTED' }, chain)).toBe(false);
    expect(isLinkedGrowthLog({ harvestAnnouncementId: null }, chain)).toBe(false);
  });
});

describe('isLinkedFieldEntry', () => {
  const chain = resolvePlantingChain('harvest-1', {
    id: 'harvest-1',
    sourcePlantingId: 'planting-1',
    status: 'CONFIRMED',
  });

  it('requires plantingId on the entry — no parcel-only guessing', () => {
    expect(isLinkedFieldEntry({ plantingId: 'planting-1' }, chain)).toBe(true);
    expect(isLinkedFieldEntry({ plantingId: 'planting-2' }, chain)).toBe(false);
    expect(isLinkedFieldEntry({ plantingId: null }, chain)).toBe(false);
  });
});

describe('buildLotPackagingFormats', () => {
  it('returns distinct pack formats for the lot without summing order quantities', () => {
    const formats = buildLotPackagingFormats([
      { packLabel: '500 g', packSizeKg: 0.5 },
      { packLabel: '500 g', packSizeKg: 0.5 },
      { packLabel: '5 kg', packSizeKg: 5 },
    ]);
    expect(formats).toHaveLength(2);
    expect(formats.every((f) => f.scope === 'lot_orders')).toBe(true);
  });
});

describe('buildFreshnessEstimate', () => {
  it('marks tracker values as estimates with source — not declared shelf life', () => {
    const est = buildFreshnessEstimate({
      remainingShelfLifeHours: 48,
      expiresAt: new Date('2026-08-07'),
      shelfLifeHours: 72,
    });
    expect(est?.source).toBe('freshness_trackers');
    expect(est?.remainingHours).toBe(48);
  });
});

describe('readingsWithinRange', () => {
  it('uses the provided platform standard bounds', () => {
    expect(readingsWithinRange([3, 4], 2, 8)).toBe(true);
    expect(readingsWithinRange([9], 2, 8)).toBe(false);
    expect(readingsWithinRange([], 2, 8)).toBeNull();
  });
});

describe('coldChainPresentation', () => {
  const standard = buildPlatformStandard(2, 8);

  it('does not claim verification or continuous control without readings', () => {
    expect(coldChainPresentation(0, true, standard)).toEqual({
      hasReadings: false,
      continuousControlConfirmed: false,
      readingsWithinCriteria: null,
      readingsCount: 0,
      evaluationCriteria: '2–8 °C (bio_vera_standards)',
      platformStandard: standard,
    });
  });

  it('reports criteria check only for existing readings and never confirms continuous control', () => {
    expect(coldChainPresentation(3, false, standard)).toMatchObject({
      hasReadings: true,
      continuousControlConfirmed: false,
      readingsWithinCriteria: false,
      readingsCount: 3,
    });
  });
});
