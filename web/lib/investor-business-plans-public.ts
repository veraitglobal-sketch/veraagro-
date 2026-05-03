/**
 * Feature flag for password-only reader at `/[locale]/investor-deck/business-plans`.
 * Bootstrap/unlock (same JSON as legacy API): GET/POST/DELETE `/{locale}/investor-deck/business-plans/unlock`.
 * Not linked from public hubs; share URL only with cleared recipients.
 */
export function isInvestorBusinessPlansPublicEnabled(): boolean {
  return (process.env.INVESTOR_BUSINESS_PLANS_ENABLED || '').trim().toLowerCase() === 'true';
}
