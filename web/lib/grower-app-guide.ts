/** Public URL prefix — files live in `web/public/docs/grower-app-guide/`. */
export const GROWER_APP_GUIDE_SCREEN_BASE = '/docs/grower-app-guide';

/** Static PDFs — generate once via `npm run generate:app-guide-pdf`, commit, deploy. */
export const GROWER_APP_GUIDE_PDF_FILES = {
  sr: 'biovera-grower-app-guide.sr.pdf',
  en: 'biovera-grower-app-guide.en.pdf',
} as const;

/** @deprecated Use {@link growerAppGuidePdfPath} */
export const GROWER_APP_GUIDE_PDF_PATH = `${GROWER_APP_GUIDE_SCREEN_BASE}/${GROWER_APP_GUIDE_PDF_FILES.sr}`;

export function growerAppGuidePdfPath(locale?: string): string {
  const lang = (locale ?? 'sr').split('-')[0]?.toLowerCase();
  const file =
    lang === 'en' ? GROWER_APP_GUIDE_PDF_FILES.en : GROWER_APP_GUIDE_PDF_FILES.sr;
  return `${GROWER_APP_GUIDE_SCREEN_BASE}/${file}`;
}

export function growerAppGuidePdfFilename(locale?: string): string {
  const lang = (locale ?? 'sr').split('-')[0]?.toLowerCase();
  return lang === 'en' ? GROWER_APP_GUIDE_PDF_FILES.en : GROWER_APP_GUIDE_PDF_FILES.sr;
}

/** Append to guide URL so all screenshots load eagerly (PDF export / Playwright). */
export const GROWER_APP_GUIDE_PDF_EXPORT_PARAM = 'pdf';
export const GROWER_APP_GUIDE_PDF_EXPORT_VALUE = '1';

export function growerAppGuidePdfExportSearch(): string {
  return `${GROWER_APP_GUIDE_PDF_EXPORT_PARAM}=${GROWER_APP_GUIDE_PDF_EXPORT_VALUE}`;
}

export function isGrowerAppGuidePdfExport(searchParams: URLSearchParams | { get: (k: string) => string | null }): boolean {
  return searchParams.get(GROWER_APP_GUIDE_PDF_EXPORT_PARAM) === GROWER_APP_GUIDE_PDF_EXPORT_VALUE;
}

export type GrowerAppGuideDetailBlock = {
  heading: string;
  body: string;
};

export type GrowerAppGuideStep = {
  id: string;
  /** Filename only, e.g. `4.png` */
  imageFile: string;
  titleKey: string;
  leadKey: string;
  /** i18n key → `{ returnObjects: true }` → GrowerAppGuideDetailBlock[] (right column) */
  detailBlocksKey: string;
  /** Optional short checklist at the end of the right column */
  bulletKeys?: string[];
};

/**
 * Order matches the farmer journey for the mobile app guide.
 * Add PNGs to `public/docs/grower-app-guide/screens/` with these exact names.
 */
export const GROWER_APP_GUIDE_STEP_COUNT = 9;

export const GROWER_APP_GUIDE_STEPS: GrowerAppGuideStep[] = [
  {
    id: 'welcome',
    imageFile: '1.png',
    titleKey: 'grower.appGuide.steps.welcome.title',
    leadKey: 'grower.appGuide.steps.welcome.lead',
    detailBlocksKey: 'grower.appGuide.steps.welcome.detailBlocks',
    bulletKeys: ['grower.appGuide.steps.welcome.b1', 'grower.appGuide.steps.welcome.b2'],
  },
  {
    id: 'register',
    imageFile: '2.png',
    titleKey: 'grower.appGuide.steps.register.title',
    leadKey: 'grower.appGuide.steps.register.lead',
    detailBlocksKey: 'grower.appGuide.steps.register.detailBlocks',
    bulletKeys: ['grower.appGuide.steps.register.b1', 'grower.appGuide.steps.register.b2'],
  },
  {
    id: 'login',
    imageFile: '3.png',
    titleKey: 'grower.appGuide.steps.login.title',
    leadKey: 'grower.appGuide.steps.login.lead',
    detailBlocksKey: 'grower.appGuide.steps.login.detailBlocks',
    bulletKeys: ['grower.appGuide.steps.login.b1', 'grower.appGuide.steps.login.b2'],
  },
  {
    id: 'home',
    imageFile: '4.png',
    titleKey: 'grower.appGuide.steps.home.title',
    leadKey: 'grower.appGuide.steps.home.lead',
    detailBlocksKey: 'grower.appGuide.steps.home.detailBlocks',
    bulletKeys: [
      'grower.appGuide.steps.home.b1',
      'grower.appGuide.steps.home.b2',
      'grower.appGuide.steps.home.b3',
    ],
  },
  {
    id: 'field',
    imageFile: '5.png',
    titleKey: 'grower.appGuide.steps.field.title',
    leadKey: 'grower.appGuide.steps.field.lead',
    detailBlocksKey: 'grower.appGuide.steps.field.detailBlocks',
    bulletKeys: [
      'grower.appGuide.steps.field.b1',
      'grower.appGuide.steps.field.b2',
      'grower.appGuide.steps.field.b3',
      'grower.appGuide.steps.field.b4',
      'grower.appGuide.steps.field.b5',
      'grower.appGuide.steps.field.b6',
    ],
  },
  {
    id: 'lots',
    imageFile: '6.jpeg',
    titleKey: 'grower.appGuide.steps.lots.title',
    leadKey: 'grower.appGuide.steps.lots.lead',
    detailBlocksKey: 'grower.appGuide.steps.lots.detailBlocks',
    bulletKeys: [
      'grower.appGuide.steps.lots.b1',
      'grower.appGuide.steps.lots.b2',
      'grower.appGuide.steps.lots.b3',
    ],
  },
  {
    id: 'suppliers',
    imageFile: '7.jpeg',
    titleKey: 'grower.appGuide.steps.suppliers.title',
    leadKey: 'grower.appGuide.steps.suppliers.lead',
    detailBlocksKey: 'grower.appGuide.steps.suppliers.detailBlocks',
    bulletKeys: [
      'grower.appGuide.steps.suppliers.b1',
      'grower.appGuide.steps.suppliers.b2',
      'grower.appGuide.steps.suppliers.b3',
    ],
  },
  {
    id: 'profile',
    imageFile: '8.jpeg',
    titleKey: 'grower.appGuide.steps.profile.title',
    leadKey: 'grower.appGuide.steps.profile.lead',
    detailBlocksKey: 'grower.appGuide.steps.profile.detailBlocks',
    bulletKeys: ['grower.appGuide.steps.profile.b1', 'grower.appGuide.steps.profile.b2'],
  },
  {
    id: 'wallet',
    imageFile: '9.jpeg',
    titleKey: 'grower.appGuide.steps.wallet.title',
    leadKey: 'grower.appGuide.steps.wallet.lead',
    detailBlocksKey: 'grower.appGuide.steps.wallet.detailBlocks',
    bulletKeys: ['grower.appGuide.steps.wallet.b1', 'grower.appGuide.steps.wallet.b2'],
  },
];

export function growerAppGuideImageSrc(imageFile: string): string {
  return `${GROWER_APP_GUIDE_SCREEN_BASE}/${imageFile}`;
}
