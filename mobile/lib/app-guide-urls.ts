import i18n from '../i18n/config';
import { growerAppGuidePdfFilename } from './grower-app-guide-assets';

const DEFAULT_SITE = 'https://biovera.app';

function siteOrigin(): string {
  const raw = process.env.EXPO_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE;
  return raw.replace(/\/$/, '');
}

function guideLocale(): 'sr' | 'en' {
  const code = (i18n.language ?? 'sr').split('-')[0]?.toLowerCase();
  return code === 'en' ? 'en' : 'sr';
}

/** Public web page with screenshots (same as web grower mobile-app-guide). */
export function growerMobileAppGuideWebUrl(): string {
  const loc = guideLocale();
  return `${siteOrigin()}/${loc}/grower/mobile-app-guide`;
}

/** Static PDF committed under web public/docs (works without loading the full page). */
export function growerMobileAppGuidePdfUrl(): string {
  const file = growerAppGuidePdfFilename(guideLocale());
  return `${siteOrigin()}/docs/grower-app-guide/${file}`;
}
