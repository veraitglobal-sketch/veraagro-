/** Password-protected partner plan reader under Investor Deck — no grower login; uses same tier passwords / markdown as grower confidential (ENV). */
export function isInvestorBusinessPlansPublicEnabled(): boolean {
  return (process.env.INVESTOR_BUSINESS_PLANS_ENABLED || '').trim().toLowerCase() === 'true';
}
