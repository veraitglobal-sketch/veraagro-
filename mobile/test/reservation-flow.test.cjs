const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

// Exercise real form handlers with native rendering and device storage replaced.
function form(options = {}) {
  const slots = [], effects = [], alerts = [], created = [], opened = [], reads = [];
  let cursor = 0, tree;
  const user = { id: 'buyer-a' };
  const address = { street: 'Street 1', city: 'Berlin', postalCode: '10115', country: 'Germany' };
  const disk = new Map([['buyer_last_delivery:buyer-a', JSON.stringify(address)]]);
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useEffect(fn, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || deps.some((v, n) => v !== previous.deps[n])) {
        previous?.cleanup?.(); slots[i] = { deps };
        effects.push(() => { slots[i].cleanup = fn(); });
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const storage = {
    getItem: async key => { reads.push(key); return disk.get(key) ?? null; },
    setItem: async (key, value) => { if (options.failSave) throw new Error('disk full'); disk.set(key, value); },
    removeItem: async key => { if (options.failCleanup) throw new Error('disk full'); disk.delete(key); },
  };
  const Component = load('components/ReservationModal.tsx', {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', Text: 'Text', Modal: 'Modal', TouchableOpacity: 'Button', TextInput: 'Input', ScrollView: 'Scroll', Alert: { alert: (...args) => alerts.push(args) } },
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
    '@react-native-async-storage/async-storage': storage,
    'expo-crypto': { randomUUID: () => 'request-1' },
    'lucide-react-native': { X: 'X', Plus: 'Plus', Minus: 'Minus' },
    '../lib/theme': load('lib/theme.ts'),
    '../lib/date-locale': { useAppLocaleTag: () => 'en-GB' },
    '../hooks/useAuth': { useAuth: () => ({ user }) },
    '../lib/api': { ordersAPI: { create: async payload => {
      created.push(payload);
      return { id: 'saved-order', orderNumber: 'ORD-1', ...payload };
    } } },
  }).default;
  const props = {
    visible: true,
    product: { id: 'p', productName: 'Apple', price: 2, estate: { id: 'farm' }, availableQuantity: 20, unit: 'kg' },
    availability: { availableQuantity: options.available ?? 10, unit: 'kg' },
    onClose() {}, onSuccess: order => opened.push(order.id),
  };
  function render() { cursor = 0; tree = Component(props); effects.splice(0).forEach(fn => fn()); }
  function nodes(node = tree) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...[node.props?.children].flat(Infinity).filter(child => child != null).flatMap(nodes)];
  }
  const button = () => nodes().find(n => n.type === 'Button' && nodes(n).some(child => child.props?.children === 'reservationModal.confirmReservation'));
  return { render, button, created, opened, alerts, reads, user,
    input: () => nodes().find(n => n.type === 'Input' && n.props.keyboardType === 'numeric'),
    street: () => nodes().find(n => n.type === 'Input' && n.props.placeholder === 'buyer.checkout.fieldStreet'),
    async ready() { render(); await new Promise(resolve => setImmediate(resolve)); render(); },
  };
}

test('zero batch stock cannot fall back to catalogue stock and create an order', async () => {
  const f = form({ available: 0 }); await f.ready();
  assert.equal(f.button().props.disabled, true);
  await f.button().props.onPress();
  assert.equal(f.created.length, 0);
});

test('decimal quantities survive typing and open the acknowledged order even if local cleanup fails', async () => {
  const f = form({ failCleanup: true }); await f.ready();
  f.input().props.onChangeText('1,'); f.render();
  f.input().props.onChangeText('1,5'); f.render();
  assert.equal(f.button().props.disabled, false);
  await f.button().props.onPress();
  assert.equal(f.created[0].quantity, 1.5);
  assert.deepEqual(f.opened, ['saved-order']);
  assert.equal(f.alerts[0][0], 'alerts.success');
});

test('failure to persist the request key stops the order before transmission', async () => {
  const f = form({ failSave: true }); await f.ready();
  await f.button().props.onPress();
  assert.equal(f.created.length, 0);
  assert.deepEqual(f.opened, []);
  assert.equal(f.alerts[0][0], 'error');
});

test('changing buyer clears the previous address and reads only the new buyer key', async () => {
  const f = form(); await f.ready();
  assert.equal(f.street().props.value, 'Street 1');
  f.user.id = 'buyer-b'; await f.ready();
  assert.equal(f.street().props.value, '');
  assert.equal(f.button().props.disabled, true);
  assert.deepEqual(f.reads, ['buyer_last_delivery:buyer-a', 'buyer_last_delivery:buyer-b']);
});
