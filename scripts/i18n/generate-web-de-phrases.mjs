#!/usr/bin/env node
/**
 * Generate web-de-phrases.json from pending EN strings using rule + word translation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translateEnToDe } from './en-to-de-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const OUT = path.join(__dirname, 'web-de-phrases.json');
const PARTIAL = path.join(__dirname, 'web-de-phrases-partial.json');

const WORDS = {
  overview: 'Übersicht', management: 'Verwaltung', loading: 'Laden', failed: 'fehlgeschlagen',
  refresh: 'Aktualisieren', review: 'Prüfung', release: 'Freigabe', funds: 'Mittel',
  changed: 'geändert', refreshed: 'aktualisiert', credited: 'gutgeschrieben', wallets: 'Wallets',
  action: 'Aktion', details: 'Details', retry: 'erneut versuchen', condition: 'Zustand',
  authorization: 'Autorisierung', reason: 'Grund', optional: 'optional', required: 'erforderlich',
  confirmation: 'Bestätigung', image: 'Bild', documents: 'Dokumente', linking: 'Verknüpfung',
  report: 'Bericht', decision: 'Entscheidung', complaint: 'Reklamation', accepted: 'angenommen',
  saved: 'gespeichert', received: 'empfangen', notifications: 'Benachrichtigungen', unread: 'Ungelesen',
  read: 'Gelesen', dashboard: 'Dashboard', legal: 'Rechtliches', vision: 'Vision', roadmap: 'Roadmap',
  directory: 'Verzeichnis', partner: 'Partner', active: 'Aktiv', packed: 'Verpackt', returned: 'Zurückgegeben',
  expired: 'Abgelaufen', harvested: 'Geerntet', online: 'Online', offline: 'Offline', sync: 'Sync',
  overdue: 'überfällig', saving: 'Wird gespeichert', instructions: 'Anweisungen', pickup: 'Abholung',
  logistics: 'Logistik', contact: 'Kontakt', vehicle: 'Fahrzeug', linked: 'verknüpft', trip: 'Fahrt',
  license: 'Kennzeichen', plate: 'Kennzeichen', supply: 'Versorgung', transport: 'Transport',
  awaiting: 'ausstehend', growth: 'Wachstum', journal: 'Protokoll', entries: 'Einträge', load: 'Laden',
  entries: 'Einträge', bags: 'Säcke', area: 'Fläche', insights: 'Insights', score: 'Score',
  historical: 'Historisch', deficit: 'Defizit', oversupply: 'Überangebot', risk: 'Risiko', level: 'Niveau',
  price: 'Preis', trend: 'Trend', explanation: 'Erklärung', crop: 'Kultur', name: 'Name',
  create: 'Erstellen', update: 'Aktualisieren', delete: 'Löschen', edit: 'Bearbeiten', save: 'Speichern',
  cancel: 'Abbrechen', confirm: 'Bestätigen', approve: 'Genehmigen', reject: 'Ablehnen', submit: 'Absenden',
  search: 'Suchen', filter: 'Filtern', select: 'Auswählen', choose: 'Wählen', open: 'Öffnen', close: 'Schließen',
  view: 'Anzeigen', add: 'Hinzufügen', remove: 'Entfernen', assign: 'Zuweisen', assign: 'Zuweisen',
  status: 'Status', notes: 'Notizen', mission: 'Mission', destination: 'Ziel', created: 'Erstellt',
  platform: 'Plattform', users: 'Benutzer', user: 'Benutzer', orders: 'Bestellungen', order: 'Bestellung',
  batch: 'Charge', batches: 'Chargen', parcel: 'Parzelle', parcels: 'Parzellen', estate: 'Betrieb',
  grower: 'Erzeuger', growers: 'Erzeuger', farmer: 'Erzeuger', buyer: 'Käufer', supplier: 'Lieferant',
  product: 'Produkt', products: 'Produkte', catalog: 'Katalog', stock: 'Bestand', quantity: 'Menge',
  harvest: 'Ernte', planting: 'Anbau', plantings: 'Anbauvorgänge', field: 'Parzelle', fields: 'Parzellen',
  quality: 'Qualität', compliance: 'Konformität', packing: 'Verpackung', materials: 'Materialien',
  barcode: 'Barcode', photos: 'Fotos', photo: 'Foto', signature: 'Unterschrift', delivery: 'Lieferung',
  shipment: 'Sendung', carrier: 'Spediteur', driver: 'Fahrer', warehouse: 'Lager', hub: 'Hub',
  temperature: 'Temperatur', cold: 'Kühl', chain: 'Kette', freshness: 'Frische', security: 'Sicherheit',
  alerts: 'Warnungen', operations: 'Operations', admin: 'Admin', finance: 'Finanzen', payment: 'Zahlung',
  payments: 'Zahlungen', wallet: 'Wallet', balance: 'Saldo', payout: 'Auszahlung', refund: 'Erstattung',
  returns: 'Rücksendungen', reconciliation: 'Abgleich', settlement: 'Abrechnung', invoice: 'Rechnung',
  application: 'Bewerbung', register: 'Registrieren', registration: 'Registrierung', login: 'Anmeldung',
  password: 'Passwort', email: 'E-Mail', phone: 'Telefon', address: 'Adresse', city: 'Stadt',
  country: 'Land', company: 'Unternehmen', contact: 'Kontakt', description: 'Beschreibung',
  title: 'Titel', subtitle: 'Untertitel', intro: 'Einleitung', summary: 'Zusammenfassung', details: 'Details',
  settings: 'Einstellungen', profile: 'Profil', account: 'Konto', notifications: 'Benachrichtigungen',
  messages: 'Nachrichten', help: 'Hilfe', guide: 'Leitfaden', instructions: 'Anweisungen', standards: 'Standards',
  requirements: 'Anforderungen', benefits: 'Vorteile', eligibility: 'Voraussetzungen', careers: 'Karriere',
  investor: 'Investor', deck: 'Deck', press: 'Presse', about: 'Über uns', privacy: 'Datenschutz',
  terms: 'AGB', cookies: 'Cookies', security: 'Sicherheit', faq: 'FAQ', support: 'Support',
  marketplace: 'Marktplatz', shop: 'Shop', cart: 'Warenkorb', checkout: 'Kasse', retail: 'Einzelhandel',
  wholesale: 'Großhandel', pricing: 'Preise', margin: 'Marge', revenue: 'Umsatz', profit: 'Gewinn',
  cost: 'Kosten', fee: 'Gebühr', commission: 'Provision', bonus: 'Bonus', insurance: 'Versicherung',
  seed: 'Saatgut', seeds: 'Saatgut', fertilizer: 'Düngemittel', packaging: 'Verpackung', equipment: 'Technik',
  certification: 'Zertifizierung', certified: 'Zertifiziert', verified: 'Verifiziert', pending: 'Ausstehend',
  approved: 'Genehmigt', rejected: 'Abgelehnt', cancelled: 'Storniert', completed: 'Abgeschlossen',
  confirmed: 'Bestätigt', assigned: 'Zugewiesen', delivered: 'Geliefert', transit: 'Unterwegs',
  dispatched: 'Versendet', shipped: 'Versendet', picked: 'Abgeholt', arrived: 'Angekommen',
  empty: 'Leer', none: 'Keine', all: 'Alle', any: 'Beliebig', new: 'Neu', recent: 'Aktuell',
  latest: 'Neueste', oldest: 'Älteste', total: 'Gesamt', count: 'Anzahl', minimum: 'Mindestens',
  maximum: 'Höchstens', at: 'bei', least: 'mindestens', characters: 'Zeichen', files: 'Dateien',
  file: 'Datei', upload: 'Hochladen', download: 'Herunterladen', export: 'Exportieren', import: 'Importieren',
  print: 'Drucken', preview: 'Vorschau', generate: 'Generieren', generating: 'Wird generiert',
  processing: 'Wird verarbeitet', submitting: 'Wird gesendet', updating: 'Wird aktualisiert',
  checking: 'Wird geprüft', looking: 'Wird gesucht', searching: 'Wird gesucht', sending: 'Wird gesendet',
  claiming: 'Wird beansprucht', assigning: 'Wird zugewiesen', reassigning: 'Wird neu zugewiesen',
  preparing: 'Wird vorbereitet', paused: 'Pausiert', resumed: 'Fortgesetzt', suspended: 'Ausgesetzt',
  inactive: 'Inaktiv', operational: 'Operativ', available: 'Verfügbar', unavailable: 'Nicht verfügbar',
  enabled: 'Aktiviert', disabled: 'Deaktiviert', locked: 'Gesperrt', unlocked: 'Entsperrt',
  public: 'Öffentlich', private: 'Privat', confidential: 'Vertraulich', internal: 'Intern',
  external: 'Extern', local: 'Lokal', global: 'Global', regional: 'Regional', national: 'National',
  european: 'Europäisch', german: 'Deutsch', english: 'Englisch', serbian: 'Serbisch',
  monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag',
  friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag', today: 'Heute', tomorrow: 'Morgen',
  yesterday: 'Gestern', week: 'Woche', month: 'Monat', year: 'Jahr', date: 'Datum', time: 'Zeit',
  hours: 'Stunden', minutes: 'Minuten', days: 'Tage', when: 'Wann', where: 'Wo', what: 'Was',
  why: 'Warum', how: 'Wie', who: 'Wer', which: 'Welche', true: 'Wahr', false: 'Falsch',
  yes: 'Ja', no: 'Nein', ok: 'OK', error: 'Fehler', warning: 'Warnung', success: 'Erfolg',
  information: 'Information', notice: 'Hinweis', hint: 'Hinweis', tip: 'Tipp', example: 'Beispiel',
  default: 'Standard', custom: 'Benutzerdefiniert', other: 'Sonstiges', unknown: 'Unbekannt',
  general: 'Allgemein', specific: 'Spezifisch', detailed: 'Detailliert', brief: 'Kurz', full: 'Vollständig',
  partial: 'Teilweise', complete: 'Vollständig', incomplete: 'Unvollständig', valid: 'Gültig',
  invalid: 'Ungültig', missing: 'Fehlend', found: 'Gefunden', not: 'Nicht', yet: 'noch',
  again: 'erneut', back: 'Zurück', next: 'Weiter', previous: 'Zurück', first: 'Erste', last: 'Letzte',
  step: 'Schritt', steps: 'Schritte', phase: 'Phase', stage: 'Stufe', process: 'Prozess',
  flow: 'Ablauf', workflow: 'Workflow', pipeline: 'Pipeline', queue: 'Warteschlange', list: 'Liste',
  table: 'Tabelle', column: 'Spalte', row: 'Zeile', page: 'Seite', section: 'Abschnitt',
  chapter: 'Kapitel', topic: 'Thema', topics: 'Themen', category: 'Kategorie', categories: 'Kategorien',
  type: 'Typ', types: 'Typen', role: 'Rolle', roles: 'Rollen', permission: 'Berechtigung',
  access: 'Zugriff', invite: 'Einladen', invitation: 'Einladung', team: 'Team', staff: 'Mitarbeiter',
  manager: 'Manager', director: 'Direktor', specialist: 'Spezialist', developer: 'Entwickler',
  representative: 'Vertreter', accountant: 'Buchhalter', agent: 'Agent', producer: 'Erzeuger',
  manufacturer: 'Hersteller', factory: 'Fabrik', portal: 'Portal', panel: 'Panel', control: 'Kontrolle',
  command: 'Kommando', monitor: 'Überwachen', resolve: 'Lösen', violation: 'Verstoß', violations: 'Verstöße',
  audit: 'Audit', log: 'Protokoll', logs: 'Protokolle', history: 'Verlauf', timeline: 'Zeitachse',
  event: 'Ereignis', events: 'Ereignisse', activity: 'Aktivität', activities: 'Aktivitäten',
  movement: 'Bewegung', movements: 'Bewegungen', tracking: 'Verfolgung', tracker: 'Tracker',
  map: 'Karte', location: 'Standort', coordinates: 'Koordinaten', latitude: 'Breitengrad',
  longitude: 'Längengrad', gps: 'GPS', geolocation: 'Geolokalisierung', polygon: 'Polygon',
  surface: 'Fläche', hectare: 'Hektar', weight: 'Gewicht', volume: 'Volumen', size: 'Größe',
  label: 'Etikett', labels: 'Etiketten', roll: 'Rolle', sticker: 'Aufkleber', sheet: 'Bogen',
  crate: 'Kiste', crates: 'Kisten', pallet: 'Palette', pallets: 'Paletten', unit: 'Einheit',
  units: 'Einheiten', kg: 'kg', gram: 'Gramm', liter: 'Liter', percent: 'Prozent', percentage: 'Prozentsatz',
  purity: 'Reinheit', germination: 'Keimung', spacing: 'Abstand', depth: 'Tiefe', irrigation: 'Bewässerung',
  soil: 'Boden', temperature: 'Temperatur', weather: 'Wetter', conditions: 'Bedingungen',
  treatment: 'Behandlung', treatments: 'Behandlungen', spray: 'Spritzung', sprays: 'Spritzungen',
  input: 'Input', inputs: 'Inputs', chemical: 'Chemikalie', chemicals: 'Chemikalien', pesticide: 'Pestizid',
  laboratory: 'Labor', results: 'Ergebnisse', inspection: 'Inspektion', findings: 'Befunde',
  deviation: 'Abweichung', deviations: 'Abweichungen', dispute: 'Streitfall', disputed: 'strittig',
  recall: 'Rückruf', recalled: 'Zurückgerufen', quarantine: 'Quarantäne', write: 'Abschreiben',
  off: 'Abschreibung', void: 'Stornieren', voided: 'Storniert', retire: 'Stilllegen', archive: 'Archivieren',
  archived: 'Archiviert', publish: 'Veröffentlichen', published: 'Veröffentlicht', draft: 'Entwurf',
  active: 'Aktiv', live: 'Live', demo: 'Demo', test: 'Test', sample: 'Beispiel', mock: 'Mock',
  prototype: 'Prototyp', pilot: 'Pilot', production: 'Produktion', run: 'Lauf', runs: 'Läufe',
  serial: 'Seriennummer', serials: 'Seriennummern', code: 'Code', codes: 'Codes', reference: 'Referenz',
  identifier: 'Kennung', uuid: 'UUID', sku: 'SKU', id: 'ID', number: 'Nummer', version: 'Version',
};

const PHRASE_RULES = [
  [/^Could not (.+)\.$/, '$1 konnte nicht durchgeführt werden.'],
  [/^Could not (.+) — (.+)\.$/, '$1 konnte nicht durchgeführt werden — $2.'],
  [/^Failed to (.+)\.$/, '$1 fehlgeschlagen.'],
  [/^No (.+) yet\.?$/, 'Noch keine $1.'],
  [/^No (.+) found\.?$/, 'Keine $1 gefunden.'],
  [/^No (.+) available\.?$/, 'Keine $1 verfügbar.'],
  [/^Loading (.+)…$/, '$1 wird geladen …'],
  [/^(.+) is required\.?$/, '$1 ist erforderlich.'],
  [/^(.+) required\.?$/, '$1 erforderlich.'],
  [/^Please (.+)\.$/, 'Bitte $1.'],
  [/^Enter (.+)$/, '$1 eingeben'],
  [/^Select (.+)$/, '$1 auswählen'],
  [/^Open (.+)$/, '$1 öffnen'],
  [/^View (.+)$/, '$1 anzeigen'],
  [/^Add (.+)$/, '$1 hinzufügen'],
  [/^Edit (.+)$/, '$1 bearbeiten'],
  [/^Delete (.+)$/, '$1 löschen'],
  [/^Update (.+)$/, '$1 aktualisieren'],
  [/^Manage (.+)$/, '$1 verwalten'],
  [/^Mark (.+)$/, '$1 markieren'],
  [/^Download (.+)$/, '$1 herunterladen'],
  [/^Upload (.+)$/, '$1 hochladen'],
  [/^Search (.+)$/, '$1 suchen'],
  [/^Refresh (.+)$/, '$1 aktualisieren'],
  [/^Retry (.+)$/, '$1 erneut versuchen'],
  [/^At least (\d+) characters\.?$/, 'Mindestens $1 Zeichen.'],
  [/^Reason \((.+)\)$/, 'Grund ($1)'],
  [/^(.+) \((optional)\)$/, '$1 (optional)'],
  [/^(.+) \*(.*)$/, '$1 *$2'],
];

function wordTranslate(text) {
  let out = text;
  for (const [re, repl] of PHRASE_RULES) {
    if (re.test(out)) return out.replace(re, repl);
  }
  const ruleResult = translateEnToDe(text);
  if (ruleResult !== text) return ruleResult;

  return out.replace(/\b[A-Za-z][A-Za-z'-]*\b/g, (word) => {
    const lower = word.toLowerCase();
    if (WORDS[lower]) {
      const de = WORDS[lower];
      if (word === word.toUpperCase()) return de.toUpperCase();
      if (word[0] === word[0].toUpperCase()) return de.charAt(0).toUpperCase() + de.slice(1);
      return de;
    }
    return word;
  });
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else if (typeof v === 'string') out[key] = v;
  }
  return out;
}

const allowlist = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/i18n-same-as-en.json'), 'utf8'));
function isAllowlisted(key, value) {
  if (allowlist.keys?.includes(key)) return true;
  if ((value?.length ?? 0) < (allowlist.minLength ?? 3)) return true;
  for (const pattern of allowlist.patterns ?? []) {
    try {
      if (new RegExp(pattern, 'i').test(key) || new RegExp(pattern, 'i').test(value)) return true;
    } catch {
      if (value?.includes(pattern)) return true;
    }
  }
  return false;
}

const enFlat = flatten(JSON.parse(fs.readFileSync(path.join(ROOT, 'web/locales/en.json'), 'utf8')));
const deFlat = flatten(JSON.parse(fs.readFileSync(path.join(ROOT, 'web/locales/de.json'), 'utf8')));

const partial = fs.existsSync(PARTIAL) ? JSON.parse(fs.readFileSync(PARTIAL, 'utf8')) : {};
const map = { ...partial };

for (const [k, v] of Object.entries(enFlat)) {
  if (deFlat[k] !== v || isAllowlisted(k, v)) continue;
  if (map[v] && map[v] !== v) continue;
  const translated = wordTranslate(v);
  if (translated !== v) map[v] = translated;
}

fs.writeFileSync(OUT, `${JSON.stringify(map, null, 2)}\n`);
console.log(`Generated ${Object.keys(map).length} phrase mappings -> ${OUT}`);
