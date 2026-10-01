/**
 * Season currently open for pre-orders. Keep in sync with `shared/preorder.ts` (web).
 * Override per environment with PRE_ORDER_SEASON when a new season opens.
 */
export function currentPreOrderSeason(): number {
  const fromEnv = Number(process.env.PRE_ORDER_SEASON);
  return Number.isInteger(fromEnv) && fromEnv >= 2026 ? fromEnv : 2027;
}
