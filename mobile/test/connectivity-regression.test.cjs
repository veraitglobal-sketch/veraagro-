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

test('switching accounts during a history write preserves both owners', async () => {
  const row = id => ({ id, timestamp: '2026-10-02', activityType: 'Planting', status: 'synced' });
  const data = new Map([
    ['auth_user', JSON.stringify({ id: 'A' })],
    ['field_log_history_v1:A', JSON.stringify([row('private-A')])],
    ['field_log_history_v1:B', JSON.stringify([row('private-B')])],
  ]);
  const storage = {
    getItem: async key => {
      const value = data.get(key) ?? null;
      if (key === 'field_log_history_v1:A') data.set('auth_user', JSON.stringify({ id: 'B' }));
      return value;
    },
    setItem: async (key, value) => data.set(key, value), removeItem: async key => data.delete(key),
  };
  const { offlineStorage } = load('lib/offline-storage.ts', {
    '@react-native-async-storage/async-storage': storage,
    '../i18n/config': {}, './i18n-strings': { tString: key => key },
  });
  await offlineStorage.upsertFieldLogHistoryFromPending(row('new-A'));
  assert.deepEqual(JSON.parse(data.get('field_log_history_v1:A')).map(r => r.id), ['new-A', 'private-A']);
  assert.deepEqual(JSON.parse(data.get('field_log_history_v1:B')).map(r => r.id), ['private-B']);
});

test('simultaneous history writes retain both entries; existing legacy quarantine is never overwritten', async () => {
  const data = new Map([['auth_user', JSON.stringify({ id: 'A' })],
    ['field_log_history_v1', '[{"id":"legacy-new"}]'], ['field_log_history_v1:__legacy__', '[{"id":"legacy-old"}]']]);
  const storage = { getItem: async k => data.get(k) ?? null,
    setItem: async (k,v) => data.set(k,v), removeItem: async k => data.delete(k) };
  const { offlineStorage } = load('lib/offline-storage.ts', {
    '@react-native-async-storage/async-storage': storage,
    '../i18n/config': {}, './i18n-strings': { tString: key => key },
  });
  await Promise.all(['one','two'].map(id => offlineStorage.upsertFieldLogHistoryFromPending({ id, timestamp:'2026-10-02', activityType:'Planting', status:'pending' })));
  assert.deepEqual((await offlineStorage.getFieldLogHistory()).map(r => r.id).sort(), ['one','two']);
  assert.equal(data.get('field_log_history_v1'), '[{"id":"legacy-new"}]');
  assert.equal(data.get('field_log_history_v1:__legacy__'), '[{"id":"legacy-old"}]');
});

test('a late sync response updates only its original account and never sends the next row with another token', async () => {
  const data = new Map([['auth_user', JSON.stringify({ id: 'A' })], ['auth_token', 'token-A'],
    ['pending_costs:A', JSON.stringify([{ id:'cost-A', amount:1, status:'pending' }, { id:'next-A', amount:2, status:'pending' }])],
    ['pending_costs:B', JSON.stringify([{ id:'cost-B', amount:3, status:'pending' }])]]);
  const storage = { getItem: async k => data.get(k) ?? null, setItem: async(k,v) => data.set(k,v), removeItem: async k => data.delete(k) };
  const common = { '@react-native-async-storage/async-storage':storage, '../i18n/config':{}, './i18n-strings':{tString:k=>k} };
  const offline = load('lib/offline-storage.ts', common);
  const calls=[];
  const { syncService } = load('lib/sync-service.ts', {
    ...common, './offline-storage':offline,
    axios:{ create:()=>({ post:async(path, body, config)=>{
      calls.push({path,body,config});
      data.set('auth_user',JSON.stringify({id:'B'}));data.set('auth_token','token-B');
      return {data:{}};
    } }) },
    './api-url':{API_URL:'http://unused'}, './api':{}, './image-data-url':{}, './image-hash':{}, './device-id':{}, './grower-offline-cache':{},
    './api-error':{apiErrorMessage:e=>e.message,axiosResponseStatus:()=>undefined},
  });
  await syncService.syncPendingCosts();
  assert.equal(calls.length,1);
  assert.equal(calls[0].config.headers.Authorization,'Bearer token-A');
  assert.equal(JSON.parse(data.get('pending_costs:A'))[0].status,'synced');
  assert.deepEqual(JSON.parse(data.get('pending_costs:B')),[{id:'cost-B',amount:3,status:'pending'}]);
});
