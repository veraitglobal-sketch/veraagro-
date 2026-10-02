const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

test('SEED_PRODUCER lands on the dedicated seed-producer stack, not grower tabs', () => {
  const { getPostLoginPath } = load('lib/post-login-redirect.ts');
  assert.equal(getPostLoginPath(['SEED_PRODUCER']), '/(seed-producer)/seed-producer-web');
  assert.equal(getPostLoginPath(['SEED_PRODUCER', 'GROWER']), '/(producer)/(tabs)');
});

test('field log history is scoped per signed-in user; legacy rows stay quarantined', async () => {
  const legacyItem = {
    id: 'legacy-1',
    timestamp: '2026-10-01T10:00:00Z',
    activityType: 'Planting',
    status: 'synced',
  };
  const data = new Map([
    ['field_log_history_v1', JSON.stringify([legacyItem])],
    ['auth_user', JSON.stringify({ id: 'user-a' })],
  ]);
  const storage = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => data.set(key, value),
    removeItem: async (key) => data.delete(key),
  };
  const { offlineStorage } = load('lib/offline-storage.ts', {
    '@react-native-async-storage/async-storage': storage,
    '../i18n/config': {},
    './i18n-strings': { tString: (key) => key },
  });

  assert.deepEqual(await offlineStorage.getFieldLogHistory(), []);
  const entryId = 'entry-a';
  await offlineStorage.upsertFieldLogHistoryFromPending({
    id: entryId,
    timestamp: '2026-10-02T10:00:00Z',
    activityType: 'Planting',
    status: 'pending',
  });
  assert.equal((await offlineStorage.getFieldLogHistory())[0].id, entryId);

  data.set('auth_user', JSON.stringify({ id: 'user-b' }));
  assert.deepEqual(await offlineStorage.getFieldLogHistory(), []);

  data.set('auth_user', JSON.stringify({ id: 'user-a' }));
  assert.equal((await offlineStorage.getFieldLogHistory())[0].id, entryId);
  assert.equal(JSON.parse(data.get('field_log_history_v1:__legacy__'))[0].id, 'legacy-1');
});

test('mergeFieldLogHistory keeps local rows when server rows are empty', () => {
  const { mergeFieldLogHistory } = load('lib/field-log-history.ts');
  const local = [{ id: 'local-1', timestamp: '2026-10-01T09:00:00Z', activityType: 'Planting', status: 'synced' }];
  const merged = mergeFieldLogHistory(local, [], []);
  assert.deepEqual(merged.map((row) => row.id), ['local-1']);
});
