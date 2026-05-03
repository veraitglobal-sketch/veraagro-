/**
 * Single source of truth for the grower “season” guide (12 steps, web + mobile).
 */
export type GrowerJourneyLinkDef = {
  label: string;
  webHref: string;
  mobilePath: string;
};

export type GrowerJourneyStepDef = {
  title: string;
  paragraphs: string[];
  footnote?: string;
  /** When web and app use the same CTAs. */
  links?: GrowerJourneyLinkDef[];
  /** When CTAs differ (e.g. journals only on app). */
  linksWeb?: Array<{ label: string; href: string }>;
  linksMobile?: Array<{ label: string; path: string }>;
};

export const GROWER_JOURNEY_CHAIN_SHORT: Array<{ kicker: string; text: string }> = [
  {
    kicker: 'On farm',
    text: 'parcels approved → sowing / season notes (mostly mobile) → harvest plan near pick.',
  },
  {
    kicker: 'Lot',
    text: 'batch → pack to PACKED / QUALITY_VERIFIED → quality entry → compliance photos + label roll.',
  },
  {
    kicker: 'Off farm',
    text:
      'request transport → dispatcher assigns driver → pickup & handover → cold chain → hub or buyer · missions track the run · buyer allocations are done in ops, not auto in the app.',
  },
];

export const GROWER_JOURNEY_INTRO = {
  sidebarBlurb:
    'Go 1→12 in order. The left menu is the same journey; here each card is one beat you can scan quickly.',
  myFieldsCta: {
    title: 'My fields',
    line: 'Draw blocks and crops when you start.',
    linkLabel: 'Open My fields',
    webHref: '/grower/fields',
    mobilePath: '/(producer)/estates',
  },
} as const;

export const GROWER_JOURNEY_STEP_DEFS: GrowerJourneyStepDef[] = [
  {
    title: 'Dashboard',
    paragraphs: ['Alerts, active lots, messages, suggested next step — glance every few visits.'],
    links: [{ label: 'Open Dashboard', webHref: '/grower', mobilePath: '/(producer)/(tabs)/' }],
  },
  {
    title: 'This checklist',
    paragraphs: [
      'Twelve cards on one page · same order as the sidebar (app: bottom tabs mirror the flow).',
    ],
  },
  {
    title: 'My fields (parcels)',
    paragraphs: [
      'Estate + parcels · m² · crop · batches / diary / treatments on a block stay limited until admin approves the parcel.',
    ],
    links: [{ label: 'My fields', webHref: '/grower/fields', mobilePath: '/(producer)/estates' }],
  },
  {
    title: 'Approval',
    paragraphs: ['Wait for approved · locked screens are normal · ping ops via messages if stalled.'],
  },
  {
    title: 'Materials & suppliers',
    paragraphs: [
      'Catalog (crates, rolls, foil, serials) · directory + B2B orders · mark received · app: Materials + Partner orders / web: Suppliers & orders.',
    ],
    links: [
      { label: 'Materials', webHref: '/grower/materials', mobilePath: '/(producer)/materials' },
      {
        label: 'Suppliers & orders',
        webHref: '/grower/where-to-buy',
        mobilePath: '/(producer)/partner-orders',
      },
    ],
  },
  {
    title: 'Field work',
    paragraphs: [
      'Daily: mobile entry log, journals, compliant sprays/treatments (GPS when required). Before harvest submit a kg/window harvest plan — for planning, not a retail checkout. Borders on web, captures in the field.',
    ],
    linksWeb: [{ label: 'My fields', href: '/grower/fields' }],
    linksMobile: [
      { label: 'Field journal', path: '/(producer)/(tabs)/field-log' },
      { label: 'Growth journal', path: '/(producer)/growth-journal' },
    ],
  },
  {
    title: 'Harvest → batch',
    paragraphs: [
      'When ready: declare harvest · create batch linked to parcel · use mobile flows for qty / window.',
    ],
    links: [
      {
        label: 'My fields (start batch)',
        webHref: '/grower/fields',
        mobilePath: '/(producer)/(tabs)/harvest',
      },
      { label: 'My batches', webHref: '/grower/batches', mobilePath: '/(producer)/batches' },
    ],
  },
  {
    title: 'Packing & status',
    paragraphs: [
      'Work the lot until PACKED or QUALITY_VERIFIED · transport waits until packing + compliance (next step).',
    ],
    linksWeb: [{ label: 'My batches', href: '/grower/batches' }],
    linksMobile: [
      { label: 'Packing flow', path: '/(producer)/packing-flow' },
      { label: 'My batches', path: '/(producer)/batches' },
    ],
  },
  {
    title: 'Quality & compliance pics',
    paragraphs: [
      '(1) Quality entry · (2) Compliance photos + label roll · transport form validates both.',
    ],
    links: [
      { label: 'Quality entry', webHref: '/grower/quality-entry', mobilePath: '/(producer)/quality-entry' },
      {
        label: 'Compliance photos',
        webHref: '/grower/compliance-photos',
        mobilePath: '/(producer)/compliance-photos',
      },
    ],
  },
  {
    title: 'Request transport',
    paragraphs: [
      'Only after packed / verified + compliance · pickup GPS/address + destination · queued until dispatcher assigns driver.',
    ],
    footnote: 'Who ships which kg to which buyer is set in ops — not inferred from forecasts in-app.',
    linksWeb: [{ label: 'Request transport', href: '/grower/missions/create' }],
    linksMobile: [
      { label: 'Request transport', path: '/(producer)/missions-create' },
      { label: 'Missions (tracker)', path: '/(producer)/missions' },
    ],
  },
  {
    title: 'Missions',
    paragraphs: ['Handover · cold chain · hub/buyer milestones · app: missions list · web: /grower/portal.'],
    links: [
      { label: 'Mission tracker', webHref: '/grower/portal', mobilePath: '/(producer)/missions' },
    ],
  },
  {
    title: 'Profile',
    paragraphs: ['Partner code, country, notifications · wallet & certs live under Profile on mobile.'],
    links: [{ label: 'My profile', webHref: '/grower/profile', mobilePath: '/(producer)/(tabs)/profile' }],
  },
];

export const GROWER_JOURNEY_STEP_COUNT = GROWER_JOURNEY_STEP_DEFS.length;
