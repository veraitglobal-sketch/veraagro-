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

const { buildQrVerifyUrl, buildQrVerifyPdfUrl } = loadShared('passport/api-urls.ts');

const API_URL = 'https://api.biovera.app';

function loadPassportApi(axios) {
  return require('./load-typescript.cjs')('lib/api/buyer.ts', {
    axios,
    '@react-native-async-storage/async-storage': {},
    'expo-file-system/legacy': {},
    './client': {},
    '../api-url': { API_URL },
  }).passportAPI;
}

test('actual passport API forwards the badge and returns the HTTP response', async () => {
  const calls = [];
  const passport = { batch: { batchId: 'BATCH-1' } };
  const api = loadPassportApi({ get: async url => { calls.push(url); return { data: passport }; } });
  assert.equal(await api.getByBatchId('BATCH-1', 'PLT A/1'), passport);
  assert.equal(await api.getByBatchId('BATCH-1'), passport);
  assert.deepEqual(calls, [
    `${API_URL}/qr/verify/BATCH-1?badge=PLT%20A%2F1`,
    `${API_URL}/qr/verify/BATCH-1`,
  ]);
});

test('actual report API sends the original body and package identity', async () => {
  const calls = [];
  const result = { reportNumber: 'PR-1' };
  const api = loadPassportApi({ post: async (url, body) => { calls.push({ url, body }); return { data: result }; } });
  const body = { description: 'Damaged packaging', idempotencyKey: 'retry-1' };
  assert.equal(await api.submitReport('BATCH-1', body, 'PLT-1'), result);
  assert.deepEqual(calls, [{ url: `${API_URL}/qr/verify/BATCH-1/report?badge=PLT-1`, body }]);
});

test('passport API URL includes badge query when serial is provided', () => {
  assert.equal(
    buildQrVerifyUrl(API_URL, 'BATCH-2026-0001', 'PLT-ABC'),
    'https://api.biovera.app/qr/verify/BATCH-2026-0001?badge=PLT-ABC',
  );
  assert.equal(
    buildQrVerifyUrl(API_URL, 'BATCH-2026-0001', null),
    'https://api.biovera.app/qr/verify/BATCH-2026-0001',
  );
});

test('PDF download URL forwards badge param', () => {
  assert.equal(
    buildQrVerifyPdfUrl(API_URL, 'BATCH-2026-0001', 'PLT-ABC'),
    'https://api.biovera.app/qr/verify/BATCH-2026-0001/pdf?badge=PLT-ABC',
  );
});
