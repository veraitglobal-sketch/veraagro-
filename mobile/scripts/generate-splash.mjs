/**
 * Generates assets/splash.png — white background, centered "Bio Vera" in #2D5A27.
 * Run: npx -p sharp node scripts/generate-splash.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, '../assets/splash.png');
const logoPath = path.join(__dirname, '../assets/logo.png');

const W = 1284;
const H = 2778;
const bg = '#FFFFFF';
const textColor = '#2D5A27';

async function buildFromLogo() {
  const logo = sharp(logoPath);
  const meta = await logo.metadata();
  const maxW = Math.round(W * 0.55);
  const maxH = Math.round(H * 0.12);
  const scale = Math.min(maxW / (meta.width ?? maxW), maxH / (meta.height ?? maxH), 1);
  const lw = Math.round((meta.width ?? maxW) * scale);
  const lh = Math.round((meta.height ?? maxH) * scale);

  const resized = await logo.resize(lw, lh, { fit: 'inside' }).png().toBuffer();

  await sharp({
    create: { width: W, height: H, channels: 4, background: bg },
  })
    .composite([{ input: resized, top: Math.round((H - lh) / 2), left: Math.round((W - lw) / 2) }])
    .png()
    .toFile(out);

  console.log(`Created ${out} from logo (${lw}x${lh})`);
}

async function buildFromText() {
  const fontSize = 96;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
    font-size="${fontSize}" font-weight="300" letter-spacing="4" fill="${textColor}">Bio Vera</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`Created ${out} (text-based)`);
}

try {
  const fs = await import('fs');
  if (fs.existsSync(logoPath)) {
    await buildFromLogo();
  } else {
    await buildFromText();
  }
} catch (e) {
  console.warn('Logo composite failed, falling back to text:', e.message);
  await buildFromText();
}
