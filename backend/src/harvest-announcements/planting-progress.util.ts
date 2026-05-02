/**
 * Planting plans (harvest_announcements / PLANTING) require periodic photo + notes in growth_logs.
 * Next deadline = (last growth log time ?? plan createdAt) + interval days.
 */

export function getPlantingProgressIntervalDays(): number {
  const raw = process.env.PLANTING_PROGRESS_INTERVAL_DAYS;
  const n = raw != null && raw !== '' ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 7 && n <= 90) return Math.floor(n);
  return 18;
}

export function getPlantingProgressNotesMinLength(): number {
  const raw = process.env.PLANTING_PROGRESS_NOTES_MIN_LEN;
  const n = raw != null && raw !== '' ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 5 && n <= 500) return Math.floor(n);
  return 15;
}

export interface PlantingProgressDto {
  intervalDays: number;
  lastGrowthLogAt: string | null;
  nextDueAt: string;
  isOverdue: boolean;
  daysOverdue: number;
}

export function computePlantingProgress(
  planCreatedAt: Date,
  lastLogAt: Date | null,
  now: Date,
  intervalDays: number,
): PlantingProgressDto {
  const intervalMs = intervalDays * 86_400_000;
  const anchor = lastLogAt ?? planCreatedAt;
  const nextDueAt = new Date(anchor.getTime() + intervalMs);
  const isOverdue = now.getTime() > nextDueAt.getTime();
  const daysOverdue = isOverdue
    ? Math.floor((now.getTime() - nextDueAt.getTime()) / 86_400_000)
    : 0;
  return {
    intervalDays,
    lastGrowthLogAt: lastLogAt ? lastLogAt.toISOString() : null,
    nextDueAt: nextDueAt.toISOString(),
    isOverdue,
    daysOverdue,
  };
}
