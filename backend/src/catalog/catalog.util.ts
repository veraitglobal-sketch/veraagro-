export function computeRemainingKg(plannedQuantityKg: number, orderedKg: number): number {
  return Math.max(0, plannedQuantityKg - orderedKg);
}

export function computeMaxPacks(remainingKg: number, packSizeKg: number): number {
  if (packSizeKg <= 0) return 0;
  return Math.floor(remainingKg / packSizeKg);
}
