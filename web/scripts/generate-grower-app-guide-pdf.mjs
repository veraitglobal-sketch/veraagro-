#!/usr/bin/env node
/**
 * One-shot PDF export for the grower mobile app guide.
 *
 * Uses ?pdf=1 so all 9 screenshots load eagerly, scrolls the page, waits for
 * every image, then writes static files to public/docs/grower-app-guide/.
 *
 * Manual alternative (same result):
 *   1. Open https://www.biovera.app/sr/grower/mobile-app-guide?pdf=1
 *   2. Scroll to the bottom, wait until all phone screens appear
 *   3. Print → Save as PDF → biovera-grower-app-guide.sr.pdf
 *   4. Copy into web/public/docs/grower-app-guide/ and commit
 *
 * Usage:
 *   GUIDE_BASE=https://www.biovera.app npm run generate:app-guide-pdf
 *   GUIDE_BASE=http://localhost:3000 npm run generate:app-guide-pdf   # needs npm run dev
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/docs/grower-app-guide');
const BASE = (process.env.GUIDE_BASE ?? 'http://localhost:3000').replace(/\/$/, '');
const LOCALES = (process.env.GUIDE_LOCALES ?? 'sr,en').split(',').map((s) => s.trim());
const EXPECTED_IMAGES = Number(process.env.GUIDE_IMAGE_COUNT ?? '9');

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.max(300, Math.floor(window.innerHeight * 0.85));
    let y = 0;
    const max = document.body.scrollHeight;
    while (y < max) {
      window.scrollTo(0, y);
      await delay(120);
      y += step;
    }
    window.scrollTo(0, 0);
    await delay(200);
  });
}

async function waitForAllScreenshots(page) {
  await scrollThrough(page);
  await page.waitForFunction(
    (expected) => {
      const imgs = [...document.querySelectorAll('img.grower-app-guide-screenshot')];
      if (imgs.length < expected) return false;
      return imgs.every((img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
    },
    EXPECTED_IMAGES,
    { timeout: 180_000, polling: 250 },
  );
  const stats = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img.grower-app-guide-screenshot')];
    return imgs.map((img) => ({
      src: img.getAttribute('src') ?? '',
      w: img.naturalWidth,
      h: img.naturalHeight,
    }));
  });
  console.log(`  ✓ ${stats.length} screenshots loaded`);
  for (const s of stats) {
    console.log(`    · ${s.src.split('/').pop()} ${s.w}x${s.h}`);
  }
}

async function generateOne(browser, locale) {
  const url = `${BASE}/${locale}/grower/mobile-app-guide?pdf=1`;
  const outFile =
    locale === 'en' ? 'biovera-grower-app-guide.en.pdf' : 'biovera-grower-app-guide.sr.pdf';
  const outPath = path.join(OUT_DIR, outFile);

  console.log(`→ ${url}`);
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForAllScreenshots(page);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
  });
  await page.close();
  console.log(`  ✓ saved ${outPath}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const locale of LOCALES) {
      await generateOne(browser, locale);
    }
  } finally {
    await browser.close();
  }
  console.log('\nDone. Commit PDF(s) in public/docs/grower-app-guide/ and deploy.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
