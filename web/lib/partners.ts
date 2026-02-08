/**
 * Partner logos configuration
 * 
 * To add a new partner:
 * 1. Add the partner logo image to /web/public/partners/
 * 2. Add an entry to the partners array below
 * 3. The image will automatically be displayed on the homepage
 */

export interface Partner {
  name: string;
  logo: string; // Path to logo image in /public/partners/
  url?: string; // Optional partner website URL
  alt?: string; // Optional alt text (defaults to partner name)
}

export const partners: Partner[] = [
  // Example partners - replace with real ones
  // {
  //   name: 'Partner Name',
  //   logo: '/partners/partner-logo.png',
  //   url: 'https://partner-website.com',
  //   alt: 'Partner Name Logo',
  // },
  
  // Placeholder partners (will be replaced with real ones)
  // For now, using Bio Vera logo as placeholder
  // Remove these when real partners are added
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
