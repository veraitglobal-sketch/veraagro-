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

const { buildPassportCompleteness, passportCompletenessMissing } = loadShared('passport/completeness.ts');

test('completeness distinguishes required vs recommended gaps', () => {
  const items = buildPassportCompleteness({
    catalogProduct: { name: 'Raspberry', variety: null, description: null, imageUrl: null, storageConditions: null, sourcePlantingId: 'p1' },
    batch: { harvestDate: new Date(), actualPackDate: null, catalogProductId: 'cat-1', harvestAnnouncementId: 'h1' },
    hasPackedOrders: false,
    hasActiveBadge: false,
    publicDocumentsCount: 0,
    hasQualityEntry: false,
  });
  const missing = passportCompletenessMissing(items);
  assert.ok(missing.some((m) => m.id === 'pack_date' && m.level === 'recommended'));
  assert.ok(missing.some((m) => m.id === 'harvest_date') === false);
  assert.ok(missing.some((m) => m.id === 'variety' && m.level === 'recommended'));
});
