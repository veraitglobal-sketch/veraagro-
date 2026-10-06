const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
const lot = { id: 'available-lot', batchId: 'LOT-1', productName: 'Raspberry', quantity: 10, unit: 'kg' };

// Run the real component's effects and event handlers with deterministic network timing.
function panel(api, overrides = {}) {
  let cursor = 0, dirty = false, tree;
  const hooks = [], effects = [];
  const react = {
    useState(initial) {
      const slot = cursor++;
      if (!(slot in hooks)) hooks[slot] = typeof initial === 'function' ? initial() : initial;
      return [hooks[slot], next => { hooks[slot] = typeof next === 'function' ? next(hooks[slot]) : next; dirty = true; }];
    },
    useRef(initial) {
      const slot = cursor++;
      if (!(slot in hooks)) hooks[slot] = { current: initial };
      return hooks[slot];
    },
    useEffect(effect, deps) {
      const slot = cursor++;
      const previous = hooks[slot];
      if (!previous || deps.some((v, i) => v !== previous.deps[i])) {
        effects.push(() => { previous?.cleanup?.(); hooks[slot] = { deps, cleanup: effect() }; });
      }
    },
  };
  const { OrderPackingPanel } = load('features/grower/orders/OrderPackingPanel.tsx', {
    react,
    'react-native': { View:'View', Text:'Text', TextInput:'Input', TouchableOpacity:'Button', ActivityIndicator:'Spinner', StyleSheet:{create:s=>s} },
    'expo-router': { useRouter: () => ({ push: () => {} }) },
    'react-i18next': { useTranslation: () => ({ t:k=>k }) },
    '../../../lib/api': { ordersAPI:api },
    '../../../lib/enterprise-ui': { enterpriseColors:{}, enterpriseUi:{} },
    '../../../lib/date-locale': { useAppLocaleTag:()=> 'en-GB' },
    '../../../lib/api-error': { apiErrorMessage:(_e,fallback)=>fallback },
  });
  const order = { id:'order', status:'PAID', packCount:2, packSizeKg:5, nextAction:'PREPARE_AND_PACK', ...overrides };
  function render() {
    for (let pass = 0; pass < 15; pass++) {
      dirty = false; cursor = 0;
      tree = OrderPackingPanel({ order, onSaved: () => {} });
      effects.splice(0).forEach(effect=>effect());
      if (!dirty) return;
    }
    throw new Error('Unexpected render loop');
  }
  function nodes() {
    const result = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (node && typeof node === 'object') { result.push(node); visit(node.props?.children); }
    }
    visit(tree); return result;
  }
  function button(text) {
    const contains = n => n === text || Array.isArray(n) && n.some(contains) || !!(n && typeof n === 'object' && contains(n.props?.children));
    return nodes().find(n => n.type === 'Button' && contains(n.props.children));
  }
  render();
  return {
    render, button,
    texts:()=>nodes().filter(n=>n.type==='Text').map(n=>n.props.children),
    async flush() { for(let i=0;i<5;i++){await Promise.resolve();render();} },
    open() { (button('producer.ordersPrepare.record') ?? button('producer.ordersPrepare.edit')).props.onPress(); render(); },
  };
}

test('lot request failure shows retry, blocks save, and preserves the difference from an empty list', async () => {
  let calls = 0;
  const sent = [];
  const screen = panel({ getCompatibleBatches:async()=>{if (++calls===1) throw Error('offline');return [lot];}, recordPacking:async(...args)=>sent.push(args) });
  screen.open(); await screen.flush();
  assert.ok(screen.texts().includes('transportForm.loadFailed'));
  assert.ok(!screen.texts().includes('producer.ordersPrepare.noLots'));
  assert.equal(screen.button('producer.ordersPrepare.save').props.disabled, true);
  await screen.button('producer.ordersPrepare.save').props.onPress();
  assert.equal(sent.length,0);
  screen.button('common.retry').props.onPress();screen.render();await screen.flush();
  assert.equal(screen.button('producer.ordersPrepare.save').props.disabled,false);
});

test('an unavailable previously packed lot is never submitted instead of a compatible lot', async () => {
  const sent = [];
  const screen = panel({ getCompatibleBatches:async()=>[lot], recordPacking:async(_id,body)=>sent.push(body) }, {packedBatchId:'removed-lot'});
  screen.open();await screen.flush();
  screen.button('producer.ordersPrepare.save').props.onPress();await screen.flush();
  assert.equal(sent.length,1);
  assert.equal(sent[0].batchId,'available-lot');
});

test('reopening the form blocks stale lots until the new request finishes', async () => {
  let calls=0;const pending=deferred();
  const screen=panel({getCompatibleBatches:()=>++calls===1?Promise.resolve([lot]):pending.promise,recordPacking:async()=>{throw Error('must not submit');}});
  screen.open();await screen.flush();
  screen.button('common.cancel').props.onPress();screen.render();screen.open();
  assert.equal(screen.button('producer.ordersPrepare.save').props.disabled,true);
  pending.resolve([]);await screen.flush();
  assert.ok(screen.texts().includes('producer.ordersPrepare.noLots'));
  assert.equal(screen.button('producer.ordersPrepare.save').props.disabled,true);
});

test('two immediate save taps send only one packing request', async () => {
  let calls=0;const pending=deferred();
  const screen=panel({getCompatibleBatches:async()=>[lot],recordPacking:()=>{calls++;return pending.promise;}});
  screen.open();await screen.flush();
  const save=screen.button('producer.ordersPrepare.save').props.onPress;
  save();save();
  assert.equal(calls,1);
  pending.resolve({});await screen.flush();
});
