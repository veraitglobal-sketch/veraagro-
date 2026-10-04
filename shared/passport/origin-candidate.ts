/** A supplier named for later review; never evidence that a lot came from it. */
export type OriginCandidate = {
  supplierName: string;
  status: 'PENDING_DOCUMENTATION';
  verified: false;
  recordedAt: string;
};

export function readOriginCandidate(value: unknown, recordedAt: Date | string): OriginCandidate | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (row.status !== 'PENDING_DOCUMENTATION' || row.verified !== false ||
      typeof row.supplierName !== 'string' || !row.supplierName.trim()) return null;
  const date = new Date(recordedAt);
  if (!Number.isFinite(date.getTime())) return null;
  return { supplierName: row.supplierName.trim(), status: 'PENDING_DOCUMENTATION', verified: false,
    recordedAt: date.toISOString() };
}
