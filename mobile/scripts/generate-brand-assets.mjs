/**
 * App icon (green + white wordmark), adaptive icon, and splash.
 * Run: npm run assets:brand
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const sharp = (await import('sharp')).default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../assets');
const logoDarkPath = path.join(assetsDir, 'logo.png');
const logoWhitePath = path.join(assetsDir, 'logo-white.png');

/** Bio Vera primary — app icon background. */
const ICON_BG = '#2D5A27';
/** Enterprise canvas — splash screen. */
const SPLASH_BG = '#f6f5f1';
const ICON_SIZE = 1024;
const SPLASH_W = 1284;
const SPLASH_H = 2778;

async function resizeLogo(logoPath, maxWidth) {
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Missing wordmark at ${logoPath}`);
  }
  const meta = await sharp(logoPath).metadata();
  const srcW = meta.width ?? maxWidth;
  const srcH = meta.height ?? Math.round(maxWidth * 0.28);
  const scale = maxWidth / srcW;
  const lw = maxWidth;
  const lh = Math.round(srcH * scale);
  const buf = await sharp(logoPath).resize(lw, lh, { fit: 'inside' }).png().toBuffer();
  return { buf, lw, lh };
}

/** iOS / store icon — solid green tile + white wordmark. */
async function writeAppIcon(outName, logoWidthRatio) {
  const targetW = Math.round(ICON_SIZE * logoWidthRatio);
  const { buf, lw, lh } = await resizeLogo(logoWhitePath, targetW);
  const out = path.join(assetsDir, outName);
  await sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: ICON_BG },
  })
    .composite([{ input: buf, top: Math.round((ICON_SIZE - lh) / 2), left: Math.round((ICON_SIZE - lw) / 2) }])
    .png()
    .toFile(out);
  console.log(`✓ ${outName} (${ICON_SIZE}×${ICON_SIZE}, green + white logo ${lw}×${lh})`);
}

/**
 * Android adaptive foreground — white logo on transparent (system applies green bg).
 */
async function writeAdaptiveIcon() {
  const targetW = Math.round(ICON_SIZE * 0.52);
  const { buf, lw, lh } = await resizeLogo(logoWhitePath, targetW);
  const out = path.join(assetsDir, 'adaptive-icon.png');
  await sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: buf, top: Math.round((ICON_SIZE - lh) / 2), left: Math.round((ICON_SIZE - lw) / 2) }])
    .png()
    .toFile(out);
  console.log(`✓ adaptive-icon.png (transparent + white logo ${lw}×${lh})`);
}

async function writeSplash() {
  const targetW = Math.round(SPLASH_W * 0.58);
  const { buf, lw, lh } = await resizeLogo(logoDarkPath, targetW);
  const out = path.join(assetsDir, 'splash.png');
  await sharp({
    create: { width: SPLASH_W, height: SPLASH_H, channels: 4, background: SPLASH_BG },
  })
    .composite([{ input: buf, top: Math.round((SPLASH_H - lh) / 2), left: Math.round((SPLASH_W - lw) / 2) }])
    .png()
    .toFile(out);
  console.log(`✓ splash.png (${SPLASH_W}×${SPLASH_H}, canvas + dark wordmark)`);
}

async function main() {
  await writeAppIcon('icon.png', 0.68);
  await writeAdaptiveIcon();
  await writeSplash();
  console.log('Brand assets OK — icon: #2D5A27 + white logo');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
