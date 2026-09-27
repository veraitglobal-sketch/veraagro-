const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { createCartStore } = load('lib/cart-store.ts');
const { cartCatalogueIssue: issue } = load('lib/cart-catalogue.ts');
const product = { id: 'apple', productName: 'Apple', quantity: 5, price: 2, unit: 'kg' };
const line = (quantity = 2, extra = {}) => ({ product, quantity, lineKind: 'purchase', ...extra });

test('catalogue refresh updates prices and stock while preserving quantities and retry identity', async () => {
  let saved = JSON.stringify([line(2, { checkoutKey: 'original-request' })]);
  const store = createCartStore({ getItem: async () => saved, setItem: async (_, value) => { saved = value; } });
  const changed = await store.refreshProducts([{ ...product, price: 3, quantity: 1 }]);
  assert.equal(changed, true);
  const current = store.getSnapshot().items[0];
  assert.equal(current.quantity, 2);
  assert.equal(current.product.price, 3);
  assert.equal(current.product.quantity, 1);
  const prepared = await store.prepareCheckout(current, () => 'must-not-replace');
  assert.equal(prepared.checkoutKey, 'original-request');
  assert.equal(JSON.parse(saved)[0].checkoutKey, 'original-request');
});

test('disappeared products remain in the cart with an actionable unavailable result', async () => {
  const store = createCartStore({ getItem: async () => JSON.stringify([line()]), setItem: async () => {} });
  await store.refreshProducts([]);
  const items = store.getSnapshot().items;
  assert.equal(items.length, 1);
  assert.equal(issue(items[0], items, []), 'unavailable');
});

test('purchase and reservation quantities share the same available supply', () => {
  const items = [line(3), line(3, { lineKind: 'reservation' })];
  assert.equal(issue(items[0], items, [product]), 'quantity');
  assert.equal(issue(items[1], items, [product]), 'quantity');
  items[1].quantity = 2;
  assert.equal(issue(items[0], items, [product]), null);
});

test('new orders cannot proceed with missing prices, zero stock or invalid quantities', () => {
  const item = line();
  for (const price of [0, undefined, NaN, -1]) {
    assert.equal(issue(item, [item], [{ ...product, price }]), 'priceMissing');
  }
  assert.equal(issue(item, [item], [{ ...product, quantity: 0 }]), 'quantity');
  const invalid = line(NaN);
  assert.equal(issue(invalid, [invalid], [product]), 'quantity');
});

test('lost-response retries still reach recovery after the original order used the stock', () => {
  const pending = line(5, { checkoutKey: 'saved-request' });
  assert.equal(issue(pending, [pending], []), null);
  assert.equal(issue(pending, [pending], [{ ...product, quantity: 0 }]), null);
  const fresh = line(1, { lineKind: 'reservation' });
  assert.equal(issue(fresh, [pending, fresh], [{ ...product, quantity: 1 }]), null);
});
