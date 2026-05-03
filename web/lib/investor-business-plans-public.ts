/**
 * Feature flag for password-only reader at `/[locale]/investor-deck/business-plans`.
 * Flow: `INVESTOR_BUSINESS_PLANS_GATE_PASSWORD` (bundle cookie) → per-tier `GROWER_CONFIDENTIAL_BUSINESS_PLAN_*_PASSWORD` (tier cookies).
 * Routes: unlock `/{locale}/investor-deck/business-plans/unlock`, markdown `.../plan-markdown/{short|medium|long}`.
 * Not linked from public hubs; share URL only with cleared recipients.
 */
export function isInvestorBusinessPlansPublicEnabled(): boolean {
  return (process.env.INVESTOR_BUSINESS_PLANS_ENABLED || '').trim().toLowerCase() === 'true';
}

/** First-step password on investor deck — unlocks access to per-tier document passwords. Server-only. */
export function getInvestorBusinessPlansGatePassword(): string {
  return (process.env.INVESTOR_BUSINESS_PLANS_GATE_PASSWORD ?? '').trim();
}

export function isInvestorGatePasswordConfigured(): boolean {
  return getInvestorBusinessPlansGatePassword().length > 0;
}
