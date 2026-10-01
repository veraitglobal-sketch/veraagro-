/**
 * Rule-based EN→DE translator for Bio Vera locale strings.
 * Preserves {{placeholders}}, <0> tags, brand names, and applies glossary terms.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_PHRASES_PATH = path.join(__dirname, 'web-de-phrases.json');
let WEB_PHRASES = {};
try {
  if (fs.existsSync(WEB_PHRASES_PATH)) {
    WEB_PHRASES = JSON.parse(fs.readFileSync(WEB_PHRASES_PATH, 'utf8'));
  }
} catch {
  WEB_PHRASES = {};
}

const GLOSSARY = {
  farm: 'Betrieb',
  farms: 'Betriebe',
  farmer: 'Erzeuger',
  farmers: 'Erzeuger',
  "farmer's": 'Erzeuger-',
  growers: 'Erzeuger',
  grower: 'Erzeuger',
  estate: 'Betrieb',
  estates: 'Betriebe',
  parcel: 'Parzelle',
  parcels: 'Parzellen',
  lot: 'Los',
  lots: 'Lose',
  batch: 'Charge',
  batches: 'Chargen',
  marketplace: 'Marktplatz',
  'field diary': 'Feldtagebuch',
  'harvest plan': 'Ernteplan',
  'harvest plans': 'Erntepläne',
  handover: 'Übergabe',
  'receiving code': 'Empfangscode',
  planting: 'Anbau',
  plantings: 'Anbauvorgänge',
  delivery: 'Lieferung',
  deliveries: 'Lieferungen',
  mission: 'Mission',
  missions: 'Missionen',
  'partner store': 'Partnergeschäft',
  'partner stores': 'Partnergeschäfte',
  catalogue: 'Katalog',
  catalog: 'Katalog',
  'seed bag': 'Saatgutsack',
  'seed bags': 'Saatgutsäcke',
  barcode: 'Barcode',
  barcodes: 'Barcodes',
  whitelist: 'Freigabeliste',
  whitelisted: 'freigegeben',
  transport: 'Transport',
  packing: 'Verpackung',
  quality: 'Qualität',
  compliance: 'Konformität',
  shipment: 'Sendung',
  shipments: 'Sendungen',
  carrier: 'Spediteur',
  driver: 'Fahrer',
  drivers: 'Fahrer',
  buyer: 'Käufer',
  buyers: 'Käufer',
  supplier: 'Lieferant',
  suppliers: 'Lieferanten',
  order: 'Bestellung',
  orders: 'Bestellungen',
  product: 'Produkt',
  products: 'Produkte',
  field: 'Parzelle',
  fields: 'Parzellen',
  crop: 'Kultur',
  crops: 'Kulturen',
  harvest: 'Ernte',
  seed: 'Saatgut',
  seeds: 'Saatgut',
  photo: 'Foto',
  photos: 'Fotos',
  signature: 'Unterschrift',
  receipt: 'Empfang',
  refund: 'Erstattung',
  refunds: 'Erstattungen',
  return: 'Rücksendung',
  returns: 'Rücksendungen',
  quarantine: 'Quarantäne',
  dashboard: 'Dashboard',
  scanner: 'Scanner',
  password: 'Passwort',
  email: 'E-Mail',
  hectare: 'Hektar',
  hectares: 'Hektar',
  loading: 'Wird geladen',
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  cancelled: 'Storniert',
  completed: 'Abgeschlossen',
  confirmed: 'Bestätigt',
  assigned: 'Zugewiesen',
  collected: 'Abgeholt',
  delivered: 'Geliefert',
  transit: 'Unterwegs',
};

const PHRASES = {
  'No results': 'Keine Ergebnisse',
  'Something went wrong. Check your connection and try again.': 'Etwas ist schiefgelaufen. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  'Something went wrong. Please try again.': 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  'Try again': 'Erneut versuchen',
  'Sign in': 'Anmelden',
  'Log in': 'Anmelden',
  'Sign out': 'Abmelden',
  'Register': 'Registrieren',
  'Back': 'Zurück',
  'Close': 'Schließen',
  'Cancel': 'Abbrechen',
  'Continue': 'Fortfahren',
  'Next': 'Weiter',
  'Submit': 'Absenden',
  'Save': 'Speichern',
  'Delete': 'Löschen',
  'Edit': 'Bearbeiten',
  'Add': 'Hinzufügen',
  'Remove': 'Entfernen',
  'Refresh': 'Aktualisieren',
  'Search': 'Suchen',
  'Filter': 'Filtern',
  'All': 'Alle',
  'Total': 'Gesamt',
  'Status': 'Status',
  'Required': 'Erforderlich',
  'Optional': 'Optional',
  'Loading…': 'Wird geladen…',
  'Loading...': 'Wird geladen…',
  'Success': 'Erfolg',
  'Warning': 'Warnung',
  'Error': 'Fehler',
  'Information': 'Information',
  'Permission denied': 'Berechtigung verweigert',
  'Permission required': 'Berechtigung erforderlich',
  'Open settings': 'Einstellungen öffnen',
  'No data available': 'Keine Daten verfügbar',
  'Limit reached': 'Limit erreicht',
  'Show': 'Anzeigen',
  'Hide': 'Ausblenden',
  'Home': 'Start',
  'Profile': 'Profil',
  'Settings': 'Einstellungen',
  'Messages': 'Nachrichten',
  'Notifications': 'Benachrichtigungen',
  'Orders': 'Bestellungen',
  'Shop': 'Shop',
  'Cart': 'Warenkorb',
  'Checkout': 'Kasse',
  'Dashboard': 'Dashboard',
  'Products': 'Produkte',
  'Guide': 'Leitfaden',
  'Education': 'Schulung',
  'Scanner': 'Scanner',
  'Scan': 'Scannen',
  'Allow': 'Erlauben',
  'Allow camera': 'Kamera erlauben',
  'Preparing camera…': 'Kamera wird vorbereitet…',
  'Marketplace': 'Marktplatz',
  'Partner code': 'Partnercode',
  'First name': 'Vorname',
  'Last name': 'Nachname',
  'Password': 'Passwort',
  'Create account': 'Konto erstellen',
  'Already have an account?': 'Bereits ein Konto?',
  'Please fill all fields': 'Bitte füllen Sie alle Felder aus',
  'Fill in all required fields': 'Füllen Sie alle Pflichtfelder aus',
  'Login failed. Please check your credentials.': 'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.',
  'Signing in...': 'Anmeldung läuft…',
  'Register as Buyer': 'Als Käufer registrieren',
  'Back to Marketplace': 'Zurück zum Marktplatz',
  'Grower registration': 'Erzeuger-Registrierung',
  'Create your Bio Vera farmer account': 'Erstellen Sie Ihr Bio Vera-Erzeugerkonto',
  'Registration sent': 'Registrierung gesendet',
  'Registration failed. Try again.': 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
  'Request transport': 'Transport anfordern',
  'Partner orders': 'Partnerbestellungen',
  'Packing': 'Verpackung',
  'Serial numbers': 'Seriennummern',
  'Order tracking': 'Bestellverfolgung',
  'Where to Buy': 'Wo kaufen',
  'Contact & order': 'Kontakt & Bestellung',
  'Retail / pickup': 'Einzelhandel / Abholung',
  'Material supplier': 'Materiallieferant',
  'Loading map…': 'Karte wird geladen…',
  'No locations on the map yet': 'Noch keine Standorte auf der Karte',
  'In transit': 'Unterwegs',
  'Delivered': 'Geliefert',
  'Assigned to carrier': 'Spediteur zugewiesen',
  'Picked up by carrier': 'Vom Spediteur abgeholt',
  'Delivered — awaiting receipt': 'Geliefert — Empfang ausstehend',
  'Receipt confirmed': 'Empfang bestätigt',
  'Completed': 'Abgeschlossen',
  'Start review': 'Prüfung starten',
  'Decision': 'Entscheidung',
  'Save decision': 'Entscheidung speichern',
  'Delivery receipt': 'Lieferungsnachweis',
  'Refresh delivery': 'Lieferung aktualisieren',
  'Confirm takeover': 'Übernahme bestätigen',
  'Submit report': 'Meldung absenden',
  'Add issue photo': 'Foto des Mangels hinzufügen',
  'Remove photo': 'Foto entfernen',
  'View handover evidence': 'Übergabenachweis anzeigen',
  'Handover': 'Übergabe',
  'Handover completed': 'Übergabe abgeschlossen',
  'Receiving code': 'Empfangscode',
  'Show receiving code': 'Empfangscode anzeigen',
  'Barcode is required': 'Barcode ist erforderlich',
  'Camera permission is required': 'Kameraberechtigung ist erforderlich',
  'Permission required': 'Berechtigung erforderlich',
  'Failed to add photo': 'Foto konnte nicht hinzugefügt werden',
  'Seed & planting': 'Saatgut & Anbau',
  'Parcel': 'Parzelle',
  'Crop': 'Kultur',
  'Activity': 'Tätigkeit',
  'Instructions': 'Anleitung',
  'Photos': 'Fotos',
  'Location': 'Standort',
  'Open lot': 'Los öffnen',
  'Select a lot': 'Los auswählen',
  'View lots': 'Lose anzeigen',
  'Create lot from this harvest': 'Los aus dieser Ernte erstellen',
  'Saved on server': 'Auf dem Server gespeichert',
  'Awaiting sync': 'Synchronisation ausstehend',
  'Packing Flow': 'Verpackungsablauf',
  'Quality check': 'Qualitätsprüfung',
  'Record packing': 'Verpackung erfassen',
  'Request transport': 'Transport anfordern',
  'Open lot details': 'Losdetails öffnen',
  'Planting entry': 'Anbau-Eintrag',
  'Record planting': 'Anbau erfassen',
  'Scanned bags': 'Gescannte Säcke',
  'Verify serial': 'Seriennummer prüfen',
  'Genuine Bio Vera seed': 'Echtes Bio Vera-Saatgut',
  'Seed origin': 'Saatgutherkunft',
  'Seed producer portal': 'Saatgutproduzenten-Portal',
  'Open web portal': 'Webportal öffnen',
  'Partner sign-in': 'Partner-Anmeldung',
  'Sign in to manage your farm': 'Anmelden, um Ihren Betrieb zu verwalten',
  'Partner store': 'Partnergeschäft',
  'My store': 'Mein Geschäft',
  'Orders from growers': 'Bestellungen von Erzeugern',
  'Financial reconciliation': 'Finanzabgleich',
  'Returns and refunds': 'Rücksendungen und Erstattungen',
  'Returned goods disposition': 'Disposition zurückgegebener Ware',
  'For Growers': 'Für Erzeuger',
  'Apply as Producer': 'Als Erzeuger bewerben',
  'Become a Vera farmer': 'Bio Vera-Erzeuger werden',
  'From farm to shelf': 'Vom Betrieb bis ins Regal',
  'From farm': 'Vom Betrieb',
  'to shelf': 'bis ins Regal',
  'Getting started': 'Erste Schritte',
  'Become a Vera grower': 'Bio Vera-Erzeuger werden',
  '3 simple steps': '3 einfache Schritte',
  'Where to buy seeds': 'Wo Saatgut kaufen',
  'Shops near you': 'Geschäfte in Ihrer Nähe',
  'Mark your field': 'Parzelle markieren',
  'Add your parcels and crops': 'Parzellen und Kulturen hinzufügen',
  'Scan QR': 'QR scannen',
  'Take photo': 'Foto aufnehmen',
  'Photo added': 'Foto hinzugefügen',
  'Sign in first': 'Zuerst anmelden',
  'Add to My products': 'Zu Meine Produkte hinzufügen',
  'Turn on location': 'Standort aktivieren',
  'GPS recorded': 'GPS erfasst',
  'Could not save. Try again.': 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
  'Could not save. Check your connection and retry.': 'Speichern fehlgeschlagen. Verbindung prüfen und erneut versuchen.',
  'Load failed': 'Laden fehlgeschlagen',
  'Sent': 'Gesendet',
  'Log in as a grower to order.': 'Als Erzeuger anmelden, um zu bestellen.',
  'Confirm your email': 'E-Mail bestätigen',
  'Verify email': 'E-Mail verifizieren',
  'Verifying…': 'Wird verifiziert…',
  'Send a new code': 'Neuen Code senden',
  'Register as Buyer': 'Als Käufer registrieren',
  'Required Information': 'Pflichtangaben',
  'Optional Information': 'Optionale Angaben',
  'This field cannot be deleted': 'Diese Parzelle kann nicht gelöscht werden',
  'Started': 'Gestartet',
  'Syncing…': 'Synchronisierung…',
  'Open settings': 'Einstellungen öffnen',
  'No drivers yet — add a driver': 'Noch keine Fahrer — Fahrer hinzufügen',
  'Loading driver': 'Fahrer wird geladen',
};

const PROTECTED = [
  'Bio Vera', 'Vera', 'QR', 'GPS', 'EUR', 'Escrow', 'BUYER-', 'OK', 'API',
  'SETVA', 'PRSKANJE', 'BERBA', 'OBRADA', 'DJUBRENJE', 'biovera.app',
];

function protect(text) {
  const tokens = [];
  let out = text;
  for (const term of PROTECTED) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    out = out.replace(re, (m) => {
      const id = `__P${tokens.length}__`;
      tokens.push({ id, value: m });
      return id;
    });
  }
  out = out.replace(/\{\{[^}]+\}\}/g, (m) => {
    const id = `__PH${tokens.length}__`;
    tokens.push({ id, value: m });
    return id;
  });
  out = out.replace(/<\/?\d+>/g, (m) => {
    const id = `__T${tokens.length}__`;
    tokens.push({ id, value: m });
    return id;
  });
  return { out, tokens };
}

function restore(text, tokens) {
  let r = text;
  for (const { id, value } of tokens) r = r.split(id).join(value);
  return r;
}

function applyGlossary(text) {
  let out = text;
  const entries = Object.entries(GLOSSARY).sort((a, b) => b[0].length - a[0].length);
  for (const [en, de] of entries) {
    const re = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    out = out.replace(re, (m) => {
      if (m === m.toUpperCase()) return de.toUpperCase();
      if (m[0] === m[0].toUpperCase()) return de.charAt(0).toUpperCase() + de.slice(1);
      return de;
    });
  }
  return out;
}

function translateSegment(text) {
  if (PHRASES[text]) return PHRASES[text];
  let out = text;

  // Pattern-based rules
  const rules = [
    [/^Could not load (.+)\. Please try again\.$/, '„$1“ konnte nicht geladen werden. Bitte erneut versuchen.'],
    [/^Could not load (.+)\. Please retry\.$/, '$1 konnte nicht geladen werden. Bitte erneut versuchen.'],
    [/^Could not load (.+)\.$/, '$1 konnte nicht geladen werden.'],
    [/^Could not save\. Try again\.$/, 'Speichern fehlgeschlagen. Bitte erneut versuchen.'],
    [/^Could not save\. Check your connection and retry\.$/, 'Speichern fehlgeschlagen. Verbindung prüfen und erneut versuchen.'],
    [/^(.+) could not be loaded\. Please retry\.$/, '$1 konnte nicht geladen werden. Bitte erneut versuchen.'],
    [/^(.+) could not be loaded right now\.$/, '$1 konnte derzeit nicht geladen werden.'],
    [/^No (.+) yet$/, 'Noch keine $1'],
    [/^No (.+) available$/, 'Keine $1 verfügbar'],
    [/^Open (.+)$/, '$1 öffnen'],
    [/^View (.+)$/, '$1 anzeigen'],
    [/^Add (.+)$/, '$1 hinzufügen'],
    [/^Remove (.+)$/, '$1 entfernen'],
    [/^Select (.+)$/, '$1 auswählen'],
    [/^Choose (.+)$/, '$1 wählen'],
    [/^Enter (.+)$/, '$1 eingeben'],
    [/^Confirm (.+)$/, '$1 bestätigen'],
    [/^Save (.+)$/, '$1 speichern'],
    [/^Refresh (.+)$/, '$1 aktualisieren'],
    [/^Loading (.+)…$/, '$1 wird geladen…'],
    [/^(.+) is required$/, '$1 ist erforderlich'],
    [/^(.+) required$/, '$1 erforderlich'],
    [/^At least (\d+) characters$/, 'Mindestens $1 Zeichen'],
    [/^Step \{\{n\}\}$/, 'Schritt {{n}}'],
    [/^Step \{\{n\}\}\. $/, 'Schritt {{n}}. '],
  ];

  for (const [re, repl] of rules) {
    if (re.test(out)) {
      out = out.replace(re, repl);
      break;
    }
  }

  return applyGlossary(out);
}

export function translateEnToDe(text) {
  if (!text || typeof text !== 'string') return text;
  if (WEB_PHRASES[text]) return WEB_PHRASES[text];
  const { out: protectedText, tokens } = protect(text);
  if (PHRASES[protectedText]) return restore(PHRASES[protectedText], tokens);
  if (WEB_PHRASES[protectedText]) return restore(WEB_PHRASES[protectedText], tokens);

  // Split on newlines for multiline strings
  if (protectedText.includes('\n')) {
    const lines = protectedText.split('\n');
    const translated = lines.map((line) => translateSegment(line));
    return restore(translated.join('\n'), tokens);
  }

  return restore(translateSegment(protectedText), tokens);
}
