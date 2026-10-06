'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');

function loadShared(relativePath) {
  const filename = path.resolve(__dirname, '../../shared', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', source)(mod.exports, mod);
  return mod.exports;
}

const {
  parsePassportScanInput,
  extractBadgeSerialFromScan,
  passportUrlWithBadge,
} = loadShared('passport/scan-input.ts');

test('badge QR URL resolves to badge serial for publicResolve flow', () => {
  const scan = 'https://api.biovera.app/public/badges/PLT-ABC-001';
  assert.equal(extractBadgeSerialFromScan(scan), 'PLT-ABC-001');
  assert.deepEqual(parsePassportScanInput(scan), { kind: 'badge', badgeSerial: 'PLT-ABC-001' });
});

test('passport URL with badge query preserves batch and serial', () => {
  const scan = 'https://www.biovera.app/passport/BATCH-2026-0001?badge=PLT-ABC-001';
  assert.deepEqual(parsePassportScanInput(scan), {
    kind: 'passport',
    batchId: 'BATCH-2026-0001',
    badgeSerial: 'PLT-ABC-001',
  });
});

test('lot-only passport URL has no badge serial', () => {
  const scan = 'https://www.biovera.app/passport/BATCH-2026-0001';
  assert.deepEqual(parsePassportScanInput(scan), {
    kind: 'passport',
    batchId: 'BATCH-2026-0001',
    badgeSerial: null,
  });
});

test('publicResolve passportUrl helper appends badge param', () => {
  const url = passportUrlWithBadge('https://www.biovera.app/passport/BATCH-1', 'LBL-9');
  assert.equal(url, 'https://www.biovera.app/passport/BATCH-1?badge=LBL-9');
});

test('legacy /verify/BATCH URL from generateBatchQR parses batch id only', () => {
  const scan = 'http://localhost:3001/verify/BATCH-2026-0001';
  assert.deepEqual(parsePassportScanInput(scan), {
    kind: 'passport',
    batchId: 'BATCH-2026-0001',
    badgeSerial: null,
  });
});

test('verify path with badge query preserves serial', () => {
  const scan = 'https://www.biovera.app/verify/BATCH-2026-0001?badge=PLT-ABC-001';
  assert.deepEqual(parsePassportScanInput(scan), {
    kind: 'passport',
    batchId: 'BATCH-2026-0001',
    badgeSerial: 'PLT-ABC-001',
  });
});

test('seed verify URL is not treated as batch passport', () => {
  const scan = 'https://www.biovera.app/verify/seed/SB-2026-001';
  const parsed = parsePassportScanInput(scan);
  assert.notDeepEqual(parsed, { kind: 'passport', batchId: 'SB-2026-001', badgeSerial: null });
});
