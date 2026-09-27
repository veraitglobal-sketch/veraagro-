const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { resolveNotificationActionHref: resolve } = load('lib/resolve-notification-action.ts', {
  './grower-web-href-to-mobile': load('lib/grower-web-href-to-mobile.ts'),
  './post-login-redirect': load('lib/post-login-redirect.ts'),
});
const { buyerDeliveryActions: actions } = load('lib/buyer-delivery-state.ts');

test('handover notifications retain the handover ID instead of opening buyer dashboard', () => {
  assert.deepEqual(resolve('https://biovera.app/buyer-portal/handover/receipt-123', { roles: ['BUYER'] }), {
    pathname: '/manager/handover-complete', params: { handoverId: 'receipt-123' },
  });
  assert.doesNotThrow(() => resolve('/buyer-portal/handover/%malformed'));
});
test('loading and receiver notifications preserve mission IDs for either logistics portal', () => {
  for (const portal of ['logistics-partner', 'fleet-partner']) {
    for (const screen of ['handover-receiver', 'handover-loading']) {
      assert.deepEqual(resolve(`/${portal}/${screen}?missionId=mission%2D42`, { roles: ['DRIVER'] }), {
        pathname: `/(logistics)/${screen}`, params: { missionId: 'mission-42' },
      });
    }
  }
});
test('delivery notification identifiers are delivery IDs, never substituted for order IDs', () => {
  for (const url of ['/deliveries/delivery-42', '/buyer-portal/deliveries/delivery-42', '/buyer-portal/deliveries?deliveryId=delivery-42']) {
    assert.deepEqual(resolve(url, { roles: ['BUYER'] }), {
      pathname: '/(buyer)/delivery/[id]', params: { id: 'delivery-42' },
    });
  }
  const id = '01234567-1234-1234-1234-012345678901';
  assert.equal(resolve(`/buyer-portal/orders/${id}`, { roles: ['BUYER'] }), `/(buyer)/order/${id}`);
  assert.equal(resolve('/admin/delivery-issues', { roles: ['BUYER'] }), null);
});
test('buyer actions follow the durable handover and receipt states', () => {
  const delivery = { status: 'IN_TRANSIT', digital_handovers: { id: 'h', status: 'INITIATED' } };
  assert.equal(actions(delivery).canCompleteHandover, true);
  assert.equal(actions(delivery).canConfirm, false);
  assert.equal(actions({ ...delivery, status: 'DELIVERED', digital_handovers: { status: 'COMPLETED' } }).canConfirm, true);
  assert.equal(actions({ ...delivery, status: 'DELIVERED', digital_handovers: { status: 'DISPUTED' } }).canConfirm, false);
  assert.equal(actions({ ...delivery, status: 'CONFIRMED', buyerPickupConfirmedAt: new Date().toISOString() }).canConfirm, false);
});
test('24-hour report window starts at the saved receipt and closes without extending on reload', () => {
  const start = Date.parse('2026-09-26T10:00:00Z');
  const delivery = { status: 'CONFIRMED', buyerPickupConfirmedAt: new Date(start).toISOString() };
  assert.equal(actions(delivery, start - 1).canReport, false);
  assert.equal(actions(delivery, start).canReport, true);
  assert.equal(actions(delivery, start + 86_400_000).canReport, true);
  assert.equal(actions(delivery, start + 86_400_001).canReport, false);
  assert.equal(actions({ ...delivery, buyerPickupConfirmedAt: undefined }, start).canReport, false);
  assert.equal(actions({ status: 'CONFIRMED', confirmedAt: new Date(start).toISOString() }, start).canReport, true);
});
test('camera URIs are converted to image content before transmission', async () => {
  const converted = [], checked = [];
  const { prepareHandoverPhotos } = load('lib/handover-evidence.ts', {
    './image-data-url': {
      imageUriToJpegDataUrl: async (uri) => { converted.push(uri); return `data:image/jpeg;base64,${Buffer.from(uri).toString('base64')}`; },
      assertDataUrlWithinSize: (data, size) => { checked.push({ data, size }); },
    },
  });
  const result = await prepareHandoverPhotos(['file:///camera.jpg', 'content://photos/2', 'data:image/png;base64,cGhvdG8=']);
  assert.deepEqual(converted, ['file:///camera.jpg', 'content://photos/2']);
  assert.equal(result.length, 3);
  assert.ok(result.every((v) => v.startsWith('data:image/')));
  assert.equal(checked.length, 3);
  assert.ok(checked.every((v) => v.size === 1_800_000));
});
test('missing or oversized image evidence fails before a payload can be submitted', async () => {
  for (const failure of ['missing', 'oversized']) {
    const { prepareHandoverPhotos } = load('lib/handover-evidence.ts', {
      './image-data-url': {
        imageUriToJpegDataUrl: async () => { if (failure === 'missing') throw new Error('missing'); return 'data:image/jpeg;base64,YQ=='; },
        assertDataUrlWithinSize: () => { throw new Error('oversized'); },
      },
    });
    await assert.rejects(prepareHandoverPhotos(['file:///photo.jpg']), new RegExp(failure));
  }
});

function missionHook(api) {
  const slots = []; let cursor = 0, focus, cleanup;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], (value) => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0]; },
    useCallback: (fn) => fn,
  };
  const { useMissionDetailData } = load('features/grower/missions/useMissionDetailData.ts', {
    react, '@react-navigation/native': { useFocusEffect: (fn) => { focus = fn; } },
    '../../../lib/api': { missionsAPI: { getJourneyMap: async () => null, ...api } },
    '../../../lib/mission-status': {},
  });
  return { render(id) { cursor = 0; return useMissionDetailData(id); },
    focus() { cleanup?.(); cleanup = focus(); } };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('late mission response cannot replace another mission or its linked delivery', async () => {
  let first;
  const screen = missionHook({ getOne: (id) => id === 'a' ? new Promise((resolve) => { first = resolve; }) : Promise.resolve({ id, delivery: { id: 'delivery-b' } }) });
  screen.render('a'); screen.focus();
  assert.equal(screen.render('b').mission, null); screen.focus(); await tick();
  assert.equal(screen.render('b').mission.delivery.id, 'delivery-b');
  first({ id: 'a', delivery: { id: 'delivery-a' } }); await tick();
  assert.equal(screen.render('b').mission.id, 'b');
});

test('returning to a mission reloads the saved handover and a missing mission ends loading', async () => {
  let receipt = null;
  const screen = missionHook({ getOne: async (id) => ({ id, delivery: { id: 'delivery', digital_handovers: receipt } }) });
  screen.render('mission'); screen.focus(); await tick();
  assert.equal(screen.render('mission').mission.delivery.digital_handovers, null);
  receipt = { id: 'handover', status: 'INITIATED' };
  screen.focus(); await tick();
  assert.equal(screen.render('mission').mission.delivery.digital_handovers.id, 'handover');
  screen.render(undefined); screen.focus();
  assert.equal(screen.render(undefined).loading, false);
  assert.equal(screen.render(undefined).mission, null);
});

test('return actions follow the physical sequence and belong only to assigned participants', () => {
  const { returnAction } = load('lib/return-action.ts');
  const row = { carrierUserId: 'carrier', receiverUserId: 'farm' };
  for (const status of ['PLANNED', 'COLLECTED', 'RECEIVED']) {
    for (const user of ['carrier', 'farm', 'buyer', 'outsider', undefined]) {
      const expected = status === 'PLANNED' && user === 'carrier' ? 'collect' : status === 'COLLECTED' && user === 'farm' ? 'receive' : null;
      assert.equal(returnAction({ ...row, status }, user), expected);
    }
  }
});
test('a planned return suppresses buyer receipt even when the outgoing delivery looks complete', () => {
  const { buyerDeliveryActions } = load('lib/buyer-delivery-state.ts');
  const row = { status: 'DELIVERED', digital_handovers: { status: 'COMPLETED' } };
  assert.equal(buyerDeliveryActions(row).canConfirm, true);
  assert.equal(buyerDeliveryActions({ ...row, returnCase: { status: 'PLANNED' } }).canConfirm, false);
});

test('wallet credits and refund debits use the API signed amount and show only one sign', () => {
  const { walletTransactionView } = load('lib/wallet-transaction.ts');
  for (const [sourceType, amount, type] of [['EARNED', 17.5, 'CREDIT'], ['PLATFORM_FEE', 2.5, 'CREDIT'], ['REFUNDED', -17.5, 'DEBIT'], ['WITHDRAWN', -5, 'DEBIT'], ['BONUS', 1, 'CREDIT']]) {
    const row = walletTransactionView({ id: 'tx', type: sourceType, amount, orderId: 'order', status: 'COMPLETED' });
    assert.equal(row.type, type); assert.equal(row.sourceType, sourceType);
    assert.equal(row.amount, Math.abs(amount)); assert.equal(row.orderId, 'order');
  }
});
