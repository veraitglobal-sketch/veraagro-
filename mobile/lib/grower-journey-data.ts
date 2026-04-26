/**
 * Same order as web `GrowerSeasonJourney` and grower web nav after reorder.
 * Paths are Expo Router strings.
 */
export type JourneyLink = { label: string; path: string };

export type GrowerJourneyStep = {
  title: string;
  paragraphs: string[];
  links?: JourneyLink[];
};

export const GROWER_JOURNEY_STEPS: GrowerJourneyStep[] = [
  {
    title: 'Dashboard',
    paragraphs: [
      'Start here for alerts, farm name, and the next action. Check regularly during the season.',
    ],
    links: [{ label: 'Open dashboard (Home tab)', path: '/(producer)/(tabs)/' }],
  },
  {
    title: 'Steps (this list)',
    paragraphs: [
      'The app matches this order: after Home, use this Steps tab, then work down through fields, materials, batches, and transport. Profile stays last for account settings.',
    ],
  },
  {
    title: 'My fields & parcels',
    paragraphs: [
      'Create the estate and parcels (blocks), set crop on the parcel, and adjust the area so the app knows m². An administrator must approve a parcel before batches and some diaries are fully available.',
    ],
    links: [{ label: 'My fields & estates', path: '/(producer)/estates' }],
  },
  {
    title: 'Approval',
    paragraphs: [
      'Wait for parcel approval. Until then, some screens stay locked on that block — that is expected.',
    ],
  },
  {
    title: 'Supply — materials & partners',
    paragraphs: [
      'Materials: in-app purchase updates balances and label-roll serials. Partner orders: directory, B2B order, then Received at farm when the delivery arrives. Use both as your process needs.',
    ],
    links: [
      { label: 'Materials', path: '/(producer)/materials' },
      { label: 'Partner orders', path: '/(producer)/partner-orders' },
    ],
  },
  {
    title: 'Field work — journal & growth',
    paragraphs: [
      'Log what you do on the parcel: field diary, growth journal, and compliant treatments (spray) with time and place. Scanners and GPS protect integrity.',
    ],
    links: [
      { label: 'Field journal', path: '/(producer)/(tabs)/field-log' },
      { label: 'Growth journal', path: '/(producer)/growth-journal' },
    ],
  },
  {
    title: 'Harvest & batch (lot)',
    paragraphs: [
      'When ready, report harvest and form a batch for that parcel. Then manage the lot in My batches and packing flow.',
    ],
    links: [
      { label: 'Harvest', path: '/(producer)/(tabs)/harvest' },
      { label: 'My batches', path: '/(producer)/batches' },
    ],
  },
  {
    title: 'Quality & compliance photos',
    paragraphs: [
      'Complete quality entry and compliance photos (e.g. label roll id, crates) so the lot can move to transport when rules are met.',
    ],
    links: [
      { label: 'Quality entry', path: '/(producer)/quality-entry' },
      { label: 'Compliance photos', path: '/(producer)/compliance-photos' },
    ],
  },
  {
    title: 'Request transport',
    paragraphs: [
      'When the batch is ready, request transport with address and location.',
    ],
    links: [
      { label: 'Request transport', path: '/(producer)/missions-create' },
      { label: 'Missions (tracker)', path: '/(producer)/missions' },
    ],
  },
  {
    title: 'Mission tracker',
    paragraphs: [
      'Follow pickup, hub, and delivery until the handover is done.',
    ],
    links: [{ label: 'Open missions', path: '/(producer)/missions' }],
  },
  {
    title: 'Profile & more',
    paragraphs: [
      'Wallet, map, cost calculator, certificates, settings — from the Profile tab and menus.',
    ],
    links: [{ label: 'Profile tab', path: '/(producer)/(tabs)/profile' }],
  },
];
