/** "Book a free call" (Kostenfreies Erstgespräch) via Calendly — shared by web and mobile. */

/** Bio Vera Calendly event used when no environment override is set. */
export const DEFAULT_CALENDLY_URL = 'https://calendly.com/biovera-info/30min';

export const BOOK_CALL_ROLES = ['buyer', 'producer', 'supplier', 'logistics', 'other'] as const;
export type BookCallRole = (typeof BOOK_CALL_ROLES)[number];

/** English role label sent to Calendly as the answer to the first invitee question ("Role"). */
export const BOOK_CALL_ROLE_LABEL_EN: Record<BookCallRole, string> = {
  buyer: 'Buyer',
  producer: 'Producer / grower',
  supplier: 'Supplier',
  logistics: 'Logistics partner',
  other: 'Other',
};

/** Calendly embed look: our card background, text and Bio Vera green; hide Calendly's own header/banner. */
export const CALENDLY_EMBED_STYLE = {
  hide_event_type_details: '1',
  hide_landing_page_details: '1',
  hide_gdpr_banner: '1',
  background_color: 'f9fafb',
  text_color: '171717',
  primary_color: '2d5a27',
} as const;

export function isBookCallRole(value: unknown): value is BookCallRole {
  return typeof value === 'string' && (BOOK_CALL_ROLES as readonly string[]).includes(value);
}

/** Maps app user roles (BUYER, GROWER, FARMER, …) to the booking role. */
export function bookCallRoleFromUserRoles(roles: readonly string[] | null | undefined): BookCallRole | null {
  const r = new Set((roles ?? []).map((x) => x.toUpperCase()));
  if (r.has('BUYER')) return 'buyer';
  if (r.has('GROWER') || r.has('FARMER') || r.has('SEED_PRODUCER')) return 'producer';
  if (r.has('MATERIAL_SUPPLIER')) return 'supplier';
  if (r.has('LOGISTICS_PARTNER') || r.has('DRIVER')) return 'logistics';
  return null;
}

export type CalendlyUrls = {
  default?: string | null;
  buyer?: string | null;
  producer?: string | null;
  supplier?: string | null;
  logistics?: string | null;
};

/** Per-role event URL with fallback to the default event; null when nothing is configured. */
export function calendlyUrlForRole(role: BookCallRole, urls: CalendlyUrls): string | null {
  const own = role === 'other' ? null : urls[role];
  const url = (own || urls.default || '').trim();
  return /^https:\/\/calendly\.com\/[^\s]+$/i.test(url) ? url.replace(/\?.*$/, '') : null;
}

export function buildCalendlyLink(opts: {
  baseUrl: string;
  role: BookCallRole;
  name?: string | null;
  email?: string | null;
  language?: string | null;
  sourcePage?: string | null;
  source?: 'biovera-web' | 'biovera-app';
  /** For the inline iframe: domain that embeds it (Calendly requires embed_domain + embed_type). */
  embedDomain?: string | null;
}): string {
  const params = new URLSearchParams();
  if (opts.embedDomain) {
    params.set('embed_domain', opts.embedDomain);
    params.set('embed_type', 'Inline');
  }
  for (const [k, v] of Object.entries(CALENDLY_EMBED_STYLE)) params.set(k, v);
  if (opts.name?.trim()) params.set('name', opts.name.trim());
  if (opts.email?.trim()) params.set('email', opts.email.trim());
  params.set('a1', BOOK_CALL_ROLE_LABEL_EN[opts.role]);
  params.set('utm_source', opts.source ?? 'biovera-web');
  if (opts.sourcePage) params.set('utm_medium', opts.sourcePage.slice(0, 120));
  params.set('utm_campaign', opts.role);
  if (opts.language) params.set('utm_content', opts.language);
  return `${opts.baseUrl}?${params.toString()}`;
}

/** Role suggested by the page the visitor came from (growers page → producer, …). */
export function bookCallRoleFromPath(path: string | null | undefined): BookCallRole | null {
  const p = (path ?? '').toLowerCase();
  if (/(for-growers|\/growers|grower|producer|seed-producer)/.test(p)) return 'producer';
  if (/(for-buyers|buyer|marketplace|pre-order|biovera-fresh|products|produce)/.test(p)) return 'buyer';
  if (/(for-suppliers|\/suppliers|supplier)/.test(p)) return 'supplier';
  if (/(for-logistics|logistics|fleet)/.test(p)) return 'logistics';
  return null;
}
