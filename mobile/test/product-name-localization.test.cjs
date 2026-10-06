const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { productNameLabel } = load('../shared/i18n/labels.ts');
const expected = {
  sr: ['Malina', 'Kupina', 'Jagoda'], en: ['Raspberry', 'Blackberry', 'Strawberry'],
  de: ['Himbeere', 'Brombeere', 'Erdbeere'], fr: ['Framboise', 'Mûre', 'Fraise'],
  es: ['Frambuesa', 'Mora', 'Fresa'], ro: ['Zmeură', 'Mură', 'Căpșună'],
  bg: ['Малина', 'Къпина', 'Ягода'],
};
for (const [locale, labels] of Object.entries(expected)) {
  test(`product labels use the ${locale} glossary and preserve custom variety names`, () => {
    const glossary = require(`../../shared/i18n/glossary/${locale}.json`);
    const t = key => key.split('.').slice(1).reduce((value, part) => value?.[part], glossary) ?? key;
    assert.deepEqual(['Malina', 'Kupina', 'Jagoda'].map(name => productNameLabel(t, name)), labels);
    assert.deepEqual(['Raspberry', 'Blackberries', 'Strawberry'].map(name => productNameLabel(t, name)), labels);
    assert.equal(productNameLabel(t, 'Malina — Polka'), 'Malina — Polka');
    assert.equal(productNameLabel(t, 'Custom farm product'), 'Custom farm product');
  });
}
