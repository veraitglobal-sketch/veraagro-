/** Map internal telemetry source ids to i18n key suffixes (never show raw table names). */

export const PASSPORT_ESTIMATE_SOURCE_KEYS = {
  freshness_trackers: 'systemEstimate',
  bio_vera_standards: 'platformStandard',
} as const;

export type PassportEstimateSourceKey =
  (typeof PASSPORT_ESTIMATE_SOURCE_KEYS)[keyof typeof PASSPORT_ESTIMATE_SOURCE_KEYS];

export function passportEstimateSourceKey(source: string): string {
  return (
    PASSPORT_ESTIMATE_SOURCE_KEYS[source as keyof typeof PASSPORT_ESTIMATE_SOURCE_KEYS] ?? source
  );
}
