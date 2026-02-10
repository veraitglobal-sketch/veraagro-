/**
 * Partner / certification logos configuration
 *
 * Logos in /web/public/ are used (e.g. GLOBALGAP.png, IFOAM.png).
 * To add a new partner: add image to public, then add an entry below.
 */

export interface Partner {
  name: string;
  logo: string; // Path to logo image in /public/
  url?: string; // Optional partner website URL
  alt?: string; // Optional alt text (defaults to partner name)
}

export const partners: Partner[] = [
  { name: 'GLOBALG.A.P.', logo: '/GLOBALGAP.png', alt: 'GLOBALG.A.P. Certification' },
  { name: 'IFOAM', logo: '/IFOAM.png', alt: 'IFOAM Organic' },
  { name: 'HACCP', logo: '/haccp.png', alt: 'HACCP' },
  { name: 'Sedex', logo: '/sedex.png', alt: 'Sedex' },
  { name: 'EU Organic Awards', logo: '/eu-organic-awards.png', alt: 'EU Organic Awards' },
];

/**
 * Get partner logo path
 * Falls back to Bio Vera logo if partner logo doesn't exist
 */
export function getPartnerLogo(partner: Partner): string {
  // In production, you might want to check if the file exists
  // For now, we'll just return the path
  return partner.logo || '/logo1.png';
}

/**
 * Check if partner has a valid logo
 */
export function hasPartnerLogo(partner: Partner): boolean {
  return !!partner.logo && partner.logo !== '/logo1.png';
}
