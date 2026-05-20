/** Keep in sync with `web/lib/grower-app-guide.ts` PDF filenames. */
export const GROWER_APP_GUIDE_PDF_FILES = {
  sr: 'biovera-grower-app-guide.sr.pdf',
  en: 'biovera-grower-app-guide.en.pdf',
} as const;

export function growerAppGuidePdfFilename(locale?: string): string {
  const lang = (locale ?? 'sr').split('-')[0]?.toLowerCase();
  return lang === 'en' ? GROWER_APP_GUIDE_PDF_FILES.en : GROWER_APP_GUIDE_PDF_FILES.sr;
}
