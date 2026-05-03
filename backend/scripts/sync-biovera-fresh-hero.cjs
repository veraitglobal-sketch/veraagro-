/**
 * Copies BioVera Fresh prospect hero from web/public into src/biovera-fresh/assets
 * so Nest copies it to dist/ (see nest-cli.json). Keeps one source file for web + PDF API.
 */
const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '..');
const webPublic = path.join(backendRoot, '..', 'web', 'public');
const targetDir = path.join(backendRoot, 'src', 'biovera-fresh', 'assets');
const names = [
  'biovera-fresh-prospect-hero.jpg',
  'biovera-fresh-prospect-hero.jpeg',
  'biovera-fresh-prospect-hero.png',
];

fs.mkdirSync(targetDir, { recursive: true });

let copied = false;
for (const n of names) {
  const src = path.join(webPublic, n);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(targetDir, n));
    copied = true;
    // eslint-disable-next-line no-console
    console.log('[sync-biovera-fresh-hero] copied', n, '→ src/biovera-fresh/assets/');
    break;
  }
}

if (!copied) {
  // eslint-disable-next-line no-console
  console.log(
    '[sync-biovera-fresh-hero] no hero in ../web/public (jpg/jpeg/png); PDF API will fall back to public dirs or skip hero',
  );
}
