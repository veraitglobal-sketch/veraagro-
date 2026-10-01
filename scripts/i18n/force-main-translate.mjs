#!/usr/bin/env node
/** Force word-dict translation on remaining EN-identical strings in web main bundles. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translateEnToFr } from './en-to-fr-words.mjs';
import { translateEnToRo } from './en-to-ro-words.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const ALLOWLIST = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/i18n-same-as-en.json'), 'utf8'));

const MANUAL = {
  fr: {
    'Lots tab': 'Onglet lots',
    'Notifications and sign out.': 'Notifications et déconnexion.',
    'Responsibility for goods & sanctions': 'Responsabilité des marchandises et sanctions',
    'Honour timelines, commitments, food-safety guidance, and collaboration with Bio Vera.':
      'Respecter les délais, engagements, consignes de sécurité alimentaire et collaboration avec Bio Vera.',
    'Short-term plan': 'Plan à court terme',
    'Near-term priorities and milestones.': 'Priorités et jalons à court terme.',
    'Medium-term plan': 'Plan à moyen terme',
    'Long-term plan': 'Plan à long terme',
    'Unlock': 'Déverrouiller',
    'Hide link': 'Masquer le lien',
    'Binding figures and annexes remain in your signed agreements.':
      'Les chiffres contraignants et annexes restent dans vos accords signés.',
    'Certificates & proof': 'Certificats et preuves',
    'Lots & transport': 'Lots et transport',
    'Also': 'Également',
    'Education & video guides': 'Formation et guides vidéo',
    '5. Request transport': '5. Demander un transport',
    'After transport:': 'Après le transport :',
    'Pickup location *': 'Lieu de collecte *',
    'Getting GPS…': 'Obtention du GPS…',
    'Store website': 'Site web du magasin',
    'Producers': 'Producteurs',
    'Bag #': 'Sac n°',
    'Holder': 'Titulaire',
    'Production date': 'Date de production',
    'Germination %': 'Germination %',
    'Certificate URLs (one per line)': 'URL des certificats (une par ligne)',
    'Plant protection': 'Protection des plantes',
    'Variety': 'Variété',
    'Honour timelines, commitments, food-safety guidance, and cold-chain rules':
      'Respecter les délais, engagements, consignes de sécurité alimentaire et règles de chaîne du froid',
    'Binding figures and annexes remain in your signed agreements; this layout is for clarity only.':
      'Les chiffres contraignants et annexes restent dans vos accords signés ; cette présentation vise la clarté uniquement.',
    'Config base URL (see Network tab for the real URL): {{base}}':
      'URL de base configurée (voir l’onglet Réseau pour l’URL réelle) : {{base}}',
    ' ({{code}})': ' ({{code}})',
    'Ref: {{id}}': 'Réf. : {{id}}',
    'SKU {{sku}}': 'SKU {{sku}}',
    'Request: {{snippet}}': 'Demande : {{snippet}}',
    '{{count}} bag(s) planted': '{{count}} sac(s) semé(s)',
    'Storage (opened bag)': 'Stockage (sac ouvert)',
    'Missions & transport dispatch': 'Missions et dispatch transport',
    'Non-compliant audit': 'Audit non conforme',
    'Trust score (accounts with a record)': 'Score de confiance (comptes avec historique)',
    'Use this UUID in API filters, database joins, or support tickets.':
      'Utilisez cet UUID dans les filtres API, jointures base de données ou tickets support.',
    'Street & number *': 'Rue et numéro *',
    'City *': 'Ville *',
    'Country *': 'Pays *',
    'Set destination': 'Définir la destination',
    'Mission {{missionNumber}} — {{product}}': 'Mission {{missionNumber}} — {{product}}',
    'Logistics partner *': 'Partenaire logistique *',
    'New logistics partner *': 'Nouveau partenaire logistique *',
    'Reason *': 'Motif *',
    'Mission reassigned.': 'Mission réassignée.',
    '{{count}} × {{label}}': '{{count}} × {{label}}',
    'Total expected (kg)': 'Total prévu (kg)',
    'Unallocated (kg)': 'Non alloué (kg)',
    'Max {{count}} packs': 'Max {{count}} colis',
    'Pack options': 'Options de colisage',
    'Only JPG, PNG or WebP are allowed.': 'Seuls JPG, PNG ou WebP sont autorisés.',
    'Only JPG, PNG or WebP.': 'JPG, PNG ou WebP uniquement.',
    'Minimum 1, maximum 6 images — JPG, PNG or WebP.':
      'Minimum 1, maximum 6 images — JPG, PNG ou WebP.',
    'Reporting deadline: {{time}}': 'Date limite de signalement : {{time}}',
    'Typical: refrigerated van': 'Typique : fourgon frigorifique',
    'Inside truck temperature (°C) *': 'Température dans le camion (°C) *',
    'Inside the truck *': 'Intérieur du camion *',
    'Partner / ID badge photo *': 'Photo badge partenaire / ID *',
    'Max 5MB per photo.': 'Max 5 Mo par photo.',
    'Max {{max}} photos per group.': 'Max {{max}} photos par groupe.',
    'Route assist (est.): {{distance}}{{durationPart}}':
      'Assistance itinéraire (est.) : {{distance}}{{durationPart}}',
    'Notes: {{value}}': 'Notes : {{value}}',
    'Notes: {{value}}…': 'Notes : {{value}}…',
    'To ·': 'Vers ·',
    'Mission #{{num}}': 'Mission n°{{num}}',
    'Due {{date}}': 'Échéance {{date}}',
    'Become a BioVera Fresh Partner': 'Devenir partenaire BioVera Fresh',
    'Opening context': 'Contexte d’ouverture',
    'In plain words': 'En termes simples',
    'Outcomes we’re optimising for': 'Résultats visés',
    'Embed your pitch video here': 'Intégrez votre vidéo de pitch ici',
    'The vertical loop end-to-end': 'La boucle verticale de bout en bout',
    'Shoppers swipe QR; finance honours the choreography':
      'Les clients scannent le QR ; la finance respecte la chorégraphie',
  },
  ro: {
    'Lots tab': 'Filă loturi',
    'Notifications and sign out.': 'Notificări și deconectare.',
    'Responsibility for goods & sanctions': 'Responsabilitate pentru mărfuri și sancțiuni',
    'Short-term plan': 'Plan pe termen scurt',
    'Medium-term plan': 'Plan pe termen mediu',
    'Long-term plan': 'Plan pe termen lung',
    'Unlock': 'Deblochează',
    'Hide link': 'Ascunde linkul',
    'Certificates & proof': 'Certificate și dovezi',
    'Lots & transport': 'Loturi și transport',
    'Education & video guides': 'Educație și ghiduri video',
    '5. Request transport': '5. Solicită transport',
    'Pickup location *': 'Loc de ridicare *',
    'Getting GPS…': 'Se obține GPS…',
    'Store website': 'Site magazin',
    'Producers': 'Producători',
    'Bag #': 'Sac nr.',
    'Holder': 'Deținător',
    'Plant protection': 'Protecția plantelor',
    'Variety': 'Soi',
  },
};

function isAllowlisted(key, value) {
  if (ALLOWLIST.keys?.includes(key)) return true;
  if ((value?.length ?? 0) < (ALLOWLIST.minLength ?? 3)) return true;
  for (const pattern of ALLOWLIST.patterns ?? []) {
    try {
      if (new RegExp(pattern, 'i').test(key) || new RegExp(pattern, 'i').test(value)) return true;
    } catch {
      if (value?.includes(pattern)) return true;
    }
  }
  return false;
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => Object.assign(out, flatten(item, `${key}.${i}`)));
    } else if (v && typeof v === 'object') {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

function unflatten(flat) {
  const root = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      const next = parts[i + 1];
      if (/^\d+$/.test(next)) {
        if (!Array.isArray(cur[p])) cur[p] = [];
      } else if (!cur[p] || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
        cur[p] = {};
      }
      cur = cur[p];
    }
    const last = parts[parts.length - 1];
    const parentKey = parts[parts.length - 2];
    if (/^\d+$/.test(last) && parentKey !== undefined) {
      const idx = Number(last);
      const arrKey = parts[parts.length - 2];
      let arrParent = root;
      for (let i = 0; i < parts.length - 2; i++) {
        arrParent = arrParent[parts[i]];
      }
      if (!Array.isArray(arrParent[arrKey])) arrParent[arrKey] = [];
      arrParent[arrKey][idx] = value;
    } else {
      cur[last] = value;
    }
  }
  return root;
}

function applyLang(lang, translateFn) {
  const enPath = path.join(ROOT, 'web/locales/en.json');
  const tgtPath = path.join(ROOT, 'web/locales', `${lang}.json`);
  const enFlat = flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')));
  const tgt = JSON.parse(fs.readFileSync(tgtPath, 'utf8'));
  const tgtFlat = flatten(tgt);
  let changed = 0;
  for (const [key, enVal] of Object.entries(enFlat)) {
    if (!(key in tgtFlat)) continue;
    if (tgtFlat[key] !== enVal || isAllowlisted(key, enVal)) continue;
    const manual = MANUAL[lang]?.[enVal];
    const translated = manual ?? translateFn(enVal);
    if (translated && translated !== enVal) {
      tgtFlat[key] = translated;
      changed++;
    }
  }
  fs.writeFileSync(tgtPath, `${JSON.stringify(JSON.parse(JSON.stringify(unflatten(tgtFlat))), null, 2)}\n`);
  console.log(`${lang}.json: forced ${changed} translations`);
}

// Safer: walk and patch in place
function applyLangWalk(lang, translateFn) {
  const enPath = path.join(ROOT, 'web/locales/en.json');
  const tgtPath = path.join(ROOT, 'web/locales', `${lang}.json`);
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const tgt = JSON.parse(fs.readFileSync(tgtPath, 'utf8'));
  let changed = 0;

  function walk(enNode, tgtNode, keyPath) {
    if (Array.isArray(enNode)) {
      return enNode.map((v, i) => walk(v, tgtNode?.[i], `${keyPath}.${i}`));
    }
    if (enNode && typeof enNode === 'object') {
      const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
      for (const [k, v] of Object.entries(enNode)) {
        out[k] = walk(v, out[k], keyPath ? `${keyPath}.${k}` : k);
      }
      return out;
    }
    if (typeof enNode !== 'string') return tgtNode;
    const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
    if (tgtStr !== enNode || isAllowlisted(keyPath, enNode)) return tgtStr;
    const manual = MANUAL[lang]?.[enNode];
    const translated = manual ?? translateFn(enNode);
    if (translated && translated !== enNode) {
      changed++;
      return translated;
    }
    return tgtStr;
  }

  const merged = walk(en, tgt, '');
  fs.writeFileSync(tgtPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`${lang}.json: forced ${changed} translations`);
}

applyLangWalk('fr', translateEnToFr);
applyLangWalk('ro', translateEnToRo);
