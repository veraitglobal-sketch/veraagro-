#!/usr/bin/env node
/**
 * Generates docs/UI_COPY_MAP_SR.md — navigation + Serbian UI copy per screen.
 * Run: node scripts/generate-ui-copy-map.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function get(obj, keyPath) {
  const parts = keyPath.split('.');
  let o = obj;
  for (const p of parts) {
    if (o == null || typeof o !== 'object') return undefined;
    o = o[p];
  }
  return o;
}

function t(locale, key) {
  const v = get(locale, key);
  if (v == null) return `_[nema: ${key}]_`;
  if (typeof v === 'object') return `_[objekat: ${key}]_`;
  return String(v);
}

function section(title, keys, locale, webLocale) {
  const lines = [`### ${title}`, ''];
  for (const key of keys) {
    const val = t(locale, key) ?? (webLocale ? t(webLocale, key) : undefined);
    if (val && !val.startsWith('_[nema')) lines.push(`- **${key}** → ${val}`);
  }
  lines.push('');
  return lines.join('\n');
}

const mobile = loadJson('mobile/i18n/locales/sr-partial.json');
const web = loadJson('web/locales/sr.json');

/** @type {{ route: string; from: string; titleKey: string; keys: string[] }[]} */
const mobileScreens = [
  {
    route: '/(producer)/(tabs)/index — Početna',
    from: 'Prijava (proizvođač)',
    titleKey: 'producer.tabs.home',
    keys: [
      'producer.brand.ribbon',
      'producer.brand.ribbonSub',
      'producer.dashboard.greeting',
      'producer.dashboard.greetingName',
      'producer.dashboard.defaultFarmName',
      'producer.dashboard.homeLeadShort',
      'producer.dashboard.homeKpi.parcels',
      'producer.dashboard.homeKpi.chain',
      'producer.dashboard.homeKpi.outbox',
      'producer.dashboard.nextStep.eyebrow',
      'producer.dashboard.journey.blockTitle',
      'producer.offline.banner',
    ],
  },
  {
    route: '/(producer)/(tabs)/field — tab Polje',
    from: 'Donji meni → Polje',
    titleKey: 'producer.hubs.field.title',
    keys: [
      'producer.tabs.field',
      'producer.hubs.field.leadShort',
      'producer.hubs.field.sectionRecords',
      'producer.hubs.field.sectionFarm',
      'producer.hubs.field.sectionSeason',
      'producer.hubs.field.sectionGuide',
    ],
  },
  {
    route: '/(producer)/(tabs)/field-log — Dnevnik unosa',
    from: 'Početna → Sledeći korak / Polje → Dnevnik unosa',
    titleKey: 'producer.tabs.fieldLog',
    keys: ['producer.tabs.fieldLog', 'producer.hubs.field.fieldLogDesc', 'producer.dashboard.fieldLogDesc'],
  },
  {
    route: '/(producer)/estates — Moja polja i parcele',
    from: 'Polje → Moja polja i parcele',
    titleKey: 'producer.hubs.field.estatesTitle',
    keys: ['producer.hubs.field.estatesTitle', 'producer.hubs.field.estatesDesc'],
  },
  {
    route: '/(producer)/estates/new — Nova njiva',
    from: 'Početna → Dodaj njivu',
    titleKey: 'producer.dashboard.nextStep.addFieldTitle',
    keys: [
      'producer.dashboard.nextStep.addFieldTitle',
      'producer.dashboard.nextStep.addFieldBody',
      'producer.dashboard.nextStep.addFieldCta',
    ],
  },
  {
    route: '/(producer)/plot-mapper — Plan zona parcele',
    from: 'Polje → Plan zona parcele',
    titleKey: 'producer.hubs.field.plotMapperTitle',
    keys: ['producer.hubs.field.plotMapperTitle', 'producer.hubs.field.plotMapperDesc'],
  },
  {
    route: '/(producer)/plantings — Zasadi',
    from: 'Polje → Zasadi i planovi',
    titleKey: 'producer.plantings.screenTitle',
    keys: [
      'producer.plantings.screenTitle',
      'producer.plantings.introShort',
      'producer.plantings.addAccessibility',
      'producer.plantings.formSectionTitle',
    ],
  },
  {
    route: '/(producer)/(tabs)/harvest — Žetva',
    from: 'Polje → Žetva',
    titleKey: 'producer.tabs.harvest',
    keys: ['producer.tabs.harvest', 'producer.hubs.field.harvestDesc', 'producer.dashboard.reportHarvest'],
  },
  {
    route: '/(producer)/growth-journal — Dnevnik rasta',
    from: 'Polje → Dnevnik rasta',
    titleKey: 'producer.hubs.field.growthJournalTitle',
    keys: ['producer.hubs.field.growthJournalTitle', 'producer.hubs.field.growthJournalDesc'],
  },
  {
    route: '/(producer)/(tabs)/steps — Uputstva (sezona)',
    from: 'Početna / Polje → Uputstva',
    titleKey: 'producer.tabs.steps',
    keys: [
      'producer.tabs.steps',
      'producer.hubs.field.stepsDesc',
      'producer.dashboard.seasonGuideTitle',
      'producer.dashboard.seasonGuideSubtitle',
    ],
  },
  {
    route: '/(producer)/app-guide — Vodič aplikacije',
    from: 'Polje → Vodič',
    titleKey: 'producer.appGuide.cardTitle',
    keys: ['producer.appGuide.cardTitle', 'producer.appGuide.cardBody'],
  },
  {
    route: '/(producer)/(tabs)/chain — tab Lot',
    from: 'Donji meni → Lot',
    titleKey: 'producer.hubs.chain.title',
    keys: [
      'producer.tabs.chain',
      'producer.hubs.chain.title',
      'producer.hubs.chain.leadShort',
      'producer.hubs.chain.sectionLots',
      'producer.hubs.chain.sectionQuality',
      'producer.hubs.chain.sectionTransport',
      'producer.hubs.chain.sectionBadges',
    ],
  },
  {
    route: '/(producer)/batches — Lotovi (lista)',
    from: 'Lot → Lotovi',
    titleKey: 'producer.tabs.batches',
    keys: ['producer.tabs.batches', 'producer.hubs.chain.batchesDesc'],
  },
  {
    route: '/(producer)/batch-new — Novi lot',
    from: 'Lotovi → + novi',
    titleKey: 'producer.batches.listScreenTitle',
    keys: ['producer.batches.listScreenTitle', 'producer.batches.listLeadOneLine'],
  },
  {
    route: '/(producer)/batch/[id] — Detalj lota',
    from: 'Lotovi → kartica lota',
    titleKey: 'producer.batches.lotLabel',
    keys: [
      'producer.batches.lotLabel',
      'producer.batches.lotSystemBatchId',
      'producer.batches.filterDone',
      'producer.batches.filterMoving',
    ],
  },
  {
    route: '/(producer)/packing-flow — Pakovanje',
    from: 'Lot → Pakovanje (GPS + foto)',
    titleKey: 'navigation.packingFlow',
    keys: ['navigation.packingFlow', 'producer.hubs.chain.packingDesc'],
  },
  {
    route: '/(producer)/quality-entry — Kvalitet',
    from: 'Lot → Unos kvaliteta',
    titleKey: 'producer.hubs.chain.qualityTitle',
    keys: ['producer.hubs.chain.qualityTitle', 'producer.hubs.chain.qualityDesc'],
  },
  {
    route: '/(producer)/compliance-photos — Usklađenost',
    from: 'Lot → Fotografije usklađenosti',
    titleKey: 'producer.hubs.chain.complianceTitle',
    keys: ['producer.hubs.chain.complianceTitle', 'producer.hubs.chain.complianceDesc'],
  },
  {
    route: '/(producer)/missions-create — Zatraži transport',
    from: 'Početna / Lot → Zatraži transport',
    titleKey: 'navigation.requestTransport',
    keys: [
      'navigation.requestTransport',
      'producer.hubs.chain.transportDesc',
      'producer.dashboard.nextStep.requestTransportTitle',
      'producer.dashboard.nextStep.requestTransportBody',
    ],
  },
  {
    route: '/(producer)/missions — Lista misija',
    from: 'Lot / Početna → Misije',
    titleKey: 'producer.hubs.chain.missionsTitle',
    keys: ['producer.hubs.chain.missionsTitle', 'producer.hubs.chain.missionsDesc', 'producer.tabs.missions'],
  },
  {
    route: '/(producer)/mission/[id] — Detalj misije',
    from: 'Misije → red',
    titleKey: 'producer.missions.detailScreenTitle',
    keys: [
      'producer.missions.detailScreenTitle',
      'producer.missions.status.AWAITING_APPROVAL',
      'producer.missions.status.COMPLETED',
    ],
  },
  {
    route: '/(producer)/package-badges — Nalepnice',
    from: 'Lot → Nalepnice / serije',
    titleKey: 'producer.packageBadges.title',
    keys: ['producer.packageBadges.title', 'producer.packageBadges.subtitle', 'producer.packageBadges.submit'],
  },
  {
    route: '/(producer)/scanner — Skeniraj',
    from: 'Lot → Skeniraj QR/barkod',
    titleKey: 'navigation.scanBarcode',
    keys: ['navigation.scanBarcode', 'producer.hubs.chain.scanDesc'],
  },
  {
    route: '/(producer)/(tabs)/supplies — tab Nabavka',
    from: 'Donji meni → Nabavka',
    titleKey: 'producer.hubs.supplies.title',
    keys: [
      'producer.tabs.supplies',
      'producer.hubs.supplies.title',
      'producer.hubs.supplies.leadShort',
      'producer.hubs.supplies.sectionOrders',
      'producer.hubs.supplies.sectionInputs',
      'producer.hubs.supplies.sectionOffer',
    ],
  },
  {
    route: '/(producer)/materials — Materijali',
    from: 'Nabavka → Materijali',
    titleKey: 'producer.dashboard.farmer.materialsTitle',
    keys: ['producer.dashboard.farmer.materialsTitle', 'producer.hubs.supplies.materialsDesc'],
  },
  {
    route: '/(producer)/(tabs)/cost-calculator — Troškovi',
    from: 'Nabavka → Troškovi',
    titleKey: 'producer.costCalculator.title',
    keys: ['producer.costCalculator.title', 'producer.dashboard.costCalculatorDesc'],
  },
  {
    route: '/(producer)/(tabs)/products — Moji proizvodi',
    from: 'Nabavka → Moji proizvodi',
    titleKey: 'producer.hubs.supplies.productsTitle',
    keys: ['producer.hubs.supplies.productsTitle', 'producer.hubs.supplies.productsDesc'],
  },
  {
    route: '/(producer)/partner-orders — Porudžbine partnera',
    from: 'Nabavka → Porudžbine snabdevača',
    titleKey: 'producer.dashboard.partnerOrders.title',
    keys: [
      'producer.dashboard.partnerOrders.title',
      'producer.dashboard.partnerOrders.screenLeadShort',
      'producer.dashboard.partnerOrders.emptyOrdersShort',
    ],
  },
  {
    route: '/(producer)/(tabs)/profile — tab Profil',
    from: 'Donji meni → Profil',
    titleKey: 'producer.tabs.profile',
    keys: [
      'producer.tabs.profile',
      'producer.dashboard.homeFinanceTeaserTitle',
      'producer.dashboard.educationBannerTitle',
      'producer.tabs.settings',
    ],
  },
  {
    route: '/(producer)/(tabs)/wallet — Novčanik',
    from: 'Profil → Novčanik',
    titleKey: 'producer.tabs.wallet',
    keys: ['producer.tabs.wallet', 'producer.dashboard.financialOrders.title'],
  },
  {
    route: '/(producer)/notifications — Obaveštenja',
    from: 'Početna / Profil / Nabavka',
    titleKey: 'notificationsCenter.title',
    keys: ['notificationsCenter.title', 'producer.dashboard.nextStep.notificationsBody'],
  },
  {
    route: '/(producer)/education — Edukacija',
    from: 'Profil → Edukacija',
    titleKey: 'producer.dashboard.educationBannerTitle',
    keys: ['producer.dashboard.educationBannerTitle', 'producer.dashboard.educationBannerSubtitle'],
  },
  {
    route: '/(producer)/(tabs)/settings — Podešavanja',
    from: 'Profil → Podešavanja',
    titleKey: 'producer.tabs.settings',
    keys: ['producer.tabs.settings', 'producer.profile.offlineQueueLabel'],
  },
  {
    route: '/(producer)/(tabs)/certifications — Sertifikati',
    from: 'Uputstva / alati',
    titleKey: 'producer.tabs.certifications',
    keys: ['producer.tabs.certifications', 'producer.dashboard.certificationsDesc'],
  },
  {
    route: '/(producer)/(tabs)/banned-substances — Zabranjeno',
    from: 'Uputstva / alati',
    titleKey: 'producer.tabs.bannedSubstances',
    keys: ['producer.tabs.bannedSubstances', 'producer.dashboard.bannedSubstancesDesc'],
  },
  {
    route: '/(producer)/farm-tools — Alati na farmi (legacy)',
    from: 'Stari link',
    titleKey: 'producer.dashboard.farmToolsTitle',
    keys: ['producer.dashboard.farmToolsTitle', 'producer.dashboard.legacyFarmToolsBody'],
  },
];

/** @type {{ route: string; from: string; titleKey: string; keys: string[] }[]} */
const webGrowerScreens = [
  { route: '/grower', from: 'Prijava proizvođača (web)', titleKey: 'grower.nav.dashboard', keys: ['grower.nav.dashboard'] },
  { route: '/grower/season', from: 'Sidebar → Uputstva', titleKey: 'grower.nav.steps', keys: ['grower.nav.steps'] },
  { route: '/grower/fields', from: 'Sidebar → Moje parcele', titleKey: 'grower.nav.myFields', keys: ['grower.nav.myFields', 'grower.placeholders.openParcels'] },
  { route: '/grower/plantings', from: 'Sidebar → Moji zasadi', titleKey: 'grower.nav.myPlantings', keys: ['grower.placeholders.plantingsTitle', 'grower.placeholders.plantingsBody'] },
  { route: '/grower/materials', from: 'Sidebar → Materijali', titleKey: 'grower.nav.materials', keys: ['grower.nav.materials'] },
  { route: '/grower/batches', from: 'Sidebar → Moji lotovi', titleKey: 'grower.nav.myBatches', keys: ['grower.nav.myBatches'] },
  { route: '/grower/field-diary', from: 'Sidebar → Dnevnik', titleKey: 'grower.nav.fieldDiary', keys: ['grower.placeholders.fieldDiaryTitle', 'grower.placeholders.fieldDiaryBody'] },
  { route: '/producer/field-entry', from: 'Sidebar → Terenski unos', titleKey: 'grower.nav.fieldCapture', keys: ['grower.nav.fieldCapture'] },
  { route: '/grower/package-badges/scan', from: 'Sidebar → Skeniraj palete', titleKey: 'grower.nav.scanPallets', keys: ['grower.nav.scanPallets'] },
  { route: '/grower/quality-entry', from: 'Sidebar → Kvalitet', titleKey: 'grower.nav.qualityEntry', keys: ['grower.nav.qualityEntry'] },
  { route: '/grower/compliance-photos', from: 'Sidebar → Usklađenost', titleKey: 'grower.nav.compliancePhotos', keys: ['grower.nav.compliancePhotos'] },
  { route: '/grower/education', from: 'Sidebar → Edukacija', titleKey: 'grower.nav.education', keys: ['grower.nav.education'] },
  { route: '/grower/app-guide', from: 'Sidebar → Vodič', titleKey: 'grower.nav.appGuide', keys: ['grower.appGuide.pageTitle', 'grower.appGuide.pageDescription'] },
  { route: '/grower/confidential', from: 'Sidebar → Partner planovi', titleKey: 'grower.nav.confidential', keys: ['grower.nav.confidential'] },
  { route: '/grower/where-to-buy', from: 'Sidebar → Dobavljači', titleKey: 'grower.nav.suppliersAndOrders', keys: ['grower.nav.suppliersAndOrders'] },
  { route: '/grower/missions/create', from: 'Sidebar → Zahtev transport', titleKey: 'grower.nav.requestTransport', keys: ['grower.nav.requestTransport'] },
  { route: '/grower/portal', from: 'Sidebar → Misije', titleKey: 'grower.nav.missionTracker', keys: ['grower.nav.missionTracker'] },
  { route: '/grower/profile', from: 'Sidebar → Profil', titleKey: 'grower.nav.myProfile', keys: ['grower.nav.myProfile'] },
  { route: '/admin/grower-control', from: 'Admin → Kontrola proizvođača', titleKey: 'adminPages.titles.growerControl', keys: ['adminPages.titles.growerControl'] },
];

const out = [];
out.push('# BioVera — mapa UI tekstova (srpski)');
out.push('');
out.push('> Generisano: `node scripts/generate-ui-copy-map.mjs`');
out.push('> Kompletan rečnik: `mobile/i18n/locales/sr-partial.json` (~1400+ ključeva pod `producer.*`) i `web/locales/sr.json` (`grower.*`, `growerPages.*`, `adminPages.*`).');
out.push('');
out.push('## Donji meni — mobilna aplikacija (proizvođač)');
out.push('');
out.push('```');
out.push('Početna | Polje | Lot | Nabavka | Profil');
out.push('```');
out.push('');
out.push('```mermaid');
out.push('flowchart TB');
out.push('  LOGIN[Prijava] --> HOME[Početna / index]');
out.push('  HOME -->|Dodaj njivu| ENEW[estates/new]');
out.push('  HOME -->|Sledeći korak| FL[field-log]');
out.push('  HOME -->|Transport| MC[missions-create]');
out.push('  HOME -->|Misije| MS[missions]');
out.push('  HOME -->|Obaveštenja| NT[notifications]');
out.push('  TAB_FIELD[Tab Polje] --> FL');
out.push('  TAB_FIELD --> EST[estates]');
out.push('  TAB_FIELD --> PLT[plot-mapper]');
out.push('  TAB_FIELD --> PLN[plantings]');
out.push('  TAB_FIELD --> HRV[harvest]');
out.push('  TAB_FIELD --> GJ[growth-journal]');
out.push('  TAB_FIELD --> STP[steps]');
out.push('  TAB_CHAIN[Tab Lot] --> BAT[batches]');
out.push('  TAB_CHAIN --> PK[packing-flow]');
out.push('  TAB_CHAIN --> QL[quality-entry]');
out.push('  TAB_CHAIN --> CP[compliance-photos]');
out.push('  TAB_CHAIN --> MC');
out.push('  TAB_CHAIN --> MS');
out.push('  TAB_CHAIN --> PB[package-badges]');
out.push('  TAB_SUP[Tab Nabavka] --> MAT[materials]');
out.push('  TAB_SUP --> PO[partner-orders]');
out.push('  TAB_PROF[Tab Profil] --> WAL[wallet]');
out.push('  TAB_PROF --> SET[settings]');
out.push('  LOGIN --> TAB_FIELD');
out.push('  LOGIN --> TAB_CHAIN');
out.push('  LOGIN --> TAB_SUP');
out.push('  LOGIN --> TAB_PROF');
out.push('```');
out.push('');
out.push('---');
out.push('');
out.push('## Mobilna aplikacija — ekran po ekranu');
out.push('');

for (const s of mobileScreens) {
  out.push(`## ${t(mobile, s.titleKey)}`);
  out.push('');
  out.push(`- **Ruta:** \`${s.route}\``);
  out.push(`- **Dolazi sa:** ${s.from}`);
  out.push('');
  out.push(section('Tekstovi na ekranu', s.keys, mobile));
}

out.push('---');
out.push('');
out.push('## Web proizvođač (/grower/*) — sidebar redosled');
out.push('');
out.push('```');
const nav = web.grower?.nav ?? {};
Object.entries(nav).forEach(([k, v]) => out.push(`${v}`));
out.push('```');
out.push('');

for (const s of webGrowerScreens) {
  out.push(`## ${t(web, s.titleKey)}`);
  out.push('');
  out.push(`- **URL:** \`${s.route}\``);
  out.push(`- **Dolazi sa:** ${s.from}`);
  out.push('');
  out.push(section('Tekstovi', s.keys, web, mobile));
}

out.push('---');
out.push('');
out.push('## Ostale uloge u mobilnoj aplikaciji (kratko)');
out.push('');
out.push('| Uloga | Folder | Tabovi / ulaz |');
out.push('|-------|--------|----------------|');
out.push('| Kupac | `app/(buyer)` | Shop, porudžbine |');
out.push('| Logistika | `app/(logistics)` | Misije, vozila |');
out.push('| Snabdevač | `app/(supplier)` | Katalog, porudžbine |');
out.push('');
out.push('Prevodi: `sr-partial.json` prefiksi `buyer.*`, `logistics.*`, `supplier.*`, `auth.*`.');
out.push('');
out.push('## Javni web (marketing)');
out.push('');
out.push('| Stranica | URL | Locale ključevi |');
out.push('|----------|-----|-----------------|');
out.push('| Početna | `/[locale]` | `hero*`, `home*` u `web/locales/sr.json` |');
out.push('| Proizvođači | `/[locale]/growers` | `growersPage.*` |');
out.push('| FAQ, kontakt, legal | `/[locale]/faq` itd. | po namespace-u stranice |');
out.push('');
out.push('Slogan lanca: **Od njive do police** (`producer.brand.ribbon`, `growerJourney.tagline`).');

const dest = path.join(root, 'docs/UI_COPY_MAP_SR.md');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out.join('\n'));
console.log('Wrote', dest, '(' + out.length + ' lines)');
