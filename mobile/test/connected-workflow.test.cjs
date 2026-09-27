const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { orderQueue } = load('../web/lib/order-operations.ts');
const { batchWorkflowHref } = load('lib/batch-workflow.ts');

const order = { id: 'order', status: 'COMPLETED', payments: { status: 'IN_ESCROW' }, deliveries: { status: 'CONFIRMED' } };
test('completed delivery remains in the admin work queue until escrow is settled', () => {
  assert.equal(orderQueue(order), 'settlement');
  assert.equal(orderQueue({ ...order, payments: { status: 'RELEASED' } }), 'closed');
  assert.equal(orderQueue({ ...order, payments: { status: 'REFUNDED' } }), 'closed');
  assert.equal(orderQueue({ ...order, status: 'CANCELLED' }), 'closed');
  assert.notEqual(orderQueue({ ...order, status: 'PAID', deliveries: { status: 'IN_TRANSIT' } }), 'settlement');
});
test('labels receive the selected lot ID instead of opening an unlinked registration', () => {
  assert.deepEqual(batchWorkflowHref('labels', 'lot-2'), { pathname: '/(producer)/package-badges', params: { batchId: 'lot-2' } });
});

const product = { id: 'prod-1', source: 'manual', name: 'Seed', contents: '', quantity: 5, unit: 'kg', timestamp: '2026-09-26', status: 'pending' };
function productsModule({ local = [product], server = [], online = true, fail = false } = {}) {
  return load('lib/grower-products.ts', {
    './api/client': { get: async () => { if (fail) throw new Error('network'); return { data: server }; } },
    './offline-storage': { productOwnerId: async () => 'A', offlineStorage: { getPendingProducts: async () => local } },
    './network-utils': { isDeviceOnline: async () => online },
  });
}
test('server acknowledgement deduplicates a product whose device status is stale', async () => {
  const result = await productsModule({ server: [{ ...product, quantity: 7 }] }).loadGrowerProducts();
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].status, 'synced');
  assert.equal(result.products[0].quantity, 7);
  assert.equal(result.serverUnavailable, false);
});
test('a new device can read previously synced products', async () => {
  const result = await productsModule({ local: [], server: [product] }).loadGrowerProducts();
  assert.equal(result.products[0].id, product.id);
});
test('offline and failed list requests preserve acknowledged device entries and show a warning', async () => {
  for (const options of [{ online: false }, { fail: true }]) {
    const result = await productsModule({ ...options, local: [{ ...product, status: 'synced' }] }).loadGrowerProducts();
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].status, 'synced');
    assert.equal(result.serverUnavailable, true);
  }
});
test('products belong to their saving account; legacy unowned data is retained without being uploaded', async () => {
  const data = new Map([['auth_user', JSON.stringify({ id: 'A' })], ['pending_products', JSON.stringify([product])]]);
  const storage = { getItem: async key => data.get(key) ?? null, setItem: async (key, value) => data.set(key, value) };
  const { offlineStorage } = load('lib/offline-storage.ts', {
    '@react-native-async-storage/async-storage': storage,
    '../i18n/config': {}, './i18n-strings': { tString: key => key },
  });
  assert.deepEqual(await offlineStorage.getPendingProducts(), []);
  const id = await offlineStorage.savePendingProduct(product);
  await offlineStorage.updateProductStatus(id, 'synced', undefined, 'A');
  assert.equal((await offlineStorage.getPendingProducts())[0].status, 'synced');
  data.set('auth_user', JSON.stringify({ id: 'B' }));
  assert.deepEqual(await offlineStorage.getPendingProducts(), []);
  await offlineStorage.updateProductStatus(id, 'error', 'delayed response', 'A');
  assert.deepEqual(await offlineStorage.getPendingProducts(), []);
  data.set('auth_user', JSON.stringify({ id: 'A' }));
  assert.equal((await offlineStorage.getPendingProducts())[0].error, 'delayed response');
  assert.equal(JSON.parse(data.get('pending_products'))[0].id, product.id);
});
