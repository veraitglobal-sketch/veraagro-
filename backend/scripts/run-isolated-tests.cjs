// Own a disposable PostgreSQL cluster. Never use the application's DATABASE_URL.
const { mkdtempSync, rmSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const net = require('node:net');

const root = path.resolve(__dirname, '..');
const migrationCheck = process.argv.includes('--migrations');
const browserCheck = process.argv.includes('--browser');
const mobileApi = process.argv.includes('--mobile-api');
const passportCheck = process.argv.includes('--passport');
const harvestCheck = process.argv.includes('--harvest');
const probe = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' });
const pgBin = process.env.PG_BIN || (probe.status === 0 ? probe.stdout.trim() : '');
const pg = (name) => pgBin ? path.join(pgBin, name) : name;
function resolvePgShare() {
  if (process.env.PG_SHARE && existsSync(path.join(process.env.PG_SHARE, 'postgres.bki'))) {
    return process.env.PG_SHARE;
  }
  const sharedir = spawnSync('pg_config', ['--sharedir'], { encoding: 'utf8' });
  if (sharedir.status === 0) {
    const dir = sharedir.stdout.trim();
    if (existsSync(path.join(dir, 'postgres.bki'))) return dir;
  }
  if (pgBin) {
    const cellar = path.join(pgBin, '..', 'share', 'postgresql');
    if (existsSync(path.join(cellar, 'postgres.bki'))) return cellar;
  }
  return '';
}
const pgShare = resolvePgShare();
let directory;
let started = false;

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} exited with status ${result.status}`);
}

async function main() {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const selected = server.address().port;
      server.close(() => resolve(selected));
    });
  });
  directory = mkdtempSync(path.join(tmpdir(), 'biovera-test-'));
  const data = path.join(directory, 'data');
  const initdbArgs = ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-locale', '-E', 'UTF8', ...(pgShare ? ['-L', pgShare] : [])];
  const init = spawnSync(pg('initdb'), initdbArgs, { cwd: root, env: process.env, encoding: 'utf8' });
  if (init.status !== 0) {
    const hint = pgShare
      ? 'Homebrew PostgreSQL share path may be broken; recreate biovera_test on 127.0.0.1:5432 and run jest with BIOVERA_TEST_DATABASE_URL.'
      : 'Install PostgreSQL client tools (initdb/pg_ctl) or point PG_BIN at your PostgreSQL bin directory.';
    throw new Error(`${init.stderr?.trim() || 'initdb failed'}\n${hint}`);
  }
  run(pg('pg_ctl'), ['-D', data, '-l', path.join(directory, 'postgres.log'), '-o', `-F -h 127.0.0.1 -p ${port} -k ${directory}`, '-w', 'start']);
  started = true;
  run(pg('createdb'), ['-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', 'biovera_test']);
  const testUrl = `postgresql://postgres@127.0.0.1:${port}/biovera_test?schema=public`;
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: testUrl,
    BIOVERA_TEST_DATABASE_URL: testUrl,
    JWT_SECRET: 'isolated-integration-test-secret',
    BIOVERA_BROWSER_TEST: browserCheck ? '1' : '0',
  };
  const prisma = path.join(root, 'node_modules/prisma/build/index.js');
  run(process.execPath, [path.join(root, 'scripts/deploy-migrations.cjs')], env);
  run(process.execPath, [prisma, 'migrate', 'diff', '--from-url', testUrl, '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], env);
  if (mobileApi) {
    run(process.execPath, ['-r', 'ts-node/register', path.join(root, 'test/mobile-fixture.ts')], env);
  } else if (browserCheck) {
    run(process.execPath, [path.join(root, 'node_modules/jest/bin/jest.js'), '--config', 'test/jest-integration.json', '--runInBand', '--testPathPattern', 'orders.integration-spec', '--testNamePattern', 'browser checkout'], env);
  } else if (passportCheck) {
    run(process.execPath, [path.join(root, 'node_modules/jest/bin/jest.js'), '--config', 'test/jest-integration.json', '--runInBand', '--testPathPattern', 'passport.integration-spec'], env);
  } else if (harvestCheck) {
    run(process.execPath, [path.join(root, 'node_modules/jest/bin/jest.js'), '--config', 'test/jest-integration.json', '--runInBand', '--testPathPattern', 'harvest-workflow.integration-spec'], env);
  } else if (migrationCheck) {
    run(process.execPath, [path.join(root, 'node_modules/jest/bin/jest.js'), '--config', 'test/jest-integration.json', '--runInBand', '--testPathPattern', 'bootstrap.integration-spec'], env);
  } else {
    run(process.execPath, [path.join(root, 'node_modules/jest/bin/jest.js'), '--config', 'test/jest-integration.json', '--runInBand'], env);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => {
  if (!directory) return;
  if (started) {
    const stopped = spawnSync(pg('pg_ctl'), ['-D', path.join(directory, 'data'), '-m', 'immediate', '-w', 'stop'], { stdio: 'inherit' });
    if (stopped.status !== 0) {
      console.error(`Could not stop test PostgreSQL. Retaining its directory: ${directory}`);
      process.exitCode = 1;
      return;
    }
  }
  rmSync(directory, { recursive: true, force: true });
});
