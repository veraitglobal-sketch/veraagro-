#!/usr/bin/env node
/**
 * Sync about-lead + faq-entity markdown from content/ai-trust into locale JSON.
 * Run after updating pack files: node scripts/sync-ai-trust-pack.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'content/ai-trust');
const localesDir = join(root, 'locales');

const LOCALES = ['en', 'de', 'sr', 'bg', 'ro', 'fr', 'es'];

function parseAboutLead(md) {
  const title = md.match(/\*\*Title:\*\*\s*(.+)/)?.[1]?.trim() ?? '';
  const metaDescription = md.match(/\*\*Meta description:\*\*\s*(.+)/)?.[1]?.trim() ?? '';
  const heroTitle = md.match(/\*\*H1:\*\*\s*(.+)/)?.[1]?.trim() ?? '';
  const bodyStart = md.indexOf('## Body');
  const body = bodyStart >= 0 ? md.slice(bodyStart) : md;
  const paragraphs = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('## CTA') && !l.startsWith('http'))
    .filter((l) => !l.startsWith('**'));
  return { title, metaDescription, heroTitle, paragraphs };
}

function parseFaqEntity(md) {
  const sections = md.split(/^## /m).slice(1);
  return sections.map((block) => {
    const [heading, ...rest] = block.split('\n');
    const q = heading.trim().replace(/\?$/, '') + '?';
    const a = rest
      .join('\n')
      .trim()
      .split('\n')
      .filter((l) => l.trim())
      .join(' ')
      .trim();
    return { q, a };
  });
}

function upsertFaqItems(items, entityFaqs) {
  const next = [...items];
  for (const { q, a } of entityFaqs) {
    const idx = next.findIndex((item) => item.q.toLowerCase() === q.toLowerCase());
    const row = { category: 'general', q, a };
    if (idx >= 0) {
      next[idx] = { ...next[idx], ...row };
    } else {
      next.unshift(row);
    }
  }
  return next;
}

for (const locale of LOCALES) {
  const aboutPath = join(contentDir, 'about', `about-lead.${locale}.md`);
  const faqPath = join(contentDir, 'faq', `faq-entity.${locale}.md`);
  const localePath = join(localesDir, `${locale}.json`);

  const about = parseAboutLead(readFileSync(aboutPath, 'utf8'));
  const entityFaqs = parseFaqEntity(readFileSync(faqPath, 'utf8'));
  const bundle = JSON.parse(readFileSync(localePath, 'utf8'));

  if (!bundle.aboutPage) bundle.aboutPage = {};
  bundle.aboutPage.metaTitle = about.title.replace(/\s*\|\s*Bio Vera\s*$/i, '').includes('Bio Vera')
    ? about.title.replace(/\s*\|\s*Bio Vera\s*$/i, '').trim()
    : about.title.replace(/\s*\|\s*Bio Vera\s*$/i, '').trim();
  bundle.aboutPage.metaDescription = about.metaDescription;
  bundle.aboutPage.heroTitle = about.heroTitle;
  if (about.paragraphs[0]) bundle.aboutPage.heroSubtitle = about.paragraphs[0];
  if (about.paragraphs[1]) bundle.aboutPage.missionP1 = about.paragraphs[1];
  if (about.paragraphs[2]) bundle.aboutPage.missionP2 = about.paragraphs[2];
  if (about.paragraphs[3]) bundle.aboutPage.visionP1 = about.paragraphs[3];
  if (about.paragraphs[4]) bundle.aboutPage.visionP2 = about.paragraphs[4];
  if (about.paragraphs[5]) bundle.aboutPage.ctaBody = about.paragraphs[5];

  if (!bundle.faqPage) bundle.faqPage = { items: [] };
  if (!Array.isArray(bundle.faqPage.items)) bundle.faqPage.items = [];
  bundle.faqPage.items = upsertFaqItems(bundle.faqPage.items, entityFaqs);

  writeFileSync(localePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  console.log(`Synced ${locale}: about (${about.paragraphs.length} paras), faq (${entityFaqs.length} entity Q&A)`);
}
