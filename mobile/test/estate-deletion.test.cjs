const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const helpers = load('lib/estate-deletion.ts');
const blocked = { response: { status: 403, data: { message: 'Cannot delete an estate that has product batches. Remove or reassign those batches first.' } } };

test('recognizes the deployed deletion error without treating every forbidden response as linked lots', () => {
  assert.equal(helpers.estateDeletionBlock(blocked), 'batches');
  assert.equal(helpers.estateDeletionBlock({ response: { data: { message: 'Access denied' } } }), null);
  assert.equal(helpers.estateDeletionBlock(new Error('offline')), null);
  assert.equal(helpers.estateDeletionBlock({ response: { data: { message: ['Cannot delete an estate that is linked to shop or delivery orders.'] } } }), 'orders');
});

test('blocked deletion offers the exact estate lots instead of raw server text or deleting related records', async () => {
  const alerts = [], routes = [], deleted = [];
  const { useEstatesData } = load('features/grower/estates/useEstatesData.ts', {
    react: { useState: value => [value, () => {}], useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: () => {}, useLayoutEffect: () => {} },
    'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
    'expo-router': { useRouter: () => ({ push: href => routes.push(href) }) },
    '../../../lib/api': { estatesAPI: { delete: async id => { deleted.push(id); throw blocked; } } },
    '../../../lib/estate-deletion': helpers,
    '../../../lib/grower-offline-cache': { growerOfflineCache: {} },
    '../../../lib/enterprise-ui': { enterpriseEstateStatusColor: () => '' },
    '../../../contexts/GrowerDashboardContext': { useGrowerDashboard: () => ({ estates: [] }) },
  });
  useEstatesData().handleDelete({ id: 'estate-2', name: 'BioVera #2' });
  await alerts[0][2][1].onPress();
  assert.deepEqual(deleted, ['estate-2']);
  assert.equal(alerts[1][0], 'estateDeletion.title');
  assert.equal(alerts[1][1], 'estateDeletion.batches');
  alerts[1][2][1].onPress();
  assert.deepEqual(routes, [{ pathname: '/(producer)/batches', params: { estateId: 'estate-2', estateName: 'BioVera #2' } }]);
});

test('linked lot view filters by estate identity, includes nested legacy IDs, and never falls back to all lots', () => {
  const lots = [
    { id: 'lot-a', estateId: 'A', estates: { name: 'Same name' } },
    { id: 'lot-b', estateId: 'B', estates: { name: 'Same name' } },
    { id: 'lot-c', estates: { id: 'B' } },
    { id: 'unknown' },
  ];
  assert.deepEqual(helpers.lotsForEstate(lots, 'B').map(row => row.id), ['lot-b', 'lot-c']);
  assert.deepEqual(helpers.lotsForEstate(lots, 'missing'), []);
  assert.equal(helpers.lotsForEstate(lots), lots);
});
