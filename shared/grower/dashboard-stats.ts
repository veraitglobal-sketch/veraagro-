/** Shared grower dashboard counters — keep web + mobile in sync. */

export type GrowerDashboardInput = {
  estates: Array<{ id: string; parcels?: unknown[] | null }>;
  batches?: Array<{ status?: string | null }> | null;
  missions?: Array<{ status?: string | null }> | null;
  fieldEntryCount?: number;
  harvestPlanCount?: number;
  financial?: {
    farmerShareInEscrow?: number;
    farmerShareReleased?: number;
  } | null;
};

const ACTIVE_MISSION = new Set([
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'READY_FOR_LOADING',
  'PICKED_UP',
  'IN_TRANSIT',
]);

const ACTIVE_BATCH = new Set([
  'HARVESTED',
  'PACKED',
  'QUALITY_VERIFIED',
  'IN_TRANSIT',
  'READY_FOR_LOADING',
]);

export function computeGrowerDashboardStats(input: GrowerDashboardInput) {
  const estates = input.estates ?? [];
  const parcelCount = estates.reduce(
    (sum, e) => sum + (Array.isArray(e.parcels) ? e.parcels.length : 0),
    0,
  );
  const batches = input.batches ?? [];
  const missions = input.missions ?? [];
  const activeBatches = batches.filter((b) =>
    ACTIVE_BATCH.has(String(b.status ?? '').toUpperCase()),
  ).length;
  const activeMissions = missions.filter((m) =>
    ACTIVE_MISSION.has(String(m.status ?? '').toUpperCase()),
  ).length;
  return {
    estateCount: estates.length,
    parcelCount,
    lotCount: batches.length,
    activeBatchCount: activeBatches,
    activeMissionCount: activeMissions,
    fieldEntryCount: input.fieldEntryCount ?? 0,
    harvestPlanCount: input.harvestPlanCount ?? 0,
    escrowEur: input.financial?.farmerShareInEscrow ?? 0,
    releasedEur: input.financial?.farmerShareReleased ?? 0,
  };
}
