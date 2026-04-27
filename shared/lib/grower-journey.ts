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
    kicker: 'Field & compliance on the ground',
    text: 'parcels approved → sowing & season work (mobile) → harvest plan when close to picking.',
  },
  {
    kicker: 'Lot & paperwork',
    text: 'create/update batch → pack to PACKED / QUALITY_VERIFIED → quality entry → compliance photos + label roll.',
  },
  {
    kicker: 'Exit farm',
    text: 'Request transport → logistics accepts → loading handover (truck proof) → cold chain to hub / buyer → Mission tracker follows the run; retail orders are tied in operations (not auto-split from a forecast in the app).',
  },
];

export const GROWER_JOURNEY_INTRO = {
  sidebarBlurb:
    'Read steps 1–12 in order. The green sidebar lists 11 pages (it combines a few topics these cards split out, e.g. approval and field work). Order: Dashboard → Steps → My fields through Mission tracker, then Profile.',
  myFieldsCta: {
    title: 'My fields',
    line: 'Open when you are ready to map blocks and crops.',
    linkLabel: 'Open My fields',
    webHref: '/grower/fields',
    mobilePath: '/(producer)/estates',
  },
} as const;

export const GROWER_JOURNEY_STEP_DEFS: GrowerJourneyStepDef[] = [
  {
    title: 'Dashboard',
    paragraphs: [
      'Start here for alerts (messages, active batches, transport), farm name, and the next recommended action. Use it every few days, not only once.',
    ],
    links: [
      { label: 'Open Dashboard', webHref: '/grower', mobilePath: '/(producer)/(tabs)/' },
    ],
  },
  {
    title: 'Steps (this page)',
    paragraphs: [
      'This grid has 12 numbered cards; the web sidebar has 11 links in the same journey (we split a few topics here for clarity). Order: Dashboard → Steps → My fields … Mission tracker → Profile. On the app, the bottom tab has Home, Steps, Products, and Profile — open Home for fields, materials, transport, and the rest.',
    ],
  },
  {
    title: 'My fields — estates & parcels (blocks)',
    paragraphs: [
      'Create your field (estate) and parcels (crop blocks). Draw or adjust the area so the system can compute surface in m². Set crop / variety where the form allows. An administrator must approve a parcel before batches, diaries, and sprays are fully unlocked on that block.',
    ],
    links: [{ label: 'My fields', webHref: '/grower/fields', mobilePath: '/(producer)/estates' }],
  },
  {
    title: 'Approval',
    paragraphs: [
      'Wait until parcels show as approved. Until then, some actions will stay locked — that is normal. If it takes long, use Contact / messages to operations.',
    ],
  },
  {
    title: 'Supply — materials & suppliers',
    paragraphs: [
      'Materials = in-app catalog: crates, label rolls, film, balances and serial numbers (e.g. label rolls) for compliance. Suppliers & orders = directory, B2B order to a partner, messages, and Received at farm when goods arrive. On mobile, use Materials and Partner orders; on web, Suppliers & orders.',
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
    title: 'Field work — sowing, journal, treatments',
    paragraphs: [
      'From sowing onward, use the mobile app for day-to-day work: field diary, growth journal, compliant sprays/treatments (with GPS where required). That is the traceability layer before you form a commercial lot.',
      'When the crop is nearing harvest, file a harvest plan in the app (expected kg, optional loading window) so operations and logistics can plan — that is not the same as a retail order; it feeds planning and missions.',
      'On web, boundaries and blocks live under My fields; use the phone in the row for entries.',
    ],
    linksWeb: [{ label: 'My fields', href: '/grower/fields' }],
    linksMobile: [
      { label: 'Field journal', path: '/(producer)/(tabs)/field-log' },
      { label: 'Growth journal', path: '/(producer)/growth-journal' },
    ],
  },
  {
    title: 'Harvest & forming a lot (batch)',
    paragraphs: [
      'When the crop is ready, report harvest and form a batch / lot for that parcel. That ties quantity and timing to the block you mapped earlier. Use the mobile harvest flow when you announce a window or kg.',
    ],
    links: [
      { label: 'My fields (start batch)', webHref: '/grower/fields', mobilePath: '/(producer)/(tabs)/harvest' },
      { label: 'My batches', webHref: '/grower/batches', mobilePath: '/(producer)/batches' },
    ],
  },
  {
    title: 'Packing & lot status',
    paragraphs: [
      'Complete packing / trace steps for the lot in My batches until status is PACKED or QUALITY_VERIFIED (use the mobile packing flow when required). Transport is blocked until the lot reaches one of those states and compliance is complete (next step).',
    ],
    linksWeb: [{ label: 'My batches', href: '/grower/batches' }],
    linksMobile: [
      { label: 'Packing flow', path: '/(producer)/packing-flow' },
      { label: 'My batches', path: '/(producer)/batches' },
    ],
  },
  {
    title: 'Quality entry & compliance photos',
    paragraphs: [
      'Do these in order for each lot: (1) Quality entry — per-lot checks and units. (2) Compliance photos + label roll ID (three photos + sticker roll on file). The transport form checks compliance; if something is missing, fix it here first.',
    ],
    links: [
      { label: 'Quality entry', webHref: '/grower/quality-entry', mobilePath: '/(producer)/quality-entry' },
      { label: 'Compliance photos', webHref: '/grower/compliance-photos', mobilePath: '/(producer)/compliance-photos' },
    ],
  },
  {
    title: 'Request transport',
    paragraphs: [
      'Only when the batch is PACKED or QUALITY_VERIFIED and compliance is complete, open Request transport. You need pickup GPS/address and a full drop-off (buyer, hub, or dock). A cold-chain partner may auto-assign.',
    ],
    footnote:
      'Retail / wholesale orders from buyers are matched in operations (who supplies which kg). The app does not auto-split a harvest forecast into a buyer order — you align quantity and dates with your coordinator, then reflect the real load in batches and transport.',
    linksWeb: [{ label: 'Request transport', href: '/grower/missions/create' }],
    linksMobile: [
      { label: 'Request transport', path: '/(producer)/missions-create' },
      { label: 'Missions (tracker)', path: '/(producer)/missions' },
    ],
  },
  {
    title: 'Mission tracker (farm → market)',
    paragraphs: [
      'Follow the mission from your farm: logistics may complete a loading handover (truck temperature + photos) after your quality step, then the run moves toward pickup and cold-chain transit to hub or buyer. You see status until delivery-style milestones complete. On the app, use the Missions list; on web, Mission tracker is /grower/portal.',
    ],
    links: [
      { label: 'Mission tracker', webHref: '/grower/portal', mobilePath: '/(producer)/missions' },
    ],
  },
  {
    title: 'Profile & account',
    paragraphs: [
      'Partner code, production country, notifications — open My profile. On mobile, wallet, certificates, and more live under the Profile tab and menus.',
    ],
    links: [{ label: 'My profile', webHref: '/grower/profile', mobilePath: '/(producer)/(tabs)/profile' }],
  },
];

export const GROWER_JOURNEY_STEP_COUNT = GROWER_JOURNEY_STEP_DEFS.length;
