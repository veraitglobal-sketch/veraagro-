const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const workflow = load('lib/batch-workflow.ts');
const rows = [{ id: 'lot-a', batchId: 'BATCH-A' }, { id: 'lot-b', batchId: 'BATCH-B' }];

function selection(initialParams = {}) {
  let params = initialParams;
  let choice = null;
  const { useWorkflowBatchSelection } = load('hooks/useWorkflowBatchSelection.ts', {
    react: { useState: () => [choice, (value) => { choice = value; }], useCallback: (fn) => fn },
    'expo-router': { useLocalSearchParams: () => params },
    '../lib/batch-workflow': workflow,
  });
  return { render: (data = rows, auto = true) => useWorkflowBatchSelection(data, auto),
    navigate: (value) => { params = value; } };
}

test('an explicit second lot survives delayed loading and list reordering', () => {
  const screen = selection({ batchId: 'lot-b' });
  assert.equal(screen.render([]).selectedBatchId, '');
  assert.equal(screen.render().selectedBatchId, 'lot-b');
  assert.equal(screen.render([...rows].reverse()).selectedBatchId, 'lot-b');
});

test('a printed batch code and array route parameter resolve to the internal ID', () => {
  assert.equal(selection({ batchId: [' BATCH-B ', 'BATCH-A'] }).render().selectedBatchId, 'lot-b');
});

test('an unavailable or filtered explicit lot never silently selects another lot', () => {
  const screen = selection({ batchId: 'lot-b' });
  assert.equal(screen.render([rows[0]]).selectedBatchId, '');
  assert.equal(screen.render([rows[0]]).missingRequestedBatch, true);
  screen.render().setSelectedBatchId('lot-a');
  assert.equal(screen.render().selectedBatchId, 'lot-a');
});

test('new route parameters supersede a manual selection on an existing screen', () => {
  const screen = selection({ batchId: 'missing' });
  screen.render().setSelectedBatchId('lot-a');
  assert.equal(screen.render().selectedBatchId, 'lot-a');
  screen.navigate({ batchId: 'lot-b' });
  assert.equal(screen.render().selectedBatchId, 'lot-b');
});

test('packing and transport menu entry require a deliberate selection', () => {
  const screen = selection();
  assert.equal(screen.render(rows, false).selectedBatchId, '');
  screen.render(rows, false).setSelectedBatchId('lot-b');
  assert.equal(screen.render(rows, false).selectedBatchId, 'lot-b');
  assert.equal(selection().render().selectedBatchId, 'lot-a');
});

test('workflow buttons carry the same internal lot through packing, quality, compliance and transport', () => {
  const pushed = [];
  const { BatchWorkflowActions } = load('features/grower/batches/BatchWorkflowActions.tsx', {
    'expo-router': { useRouter: () => ({ push: (href) => pushed.push(href) }) },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    'lucide-react-native': new Proxy({}, { get: (_, name) => String(name) }),
    '../../../design-system/EnterpriseNavSection': { EnterpriseNavSection: 'NavSection' },
    '../../../lib/batch-workflow': workflow,
  });
  let selectedId = selection({ batchId: 'BATCH-B' }).render().selectedBatchId;
  for (const step of ['packing', 'labels', 'quality', 'compliance', 'transport', 'detail']) {
    const view = BatchWorkflowActions({ batchId: selectedId, steps: [step] });
    view.props.items[0].onPress();
    const route = pushed.at(-1);
    assert.equal(route.params[step === 'detail' ? 'id' : 'batchId'], 'lot-b');
    if (step !== 'detail') selectedId = selection(route.params).render().selectedBatchId;
  }
  assert.equal(BatchWorkflowActions({ batchId: '', steps: ['packing'] }), null);
  assert.throws(() => workflow.batchWorkflowHref('quality', '  '));
});

test('a failed batch list request remains an error instead of an empty successful list', async () => {
  const offline = new Error('offline');
  const { batchesAPI } = load('lib/api/batches.ts', {
    './client': { get: async () => { throw offline; } },
    '../api-url': { API_URL: 'http://unused.invalid' },
    '../api-error': { axiosResponseStatus: () => undefined },
  });
  await assert.rejects(batchesAPI.getAll(), (error) => error === offline);
});

// Deterministic hook unit harness. Effects/native UI are not mounted; requests are triggered explicitly.
function hookState() {
  const slots = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { return react.useState(() => ({ current: initial }))[0]; },
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: () => {},
  };
  return { react, render(fn) { cursor = 0; return fn(); } };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function hookMocks(state, selectionState) {
  return {
    react: state.react,
    'react-native': { Alert: { alert() {} } },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    '../../../hooks/useWorkflowBatchSelection': { useWorkflowBatchSelection: () => ({
      selectedBatchId: selectionState.id, setSelectedBatchId: (id) => { selectionState.id = id; },
    }) },
    '../../../lib/grower-offline-cache': { growerOfflineCache: { saveBatches: async () => {} } },
  };
}

test('late quality response cannot overwrite the newly selected lot or enable editing its old values', async () => {
  const state = hookState();
  const selected = { id: 'lot-a' };
  const a = deferred();
  const b = deferred();
  const { useQualityEntryData } = load('features/grower/quality-entry/useQualityEntryData.ts', {
    ...hookMocks(state, selected),
    'expo-router': { useRouter: () => ({}) },
    '../../../lib/batch-workflow': workflow,
    '../../../lib/theme': { theme: {} },
    '../../../lib/api': { batchesAPI: {}, qualityEntryAPI: {
      getByBatch: (id) => id === 'lot-a' ? a.promise : b.promise,
    } },
  });
  const render = () => state.render(useQualityEntryData);
  assert.equal(render().canEditQuality, false);
  const first = render().loadQualityEntry();
  selected.id = 'lot-b';
  assert.equal(render().qualityEntry, null);
  const second = render().loadQualityEntry();
  b.resolve({ id: 'quality-b', status: 'DRAFT', qualityScore: 92, notes: 'B' });
  await second;
  a.resolve({ id: 'quality-a', status: 'DRAFT', qualityScore: 50, notes: 'A' });
  await first;
  assert.equal(render().qualityEntry.id, 'quality-b');
  assert.equal(render().qualityScore, '92');
  assert.equal(render().notes, 'B');
  assert.equal(render().canEditQuality, true);
});

test('late compliance status and camera result stay out of a different lot', async () => {
  const state = hookState();
  const selected = { id: 'lot-a' };
  const a = deferred();
  const b = deferred();
  const camera = deferred();
  const { useMaterialCompliance } = load('features/grower/compliance-photos/useMaterialCompliance.ts', {
    ...hookMocks(state, selected),
    '../../../lib/camera-picker': { pickFromCamera: () => camera.promise },
    '../../../lib/image-data-url': { imageUriToJpegDataUrl: async () => 'data:image/jpeg;base64,A', assertDataUrlWithinSize() {} },
    '../../../lib/api-error': { apiErrorMessage: () => 'error' },
    '../../../lib/api': { batchesAPI: {}, materialControlAPI: {
      getComplianceStatus: (id) => id === 'lot-a' ? a.promise : b.promise,
    } },
  });
  const render = () => state.render(useMaterialCompliance);
  const first = render().refetchStatus();
  const photo = render().takePhoto('PUNNETS');
  selected.id = 'lot-b';
  assert.equal(render().complianceStatus, null);
  const second = render().refetchStatus();
  b.resolve({ complete: false, stickerRollId: 'ROLL-B' });
  await second;
  a.resolve({ complete: true, stickerRollId: 'ROLL-A' });
  camera.resolve({ uri: 'file:///lot-a.jpg' });
  await Promise.all([first, photo]);
  assert.equal(render().complianceStatus.stickerRollId, 'ROLL-B');
  assert.equal(render().complianceStatus.complete, false);
  assert.deepEqual(render().photos, {});
  assert.equal(render().statusLoading, false);
});

test('batch detail tolerates a missing reference, merges packing, and hides the previous lot during navigation', async () => {
  const state = hookState();
  const { useBatchDetailData } = load('features/grower/batches/useBatchDetailData.ts', {
    react: state.react,
    '@react-navigation/native': { useFocusEffect() {} },
    '../../../lib/theme': { theme: {} },
    '../../../lib/api': { batchesAPI: { getOne: async (id) => ({
      batch: { id }, traceability: { packing: { completedAt: '2026-09-26T10:00:00Z' } },
    }) } },
  });
  const render = (id) => state.render(() => useBatchDetailData(id));
  assert.equal(render(undefined).batch, null);
  await render(undefined).onRefresh();
  assert.equal(render(undefined).loading, false);
  await render('lot-a').onRefresh();
  assert.equal(render('lot-a').batch.packing.completedAt, '2026-09-26T10:00:00Z');
  assert.equal(render('lot-b').batch, null);
  await render('lot-b').onRefresh();
  assert.equal(render('lot-b').batch.id, 'lot-b');
});
