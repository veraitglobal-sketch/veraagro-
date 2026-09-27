#!/usr/bin/env node
/**
 * Bio Vera public SEO acceptance gate (spec 2026-09-13, 7-locale golden).
 * Usage: node scripts/seo-acceptance-check.mjs [baseUrl]
 * Example: SEO_BASE_URL=https://www.biovera.app node scripts/seo-acceptance-check.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const base = (process.env.SEO_BASE_URL || process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const isProd = base.includes('biovera.app');
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/golden');

const failures = [];
const passes = [];

function pass(msg) {
  passes.push(msg);
}

function fail(msg) {
  failures.push(msg);
}

async function fetchText(path, opts = {}) {
  const res = await fetch(`${base}${path}`, { redirect: 'follow', ...opts });
  const text = await res.text();
  return { res, text };
}

function wordCount(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

function hasH1(html) {
  return /<h1[\s>]/i.test(html);
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
}

function readGolden(name) {
  return readFileSync(join(fixturesDir, name), 'utf8');
}

function compareGolden(name, liveLocs) {
  try {
    const goldenLocs = extractLocs(readGolden(name));
    const liveSorted = [...liveLocs].sort();
    if (JSON.stringify(goldenLocs) === JSON.stringify(liveSorted)) {
      pass(`${name} matches golden (${liveLocs.length} URLs)`);
      return true;
    }
    fail(`${name} drift (live ${liveLocs.length}, golden ${goldenLocs.length})`);
    return false;
  } catch {
    fail(`could not read fixtures/golden/${name}`);
    return false;
  }
}

const HREFLANG_CODES = ['en', 'de', 'sr', 'bg', 'ro', 'fr', 'es', 'x-default'];

function hasSevenHreflang(html) {
  return HREFLANG_CODES.every((code) =>
    new RegExp(`hreflang="${code}"`, 'i').test(html),
  );
}

async function main() {
  console.log(`SEO acceptance check → ${base}\n`);

  const { text: robots } = await fetchText('/robots.txt');
  if (robots.includes('Sitemap: https://www.biovera.app/sitemap.xml') || (!isProd && robots.includes('Sitemap:'))) {
    pass('robots.txt declares sitemap');
  } else {
    fail('robots.txt missing www sitemap line');
  }
  if (!robots.includes('Disallow: /sr')) {
    pass('robots.txt does not block /sr');
  } else {
    fail('robots.txt blocks /sr');
  }

  const { text: sitemapIndex } = await fetchText('/sitemap.xml');
  const indexLocs = extractLocs(sitemapIndex);
  if (sitemapIndex.includes('<sitemapindex')) {
    pass('sitemap.xml is a sitemap index');
  } else {
    fail('sitemap.xml is not a sitemap index');
  }
  if (
    indexLocs.includes(`${isProd ? 'https://www.biovera.app' : base}/sitemap-pages.xml`) &&
    indexLocs.includes(`${isProd ? 'https://www.biovera.app' : base}/sitemap-guides.xml`)
  ) {
    pass('sitemap index lists pages + guides child sitemaps');
  } else if (!isProd && indexLocs.length === 2) {
    pass('sitemap index has two child sitemaps (dev)');
  } else {
    fail(`sitemap index child locs unexpected: ${indexLocs.join(', ')}`);
  }

  const { text: pagesXml } = await fetchText('/sitemap-pages.xml');
  const { text: guidesXml } = await fetchText('/sitemap-guides.xml');
  const pagesLocs = extractLocs(pagesXml);
  const guidesLocs = extractLocs(guidesXml);
  const allLocs = [...pagesLocs, ...guidesLocs];

  if (isProd && allLocs.every((u) => u.startsWith('https://www.biovera.app/'))) {
    pass('all sitemap locs use www');
  } else if (!isProd) {
    pass(`sitemap loc counts pages=${pagesLocs.length} guides=${guidesLocs.length} (dev)`);
  } else {
    fail('sitemap contains non-www loc');
  }

  compareGolden('sitemap-pages.golden.xml', pagesLocs);
  compareGolden('sitemap-guides.golden.xml', guidesLocs);
  compareGolden('sitemap.maximum.golden.xml', allLocs);

  if (isProd) {
    const apex = await fetch('https://biovera.app/en/faq', { redirect: 'manual' });
    if ([301, 308].includes(apex.status)) {
      pass('apex → redirect');
    } else {
      fail(`apex redirect status ${apex.status}`);
    }
  }

  const tier1Paths = [
    '/sr',
    '/de',
    '/sr/for-growers',
    '/de/for-growers',
    '/sr/faq',
    '/sr/protocol-360',
  ];
  const { text: enHome } = await fetchText('/en');
  const enWords = wordCount(enHome);

  for (const path of tier1Paths) {
    const { res, text } = await fetchText(path);
    if (res.status !== 200) {
      fail(`${path} returned ${res.status}`);
      continue;
    }
    if (!hasH1(text)) {
      fail(`${path} missing H1`);
    } else {
      pass(`${path} has H1`);
    }
    const words = wordCount(text);
    const ratio = enWords > 0 ? words / enWords : 0;
    if ((path === '/sr' || path === '/de') && ratio >= 0.4) {
      pass(`${path} word count ≥40% of /en (${words}/${enWords})`);
    } else if (path !== '/sr' && path !== '/de' && words >= 80) {
      pass(`${path} substantive SSR (${words} words)`);
    } else if (path === '/sr' || path === '/de') {
      fail(`${path} word ratio too low (${words}/${enWords})`);
    }
  }

  const { text: faq } = await fetchText('/en/faq');
  if (/marketplace|vertically integrated/i.test(faq)) {
    pass('FAQ entity copy in HTML');
  } else {
    fail('FAQ missing entity copy in HTML');
  }

  const protoHead = await fetch(`${base}/en/protocol-360`, { redirect: 'follow' });
  if (protoHead.status === 200) {
    pass('/en/protocol-360 returns 200');
  } else {
    fail(`/en/protocol-360 status ${protoHead.status}`);
  }

  const legacyProto = await fetch(`${base}/protocol-360`, { redirect: 'manual' });
  if ([301, 308, 307].includes(legacyProto.status)) {
    pass('/protocol-360 redirects');
  } else {
    fail(`/protocol-360 status ${legacyProto.status}`);
  }

  const { text: growersDe } = await fetchText('/de/for-growers');
  const canonicalOk =
    /rel="canonical"[^>]+www\.biovera\.app\/de\/for-growers/i.test(growersDe) ||
    /href="https:\/\/www\.biovera\.app\/de\/for-growers"/i.test(growersDe);
  if (canonicalOk) {
    pass('de/for-growers canonical www + /de');
  } else if (!isProd && /rel="canonical"/i.test(growersDe)) {
    pass('de/for-growers has canonical (dev)');
  } else {
    fail('de/for-growers canonical missing or wrong');
  }
  if (hasSevenHreflang(growersDe)) {
    pass('de/for-growers has 7-locale hreflang cluster');
  } else {
    fail('de/for-growers missing one or more hreflang alternates');
  }

  const { text: llms } = await fetchText('/llms.txt');
  if (/www\.biovera\.app/i.test(llms) && /not a marketplace|nismo marketplace/i.test(llms)) {
    pass('llms.txt www + not-marketplace');
  } else {
    fail('llms.txt incomplete');
  }

  console.log(`\n✓ ${passes.length} passed`);
  for (const p of passes) console.log(`  · ${p}`);
  if (failures.length) {
    console.log(`\n✗ ${failures.length} failed`);
    for (const f of failures) console.log(`  · ${f}`);
    process.exit(1);
  }
  console.log('\nAll SEO acceptance checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
