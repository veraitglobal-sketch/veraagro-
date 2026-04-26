/**
 * Comma- or space-separated list for GET /admin/farmers/:id?include=...
 * Omit param or `all` → return full dossier (same as before).
 * Keys: meta, farmer, materialBalance, trust, kyc, kycDocuments, estates, batches,
 * compliancePhotos, treatmentLogs, complianceLogs, fieldPhotos, growthLogs, labResults,
 * harvestAnnouncements, missions, batchesSummary, counts
 */
const ALIASES: Record<string, string> = {
  kyc: 'kycDocuments',
  compliance: 'complianceLogs',
};

export function parseFarmerDetailIncludeParam(raw?: string | null): Set<string> | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '' || s.toLowerCase() === 'all' || s === '*') return null;
  const set = new Set<string>();
  for (const part of s.split(/[\s,]+/)) {
    const k = part.trim().toLowerCase();
    if (!k) continue;
    set.add(ALIASES[k] ?? k);
  }
  return set;
}

export function includeSection(I: Set<string> | null, key: string): boolean {
  if (I === null) return true;
  return I.has(key);
}
