/** Public URL prefix — files live in `web/public/docs/grower-app-guide/screens/`. */
export const GROWER_APP_GUIDE_SCREEN_BASE = '/docs/grower-app-guide/screens';

export const GROWER_APP_GUIDE_PDF_PATH = '/docs/grower-app-guide/biovera-grower-app-uputstvo.pdf';

export type GrowerAppGuideStep = {
  id: string;
  /** Filename only, e.g. `4.png` */
  imageFile: string;
  titleKey: string;
  leadKey: string;
  /** Optional i18n keys for bullet list under the screenshot */
  bulletKeys?: string[];
};

/**
 * Order matches the farmer journey for the mobile app guide.
 * Add PNGs to `public/docs/grower-app-guide/screens/` with these exact names.
 */
export const GROWER_APP_GUIDE_STEPS: GrowerAppGuideStep[] = [
  {
    id: 'welcome',
    imageFile: '1.png',
    titleKey: 'grower.appGuide.steps.welcome.title',
    leadKey: 'grower.appGuide.steps.welcome.lead',
    bulletKeys: ['grower.appGuide.steps.welcome.b1', 'grower.appGuide.steps.welcome.b2'],
  },
  {
    id: 'register',
    imageFile: '2.png',
    titleKey: 'grower.appGuide.steps.register.title',
    leadKey: 'grower.appGuide.steps.register.lead',
    bulletKeys: ['grower.appGuide.steps.register.b1', 'grower.appGuide.steps.register.b2'],
  },
  {
    id: 'login',
    imageFile: '3.png',
    titleKey: 'grower.appGuide.steps.login.title',
    leadKey: 'grower.appGuide.steps.login.lead',
    bulletKeys: ['grower.appGuide.steps.login.b1', 'grower.appGuide.steps.login.b2'],
  },
  {
    id: 'home',
    imageFile: '4.png',
    titleKey: 'grower.appGuide.steps.home.title',
    leadKey: 'grower.appGuide.steps.home.lead',
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
    imageFile: '6.png',
    titleKey: 'grower.appGuide.steps.lots.title',
    leadKey: 'grower.appGuide.steps.lots.lead',
    bulletKeys: [
      'grower.appGuide.steps.lots.b1',
      'grower.appGuide.steps.lots.b2',
      'grower.appGuide.steps.lots.b3',
    ],
  },
  {
    id: 'suppliers',
    imageFile: '7.png',
    titleKey: 'grower.appGuide.steps.suppliers.title',
    leadKey: 'grower.appGuide.steps.suppliers.lead',
    bulletKeys: [
      'grower.appGuide.steps.suppliers.b1',
      'grower.appGuide.steps.suppliers.b2',
      'grower.appGuide.steps.suppliers.b3',
    ],
  },
  {
    id: 'profile',
    imageFile: '8.png',
    titleKey: 'grower.appGuide.steps.profile.title',
    leadKey: 'grower.appGuide.steps.profile.lead',
    bulletKeys: ['grower.appGuide.steps.profile.b1', 'grower.appGuide.steps.profile.b2'],
  },
  {
    id: 'wallet',
    imageFile: '9.png',
    titleKey: 'grower.appGuide.steps.wallet.title',
    leadKey: 'grower.appGuide.steps.wallet.lead',
    bulletKeys: ['grower.appGuide.steps.wallet.b1', 'grower.appGuide.steps.wallet.b2'],
  },
];

export function growerAppGuideImageSrc(imageFile: string): string {
  return `${GROWER_APP_GUIDE_SCREEN_BASE}/${imageFile}`;
}
