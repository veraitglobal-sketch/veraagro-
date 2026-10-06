const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { createCartStore } = load('lib/cart-store.ts');
const { submitCartOrders } = load('lib/checkout-orders.ts');
const product = { id: 'tomato', productName: 'Tomato', price: 2.5, unit: 'kg' };
const line = (quantity = 1, lineKind = 'purchase') => ({ product, quantity, lineKind });
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};
function memoryStorage(items = []) {
  let value = JSON.stringify(items);
  return { getItem: async () => value, setItem: async (_key, data) => { value = data; },
    read: () => JSON.parse(value) };
}

test('rapid cart additions preserve every tap in memory and after restart', async () => {
  const storage = memoryStorage();
  const store = createCartStore(storage);
  await store.initialize();
  for (let i = 0; i < 20; i++) store.addToCart(product, 1);
  assert.equal(store.getSnapshot().items[0].quantity, 20);
  await store.reloadCart();
  const restarted = createCartStore(storage);
  await restarted.initialize();
  assert.equal(restarted.getSnapshot().items[0].quantity, 20);
});

test('actions during hydration apply to saved cart instead of replacing it', async () => {
  const read = deferred();
  const storage = memoryStorage();
  storage.getItem = () => read.promise;
  const store = createCartStore(storage);
  store.addToCart(product, 2);
  store.addToCart(product, 1, { lineKind: 'reservation' });
  read.resolve(JSON.stringify([line(4)]));
  await store.reloadCart();
  assert.deepEqual(store.getSnapshot().items.map((x) => [x.lineKind, x.quantity]),
    [['purchase', 6], ['reservation', 1]]);
});

test('delayed writes and pull-to-refresh cannot resurrect removed items', async () => {
  const firstWrite = deferred();
  const storage = memoryStorage([line()]);
  const setItem = storage.setItem;
  let calls = 0;
  storage.setItem = async (...args) => {
    if (++calls === 1) await firstWrite.promise;
    return setItem(...args);
  };
  const store = createCartStore(storage);
  await store.initialize();
  store.updateQuantity(product.id, 3, 'purchase');
  store.removeFromCart(product.id, 'purchase');
  const refresh = store.reloadCart();
  assert.deepEqual(store.getSnapshot().items, []);
  firstWrite.resolve();
  await refresh;
  assert.deepEqual(storage.read(), []);
  assert.deepEqual(store.getSnapshot().items, []);
});

test('legacy cart entries migrate and corrupt entries do not crash rendering', async () => {
  const store = createCartStore(memoryStorage([
    { product, quantity: 2 }, null, {}, { product, quantity: -1 },
    { product, quantity: '3' }, { product: { ...product, price: 'oops' }, quantity: 1 },
  ]));
  await store.initialize();
  assert.deepEqual(store.getSnapshot().items, [line(2)]);
});

test('invalid JSON recovers and subsequent cart edits persist', async () => {
  const storage = memoryStorage();
  storage.getItem = async () => '{';
  const errors = [];
  const store = createCartStore(storage, (e) => errors.push(e));
  await store.initialize();
  store.addToCart(product, 1);
  store.addToCart(product, NaN);
  await store.reloadCart();
  assert.equal(errors.length, 1);
  assert.deepEqual(storage.read(), [line()]);
});

test('a failed disk write does not freeze the cart or block later saves', async () => {
  const storage = memoryStorage();
  const save = storage.setItem;
  let fail = true;
  storage.setItem = async (...args) => {
    if (fail) { fail = false; throw new Error('disk unavailable'); }
    return save(...args);
  };
  const errors = [];
  const store = createCartStore(storage, (e) => errors.push(e));
  await store.initialize();
  store.addToCart(product, 1);
  await store.reloadCart();
  store.addToCart(product, 2);
  await store.reloadCart();
  assert.equal(errors.length, 1);
  assert.equal(storage.read()[0].quantity, 3);
});

test('partial checkout retry does not resubmit an acknowledged order', async () => {
  const store = createCartStore(memoryStorage([line(2), line(1, 'reservation')]));
  await store.initialize();
  const sent = [];
  const result = await submitCartOrders(store.getSnapshot().items, async (item) => {
    sent.push(item.lineKind);
    if (item.lineKind === 'reservation') throw new Error('unavailable');
    return { id: 'order-1' };
  }, store.consumeItem, 'missing ID');
  assert.deepEqual(result.createdIds, ['order-1']);
  assert.equal(result.error.message, 'unavailable');
  assert.deepEqual(store.getSnapshot().items, [line(1, 'reservation')]);
  const retry = await submitCartOrders(store.getSnapshot().items, async (item) => {
    sent.push(item.lineKind);
    return { id: 'order-2' };
  }, store.consumeItem, 'missing ID');
  assert.deepEqual(sent, ['purchase', 'reservation', 'reservation']);
  assert.deepEqual(retry.createdIds, ['order-2']);
  await store.reloadCart();
  assert.deepEqual(store.getSnapshot().items, []);
});

test('checkout without an order ID preserves the unconfirmed cart line', async () => {
  const store = createCartStore(memoryStorage([line()]));
  await store.initialize();
  const result = await submitCartOrders(store.getSnapshot().items, async () => ({}), store.consumeItem, 'missing ID');
  assert.equal(result.error.message, 'missing ID');
  assert.deepEqual(store.getSnapshot().items, [line()]);
});

test('checkout does not clear new quantities added while the request is pending', async () => {
  const store = createCartStore(memoryStorage([line(2)]));
  await store.initialize();
  const response = deferred();
  const submit = submitCartOrders(store.getSnapshot().items, () => response.promise, store.consumeItem, 'missing ID');
  store.addToCart(product, 3);
  response.resolve({ id: 'order-1' });
  await submit;
  assert.deepEqual(store.getSnapshot().items, [line(3)]);
});

test('concurrent unauthorized responses trigger one logout and allow later sessions', async () => {
  const events = load('lib/auth-events.ts', { '@react-native-async-storage/async-storage': {} });
  let calls = 0;
  const gate = deferred();
  events.setAuthUnauthorizedHandler(async () => { calls++; await gate.promise; });
  const requests = Array.from({ length: 10 }, () => events.notifyAuthUnauthorized());
  await Promise.resolve();
  assert.equal(calls, 1);
  gate.resolve();
  await Promise.all(requests);
  await events.notifyAuthUnauthorized();
  assert.equal(calls, 2);
});

test('unauthorized during boot clears stored credentials once', async () => {
  let calls = 0;
  const events = load('lib/auth-events.ts', { '@react-native-async-storage/async-storage': {
    multiRemove: async (keys) => { calls++; assert.deepEqual(keys, ['auth_token', 'auth_user']); },
  } });
  await Promise.all([events.notifyAuthUnauthorized(), events.notifyAuthUnauthorized()]);
  assert.equal(calls, 1);
});

function pushModule({ authToken = 'expired-jwt', pushToken = 'device-token', reject = true } = {}) {
  const calls = [];
  const removed = [];
  const mod = load('lib/push-service.ts', {
    'react-native': { Platform: { OS: 'ios' } },
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => key === 'auth_token' ? authToken : pushToken,
      removeItem: async (key) => { removed.push(key); },
    },
    'expo-notifications': {}, 'expo-device': {}, '../i18n/config': {},
    './api': { delete: () => { throw new Error('must not enter auth interceptor'); } },
    './api-url': { API_URL: 'https://example.invalid/' },
    './api-error': {}, './device-id': { getOrCreateDeviceId: async () => 'device-id' },
    './notification-permissions': {},
    axios: { delete: async (...args) => { calls.push(args); if (reject) throw new Error('401'); } },
  });
  return { ...mod, calls, removed };
}

test('expired push cleanup bypasses logout interceptor, has timeout and clears local token', async () => {
  const push = pushModule();
  await push.unregisterPushTokenFromBackend();
  assert.equal(push.calls.length, 1);
  const [url, options] = push.calls[0];
  assert.equal(url, 'https://example.invalid/notifications/push/register');
  assert.equal(options.timeout, 5000);
  assert.equal(options.headers.Authorization, 'Bearer expired-jwt');
  assert.deepEqual(push.removed, ['biovera_push_device_token']);
});

test('logout without a registered push device does not wait on the network', async () => {
  const push = pushModule({ pushToken: null });
  await push.unregisterPushTokenFromBackend();
  assert.equal(push.calls.length, 0);
});

test('rapid plus/minus actions use the current quantity and keep reservations separate', async () => {
  const store = createCartStore(memoryStorage([line(2), line(5, 'reservation')]));
  await store.initialize();
  for (let i = 0; i < 8; i++) store.changeQuantity(product.id, 1, 'purchase');
  for (let i = 0; i < 3; i++) store.changeQuantity(product.id, -1, 'purchase');
  assert.deepEqual(store.getSnapshot().items, [line(7), line(5, 'reservation')]);
  store.changeQuantity(product.id, -7, 'purchase');
  assert.deepEqual(store.getSnapshot().items, [line(5, 'reservation')]);
});

function authHarness({ unregister = async () => {}, remove = async () => {}, post = async () => ({}) } = {}) {
  const states = [];
  const writes = [];
  const session = new Map([['auth_token', 'old-token'], ['auth_user', JSON.stringify({ id: 'old-user' })]]);
  const persistedSessions = [];
  const snapshot = () => persistedSessions.push({
    userId: JSON.parse(session.get('auth_user') ?? 'null')?.id,
    token: session.get('auth_token'),
  });
  const axios = { defaults: { headers: { common: { Authorization: 'Bearer old' } } }, post };
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState: (initial) => [initial, (value) => { states.push(value); }],
    useRef: (current) => ({ current }), useCallback: (fn) => fn,
    useMemo: (fn) => fn(), useEffect: () => {},
  };
  const { AuthProvider } = load('contexts/AuthContext.tsx', {
    react,
    '@react-native-async-storage/async-storage': {
      multiRemove: remove,
      removeItem: async (key) => { session.delete(key); snapshot(); },
      setItem: async (...args) => { writes.push(args); session.set(...args); snapshot(); },
    },
    axios, '../lib/api-url': { API_URL: 'https://example.invalid' },
    '../lib/api-error': { axiosLikeMessage: () => 'Invalid credentials' },
    '../lib/auth-events': {}, '../lib/app-navigation': {},
    '../lib/push-service': { unregisterPushTokenFromBackend: unregister, refreshPushRegistrationIfAuthed: async () => {} },
  });
  return { ...AuthProvider({ children: null }).props.value, states, writes, axios, persistedSessions };
}

test('simultaneous logout calls share cleanup and clear the session once', async () => {
  const gate = deferred();
  let pushes = 0;
  let removals = 0;
  const auth = authHarness({
    unregister: async () => { pushes++; await gate.promise; },
    remove: async (keys) => { removals++; assert.deepEqual(keys, ['auth_token', 'auth_user']); },
  });
  const a = auth.logout();
  const b = auth.logout();
  assert.equal(pushes, 1);
  gate.resolve();
  await Promise.all([a, b]);
  assert.equal(removals, 1);
  assert.deepEqual(auth.states, [null, null]);
  assert.equal(auth.axios.defaults.headers.common.Authorization, undefined);
});

test('storage cleanup failure still clears session state and Authorization header', async () => {
  const auth = authHarness({ remove: async () => { throw new Error('storage failure'); } });
  await assert.rejects(auth.logout(), /storage failure/);
  assert.deepEqual(auth.states, [null, null]);
  assert.equal(auth.axios.defaults.headers.common.Authorization, undefined);
});

test('login has a timeout and does not retry bad credentials against another endpoint', async () => {
  const calls = [];
  const auth = authHarness({ post: async (...args) => {
    calls.push(args);
    throw { response: { status: 401 } };
  } });
  await assert.rejects(auth.login('buyer', 'bad-password'), /Invalid credentials/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][2].timeout, 25000);
  assert.deepEqual(auth.writes, []);
});

test('login retries the legacy API path only after 404 and stores the successful session', async () => {
  const urls = [];
  const user = { id: 'buyer', roles: ['BUYER'] };
  const auth = authHarness({ post: async (url) => {
    urls.push(url);
    if (urls.length === 1) throw { response: { status: 404 } };
    return { data: { access_token: 'new-token', user } };
  } });
  assert.deepEqual(await auth.login('buyer', 'password'), { token: 'new-token', user });
  assert.deepEqual(urls, ['https://example.invalid/auth/login', 'https://example.invalid/api/auth/login']);
  assert.equal(auth.writes[0][1], 'new-token');
  assert.equal(auth.axios.defaults.headers.common.Authorization, 'Bearer new-token');
});

test('a successful account switch never exposes the previous owner with the new token', async () => {
  const user = { id: 'new-user', roles: ['GROWER'] };
  const auth = authHarness({ post: async () => ({ data: { access_token: 'new-token', user } }) });
  await auth.login('new-user', 'password');
  assert.ok(auth.persistedSessions.every(s => s.userId !== 'old-user' || s.token !== 'new-token'));
  assert.deepEqual(auth.persistedSessions.at(-1), { userId: 'new-user', token: 'new-token' });
});
