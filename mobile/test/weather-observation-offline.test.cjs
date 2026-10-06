const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { buildWeatherFieldEntryBody, weatherEntryRequestIdentity } = load('../shared/passport/weather-entry.ts');

const baseForm = {
  from: '2026-03-20 01:00',
  until: '2026-03-20 05:00',
  minimumC: '-2,5',
  maximumC: '3,2',
  frostObserved: true,
  notes: 'Frost on planting',
};

test('buildWeatherFieldEntryBody keeps stable clientReference and grower observation source', () => {
  const body = buildWeatherFieldEntryBody({
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    clientReference: 'weather-local-1',
    ...baseForm,
  });
  assert.equal(body.clientReference, 'weather-local-1');
  assert.equal(body.data.weather.source, 'GROWER_OBSERVATION');
  assert.equal(body.data.requestIdentity, weatherEntryRequestIdentity({
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    weather: body.data.weather,
    notes: baseForm.notes,
  }));
});

test('weather offline queue survives restart, retries lost response, and isolates accounts', async () => {
  global.__DEV__ = false;
  const data = new Map([['auth_user', JSON.stringify({ id: 'grower-a' })], ['auth_token', 'token-a']]);
  const storage = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => data.set(key, value),
    removeItem: async (key) => data.delete(key),
  };
  const common = {
    '@react-native-async-storage/async-storage': storage,
    '../i18n/config': { t: (k) => k },
    './i18n-strings': { tString: (k) => k },
  };
  const offline = load('lib/offline-storage.ts', common);
  const body = buildWeatherFieldEntryBody({
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    clientReference: 'weather-local-2',
    ...baseForm,
  });
  await offline.offlineStorage.savePendingWeatherObservation({
    id: 'weather-local-2',
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    payload: body,
  });

  const offlineAfterRestart = load('lib/offline-storage.ts', common);
  assert.equal((await offlineAfterRestart.offlineStorage.getPendingWeatherObservations()).length, 1);

  const calls = [];
  let failOnce = true;
  const { syncService } = load('lib/sync-service.ts', {
    ...common,
    './offline-storage': offlineAfterRestart,
    axios: {
      create: () => ({
        post: async (path, payload) => {
          calls.push({ path, payload });
          if (failOnce) throw new Error('Connection lost');
          return { data: { id: 'server-row', clientReference: payload.clientReference } };
        },
        get: async () => ({ data: [] }),
      }),
    },
    './api-url': { API_URL: 'http://unused' },
    './api': {},
    './image-data-url': {},
    './image-hash': {},
    './device-id': {},
    './api-error': {
      apiErrorMessage: (e) => (e instanceof Error ? e.message : String(e)),
      axiosResponseStatus: () => undefined,
    },
  });

  assert.deepEqual(await syncService.syncPendingWeatherObservations(), { success: 0, failed: 1 });
  assert.equal((await offlineAfterRestart.offlineStorage.getPendingWeatherObservations())[0].status, 'error');
  failOnce = false;
  assert.deepEqual(await syncService.syncPendingWeatherObservations(), { success: 1, failed: 0 });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].payload, calls[1].payload);
  assert.equal((await offlineAfterRestart.offlineStorage.getPendingWeatherObservations()).length, 0);

  data.set('auth_user', JSON.stringify({ id: 'grower-b' }));
  const offlineB = load('lib/offline-storage.ts', common);
  assert.equal((await offlineB.offlineStorage.getPendingWeatherObservations()).length, 0);
});

test('saved observations cannot be overwritten; server conflicts remain visible without automatic retry', async () => {
  global.__DEV__ = false;
  const data = new Map([['auth_user', JSON.stringify({ id: 'grower-a' })], ['auth_token', 'token-a']]);
  const storage = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => data.set(key, value),
    removeItem: async (key) => data.delete(key),
  };
  const common = {
    '@react-native-async-storage/async-storage': storage,
    '../i18n/config': { t: (k) => k },
    './i18n-strings': { tString: (k) => k },
  };
  const offline = load('lib/offline-storage.ts', common);
  const original = buildWeatherFieldEntryBody({
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    clientReference: 'weather-local-3',
    ...baseForm,
  });
  await offline.offlineStorage.savePendingWeatherObservation({
    id: 'weather-local-3',
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    payload: original,
  });
  const changed = buildWeatherFieldEntryBody({
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    clientReference: 'weather-local-3',
    ...baseForm,
    notes: 'Different frost note',
  });
  await assert.rejects(offline.offlineStorage.savePendingWeatherObservation({
    id: 'weather-local-3',
    farmId: 'farm-1',
    parcelId: 'parcel-1',
    plantingId: 'planting-1',
    payload: changed,
  }), /already saved/);
  const row = (await offline.offlineStorage.getPendingWeatherObservations())[0];
  assert.equal(row.payload.data.requestIdentity, original.data.requestIdentity);

  const { syncService } = load('lib/sync-service.ts', {
    ...common,
    './offline-storage': offline,
    axios: {
      create: () => ({
        post: async (_path, payload) => {
          const err = new Error('Conflict');
          err.response = { status: 409, data: { message: 'This reference belongs to a different weather observation' } };
          throw err;
        },
        get: async () => ({ data: [] }),
      }),
    },
    './api-url': { API_URL: 'http://unused' },
    './api': {},
    './image-data-url': {},
    './image-hash': {},
    './device-id': {},
    './api-error': {
      apiErrorMessage: (e) => (e.response?.data?.message ?? e.message),
      axiosResponseStatus: (e) => e.response?.status,
    },
  });
  assert.deepEqual(await syncService.syncPendingWeatherObservations(), { success: 0, failed: 1 });
  const failed = (await offline.offlineStorage.getPendingWeatherObservations())[0];
  assert.equal(failed.status, 'error');
  assert.match(failed.error, /different weather observation/i);
  assert.equal(failed.conflict, true);
  assert.deepEqual(await syncService.syncPendingWeatherObservations(), { success: 0, failed: 0 });
});
