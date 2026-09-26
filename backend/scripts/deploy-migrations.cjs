const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { bootstrapEmptyDatabase } = require('./bootstrap-empty-db.cjs');

async function main() {
  const created = await bootstrapEmptyDatabase({ ifEmpty: true });
  if (created) console.log('Empty database initialized; applying migrations added after the snapshot.');
  const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
