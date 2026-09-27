const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const workflow = load('lib/batch-workflow.ts');
const rows = [
  { id: 'lot-a', batchId: 'BATCH-A', productName: 'Apple', status: 'PACKED' },
  { id: 'lot-b', batchId: 'BATCH-B', productName: 'Pear', status: 'PACKED' },
];
function render(params) {
  // Render the actual screen with loaded API rows; effects do not call native APIs.
  const react = { useState: value => [Array.isArray(value) ? rows : value === true ? false : value, () => {}],
    useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: () => {} };
  const router = { useLocalSearchParams: () => params, useRouter: () => ({}) };
  const selection = load('hooks/useWorkflowBatchSelection.ts', { react, 'expo-router': router, '../lib/batch-workflow': workflow });
  const { default: Screen } = load('app/(producer)/missions-create.tsx', {
    react, 'expo-router': router,
    'react-native': { View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'Button',
      TextInput: 'Input', ActivityIndicator: 'Loading', Alert: {}, Platform: { OS: 'ios' },
      KeyboardAvoidingView: 'KeyboardView', Keyboard: {}, RefreshControl: 'Refresh', StyleSheet: { create: value => value } },
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
    '@react-navigation/native': { useFocusEffect: () => {} },
    'expo-location': {}, 'lucide-react-native': { MapPin: 'Icon', CheckCircle2: 'Check', ChevronRight: 'Chevron', Truck: 'Truck', ArrowRight: 'Arrow' },
    '../../lib/batch-workflow': workflow, '../../hooks/useWorkflowBatchSelection': selection,
    '../../lib/grower-permissions': {}, '../../lib/enterprise-ui': { enterpriseColors: {}, enterpriseUi: {} },
    '../../lib/grower-ui': { growerUi: {} }, '../../components/enterprise/EnterpriseNotice': { EnterpriseNotice: 'Notice' },
    '../../lib/screen-insets': { useBioVeraScreenPadding: () => ({ bottomInset: 0 }) },
    '../../components/grower/GrowerStackHeader': { GrowerStackHeader: 'Header' }, '../../lib/api': {}, '../../lib/api-error': {},
    '../../features/grower/batches/batch-status-i18n': { getBatchStatusLabel: () => 'Packed' },
  });
  const nodes = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    nodes.push(node); visit(node.props?.children);
  }
  visit(Screen());
  return nodes;
}
const lotCards = nodes => nodes.filter(node => rows.some(row => row.id === node.key));
test('requesting transport from a lot shows only that lot, including links using its public code', () => {
  for (const batchId of ['lot-b', 'BATCH-B', ['BATCH-B']]) {
    const cards = lotCards(render({ batchId }));
    assert.deepEqual(cards.map(node => node.key), ['lot-b']);
    assert.equal(cards[0].props.disabled, true);
  }
});
test('general transport entry retains the lot chooser', () => {
  const cards = lotCards(render({}));
  assert.deepEqual(cards.map(node => node.key), ['lot-a', 'lot-b']);
  assert.ok(cards.every(node => node.props.disabled === false));
});
test('unavailable linked lot never exposes unrelated alternatives or enables submission', () => {
  const nodes = render({ batchId: 'missing' });
  assert.equal(lotCards(nodes).length, 0);
  assert.ok(nodes.some(node => node.type === 'Notice' && node.props.title === 'batchWorkflow.unavailable'));
  const submit = nodes.find(node => node.type === 'Button' && node.props.accessibilityLabel === 'producer.missionsCreate.submitCta');
  assert.equal(submit.props.disabled, true);
});
