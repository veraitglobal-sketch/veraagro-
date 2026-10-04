/** Pure display selectors for public passport payloads — used by mobile UI and tests. */

import { passportEstimateSourceKey } from './estimate-source';

export interface PassportDisplaySnapshotInput {
  summary?: {
    productPhotoUrl?: string | null;
    productDescription?: string | null;
    actualPackDate?: string | null;
    storage?: {
      productStorageConditions?: string | null;
      declaredShelfLifeHours?: number | null;
      freshnessEstimate?: { source?: string; remainingHours?: number | null } | null;
    };
    identifiedPackaging?: { badgeSerial?: string } | null;
  };
  photos?: Array<{ url?: string | null }>;
  growthLogs?: Array<{ imageUrl?: string | null; notes?: string | null }>;
  treatments?: Array<{ dosage?: string | null }>;
  coldChainProof?: {
    minTemp?: number | null;
    maxTemp?: number | null;
    evaluationCriteria?: string | null;
    readingsWithinCriteria?: boolean | null;
  };
  timeline?: { arrived?: string | null };
  missions?: Array<{ deliveredAt?: string | null }>;
  protocol360?: { levels?: unknown[] };
  passportDocuments?: Array<{ id: string; title: string }>;
  packingRecords?: Array<{ declaredShelfLifeHours?: number | null }>;
}

export function buildPassportDisplaySnapshot(passport: PassportDisplaySnapshotInput) {
  const summary = passport.summary;
  return {
    productPhoto: summary?.productPhotoUrl ?? passport.photos?.[0]?.url ?? null,
    productDescription: summary?.productDescription ?? null,
    actualPackDate: summary?.actualPackDate ?? null,
    productStorage: summary?.storage?.productStorageConditions ?? null,
    declaredShelfLifeHours: summary?.storage?.declaredShelfLifeHours ?? null,
    growthPhotos: (passport.growthLogs ?? []).map((g) => g.imageUrl).filter(Boolean),
    growthNotes: (passport.growthLogs ?? []).map((g) => g.notes).filter(Boolean),
    treatmentDosages: (passport.treatments ?? []).map((t) => t.dosage).filter(Boolean),
    tempMin: passport.coldChainProof?.minTemp ?? null,
    tempMax: passport.coldChainProof?.maxTemp ?? null,
    tempCriteria: passport.coldChainProof?.evaluationCriteria ?? null,
    tempWithin: passport.coldChainProof?.readingsWithinCriteria ?? null,
    deliveryAt:
      passport.timeline?.arrived ?? passport.missions?.find((m) => m.deliveredAt)?.deliveredAt ?? null,
    protocol360Levels: (passport.protocol360?.levels ?? []).length,
    freshnessSourceKey: summary?.storage?.freshnessEstimate?.source
      ? passportEstimateSourceKey(summary.storage.freshnessEstimate.source)
      : null,
    identifiedPackaging: summary?.identifiedPackaging?.badgeSerial ?? null,
    documentCount: passport.passportDocuments?.length ?? 0,
    packingDeclaredHours: (passport.packingRecords ?? [])
      .map((p) => p.declaredShelfLifeHours)
      .filter((h) => h != null),
  };
}
