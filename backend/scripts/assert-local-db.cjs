#!/usr/bin/env node
/**
 * Refuses to run when DATABASE_URL points at a non-local host unless:
 * - ALLOW_REMOTE_DB=1 (explicit override), or
 * - the process runs inside Railway (production start must migrate remote Postgres).
 * Use: node scripts/assert-local-db.cjs && …
 */
const url = process.env.DATABASE_URL || '';
if (process.env.ALLOW_REMOTE_DB === '1') {
  process.exit(0);
}
/** Railway injects these at runtime; local laptops must not use production DATABASE_URL. */
if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
  process.exit(0);
}
if (!url.trim()) {
  console.error('[assert-local-db] DATABASE_URL is not set.');
  process.exit(1);
}
let host = '';
try {
  host = new URL(url).hostname.toLowerCase();
} catch {
  console.error('[assert-local-db] DATABASE_URL is not a valid URL.');
  process.exit(1);
}
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (!localHosts.has(host)) {
  console.error(
    `[assert-local-db] Refusing to run against non-local host "${host}".\n` +
      '  Set DATABASE_URL to your local Postgres (e.g. postgresql://user@localhost:5432/biovera_db)\n' +
      '  or set ALLOW_REMOTE_DB=1 to override (production — use with extreme care).',
  );
  process.exit(1);
}
