/**
 * Partner / certification logos — only list organisations with documented endorsement rights.
 * Empty until formal partnership/certification status is confirmed for public display.
 */

export interface Partner {
  name: string;
  logo: string;
  url?: string;
  alt?: string;
}

export const partners: Partner[] = [];

export function getPartnerLogo(partner: Partner): string {
  return partner.logo || '/biovera-logo.png';
}

export function hasPartnerLogo(partner: Partner): boolean {
  return !!partner.logo && partner.logo !== '/biovera-logo.png';
}
