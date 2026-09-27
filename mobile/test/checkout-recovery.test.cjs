const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { createCartStore } = load('lib/cart-store.ts');
const { submitCartOrders } = load('lib/checkout-orders.ts');
const product = { id: 'tomato', productName: 'Tomato', unit: 'kg', price: 2.5 };
const line = (quantity = 2) => ({ product, quantity, lineKind: 'purchase' });
function memoryStorage() {
  let raw = JSON.stringify([line()]);
  return { getItem: async () => raw, setItem: async (_key, value) => { raw = value; }, read: () => JSON.parse(raw) };
}

test('lost response retains a durable checkout key across application restart', async () => {
  const storage = memoryStorage(), store = createCartStore(storage);
  await store.initialize();
  const prepared = await store.prepareCheckout(store.getSnapshot().items[0], () => 'key-1');
  assert.equal(storage.read()[0].checkoutKey, 'key-1');
  const lost = await submitCartOrders([prepared], async () => { throw new Error('response lost after commit'); }, store.completeCheckout, 'missing ID');
  assert.ok(lost.error);
  const restarted = createCartStore(storage); await restarted.initialize();
  const retry = await restarted.prepareCheckout(restarted.getSnapshot().items[0], () => 'must-not-generate');
  assert.equal(retry.checkoutKey, prepared.checkoutKey);
  const result = await submitCartOrders([retry], async () => ({ id: 'original-order', quantity: 2 }), restarted.completeCheckout, 'missing ID');
  assert.deepEqual(result.createdIds, ['original-order']); assert.deepEqual(storage.read(), []);
});

test('failed storage blocks checkout before any request can be sent', async () => {
  const storage = memoryStorage(); storage.setItem = async () => { throw new Error('disk full'); };
  const store = createCartStore(storage, () => {}); await store.initialize();
  await assert.rejects(store.prepareCheckout(store.getSnapshot().items[0], () => 'key-1'), /disk full/);
  assert.equal(storage.read()[0].checkoutKey, undefined);
});

test('recovered original quantity is consumed once even when the buyer edited the cart', async () => {
  const storage = memoryStorage(), store = createCartStore(storage); await store.initialize();
  await store.prepareCheckout(store.getSnapshot().items[0], () => 'key-1');
  store.updateQuantity('tomato', 5, 'purchase');
  const retry = await store.prepareCheckout(store.getSnapshot().items[0], () => 'unused');
  const result = await submitCartOrders([retry], async () => ({ id: 'original-order', quantity: 2 }), store.completeCheckout, 'missing ID');
  assert.equal(result.error, undefined); assert.equal(storage.read()[0].quantity, 3);
  await store.completeCheckout({ ...retry, quantity: 2 });
  assert.equal(storage.read()[0].quantity, 3);
  const fresh = await store.prepareCheckout(store.getSnapshot().items[0], () => 'key-2');
  assert.equal(fresh.checkoutKey, 'key-2');
});

test('crash after acknowledgement but before cart persistence reuses the old key on restart', async () => {
  const storage = memoryStorage(), store = createCartStore(storage, () => {}); await store.initialize();
  const prepared = await store.prepareCheckout(store.getSnapshot().items[0], () => 'key-1');
  const originalWrite = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  const result = await submitCartOrders([prepared], async () => ({ id: 'saved', quantity: 2 }), store.completeCheckout, 'missing ID');
  assert.deepEqual(result.createdIds, ['saved']); assert.ok(result.error);
  storage.setItem = originalWrite;
  const restarted = createCartStore(storage); await restarted.initialize();
  const retry = await restarted.prepareCheckout(restarted.getSnapshot().items[0], () => 'unused');
  assert.equal(retry.checkoutKey, 'key-1');
  await restarted.completeCheckout(retry); assert.deepEqual(storage.read(), []);
});

test('separate cart lines keep separate attempts and successful lines stay removed after partial failure', async () => {
  const storage = memoryStorage(), store = createCartStore(storage); await store.initialize();
  store.addToCart({ ...product, id: 'apple' }, 1);
  let n = 0; const prepared = [];
  for (const item of store.getSnapshot().items) prepared.push(await store.prepareCheckout(item, () => `key-${++n}`));
  const result = await submitCartOrders(prepared, async item => {
    if (item.product.id === 'apple') throw new Error('offline');
    return { id: 'tomato-order', quantity: 2 };
  }, store.completeCheckout, 'missing ID');
  assert.deepEqual(result.createdIds, ['tomato-order']); assert.equal(storage.read().length, 1);
  assert.equal(storage.read()[0].checkoutKey, 'key-2');
});

test('order API recovers only the explicit changed-request conflict and never masks other failures', async () => {
  const calls = [];
  const api = { post: async () => { throw { response: { data: { code: 'ORDER_REQUEST_MISMATCH' } } }; },
    get: async url => { calls.push(url); return { data: { id: 'original', quantity: 2, checkoutReplay: true } }; } };
  const { ordersAPI } = load('lib/api/orders.ts', { './client': api });
  const order = await ordersAPI.create({ clientRequestId: 'key-1' });
  assert.equal(order.id, 'original'); assert.deepEqual(calls, ['/orders/checkout/key-1']);
  api.post = async () => { throw new Error('offline'); };
  await assert.rejects(ordersAPI.create({ clientRequestId: 'key-1' }), /offline/);
  assert.equal(calls.length, 1);
});
