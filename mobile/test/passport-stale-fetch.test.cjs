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

const { PassportRequestGuard } = loadShared('passport/stale-fetch-guard.ts');

/** Mirrors ProductPassport.tsx loadPassport guard pattern. */
async function simulatePassportLoad(guard, batchId, delayMs, onSuccess) {
  const seq = guard.begin();
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (!guard.isLatest(seq)) return;
  onSuccess(batchId);
}

test('PassportRequestGuard: stale success from A does not overwrite B', async () => {
  const guard = new PassportRequestGuard();
  let displayed = null;
  const pA = simulatePassportLoad(guard, 'A', 30, (id) => {
    displayed = id;
  });
  const pB = simulatePassportLoad(guard, 'B', 5, (id) => {
    displayed = id;
  });
  await pB;
  assert.equal(displayed, 'B');
  await pA;
  assert.equal(displayed, 'B');
});

test('PassportRequestGuard: invalidate drops in-flight response', async () => {
  const guard = new PassportRequestGuard();
  let displayed = null;
  const seq = guard.begin();
  guard.invalidate();
  await new Promise((r) => setTimeout(r, 10));
  if (guard.isLatest(seq)) displayed = 'A';
  assert.equal(displayed, null);
});
