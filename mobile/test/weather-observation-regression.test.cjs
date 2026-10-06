const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { buildWeatherFieldEntryBody: build } = load('../shared/passport/weather-entry.ts');
const base = { farmId:'farm', parcelId:'parcel', plantingId:'planting', from:'2026-03-20T01:00', until:'2026-03-20T04:00', minimumC:'-2,5', maximumC:'0', frostObserved:null };
const entry = (id, notes='original') => ({id, farmId:'farm', parcelId:'parcel', plantingId:'planting', payload:build({...base, clientReference:id, notes})});
function deferred() { let resolve; const promise=new Promise(r=>resolve=r); return {resolve,promise}; }
function env(post) {
  global.__DEV__=false;
  const data=new Map([['auth_user',JSON.stringify({id:'a'})],['auth_token','token-a']]);
  const common={'@react-native-async-storage/async-storage':{getItem:async k=>data.get(k)??null,setItem:async(k,v)=>data.set(k,v),removeItem:async k=>data.delete(k)},'../i18n/config':{t:k=>k},'./i18n-strings':{tString:k=>k}};
  const offline=load('lib/offline-storage.ts', common);
  const sync=()=>load('lib/sync-service.ts',{...common,'./offline-storage':offline,axios:{create:()=>({post,get:async()=>({data:[]})})},'./api-url':{API_URL:'http://unused'},'./api':{},'./image-data-url':{},'./image-hash':{},'./device-id':{},'./api-error':{apiErrorMessage:e=>e.message,axiosResponseStatus:e=>e.response?.status}}).syncService;
  return {data, offline, sync, restart:()=>load('lib/offline-storage.ts',common)};
}

test('blank temperatures are rejected while zero and decimal commas remain valid',()=>{
  for(const field of ['minimumC','maximumC']) for(const value of ['', '  ', '\t']) assert.throws(()=>build({...base,clientReference:'x',[field]:value}),/Temperature is required/);
  assert.equal(build({...base,clientReference:'x'}).data.weather.maximumC,0);
  assert.equal(build({...base,clientReference:'x'}).data.weather.minimumC,-2.5);
});

test('server commit followed by lost response survives restart and replays the identical event',async()=>{
  const server=new Map(), requests=[]; let lose=true;
  const e=env(async(_path,payload)=>{requests.push(payload);const previous=server.get(payload.clientReference);if(previous)assert.deepEqual(previous,payload);server.set(payload.clientReference,payload);if(lose){lose=false;throw Error('Lost response');}return {data:{id:'server'}};});
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('one'));
  assert.equal((await e.sync().syncPendingWeatherObservations()).failed,1);
  assert.equal((await e.restart().offlineStorage.getPendingWeatherObservations()).length,1);
  assert.equal((await e.sync().syncPendingWeatherObservations()).success,1);
  assert.equal(server.size,1);assert.deepEqual(requests[0],requests[1]);
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('one'));
  assert.equal((await e.offline.offlineStorage.getPendingWeatherObservations()).length,0);
});

test('in-flight event cannot be overwritten and its response preserves the next observation',async()=>{
  const started=deferred(), reply=deferred();
  const e=env(async()=>{started.resolve();await reply.promise;return {data:{}};});
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('one'));
  const running=e.sync().syncPendingWeatherObservations();await started.promise;
  await assert.rejects(e.offline.offlineStorage.savePendingWeatherObservation(entry('one','changed')),/already saved/);
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('two','next observation'));
  reply.resolve();await running;
  const pending=await e.offline.offlineStorage.getPendingWeatherObservations();
  assert.deepEqual(pending.map(r=>r.id),['two']);assert.equal(pending[0].status,'pending');
  const history=await e.offline.offlineStorage.getFieldLogHistory();
  assert.equal(history.find(r=>r.id==='one').detailData.notes,'original');
  assert.equal(history.find(r=>r.id==='two').status,'pending');
});

test('compare-and-set never confirms or deletes a different stored snapshot',async()=>{
  const e=env(async()=>({data:{}}));
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('one','new content'));
  assert.equal(await e.offline.offlineStorage.settleWeatherObservation(entry('one','old content'),'synced'),false);
  assert.equal((await e.offline.offlineStorage.getPendingWeatherObservations())[0].payload.data.notes,'new content');
  assert.equal((await e.offline.offlineStorage.getFieldLogHistory())[0].status,'pending');
});

test('account switch during HTTP request keeps both queues and histories scoped',async()=>{
  const started=deferred(), reply=deferred();const calls=[];
  const e=env(async(_path,payload,config)=>{calls.push(config.headers.Authorization);started.resolve();await reply.promise;return {data:{}};});
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('a-one'));
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('a-two'));
  const running=e.sync().syncPendingWeatherObservations();await started.promise;
  e.data.set('auth_user',JSON.stringify({id:'b'}));e.data.set('auth_token','token-b');
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('b-one'));
  reply.resolve();await running;
  assert.deepEqual(calls,['Bearer token-a']);
  assert.deepEqual((await e.offline.offlineStorage.getPendingWeatherObservations()).map(r=>r.id),['b-one']);
  assert.deepEqual((await e.offline.offlineStorage.getFieldLogHistory()).map(r=>r.id),['b-one']);
  assert.deepEqual((await e.offline.offlineStorageForOwner('a').getPendingWeatherObservations()).map(r=>r.id),['a-two']);
});

test('a form from the previous account cannot start synchronization for the next account',async()=>{
  let calls=0;const e=env(async()=>{calls++;return {data:{}};});
  e.data.set('auth_user',JSON.stringify({id:'b'}));e.data.set('auth_token','token-b');
  await e.offline.offlineStorage.savePendingWeatherObservation(entry('b-one'));
  await assert.rejects(e.sync().syncPendingWeatherObservations('a'),/Account changed/);
  assert.equal(calls,0);
  assert.equal((await e.offline.offlineStorage.getPendingWeatherObservations())[0].status,'pending');
});

// Render the actual component and invoke handlers before React's next render.
function formScreen({save, sync=async()=>({success:1,failed:0}), online=true, pending=async()=>[]}={}) {
  const hooks=[];let cursor=0,tree,seq=0;
  const react={useCallback:fn=>fn,useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return [hooks[i],next=>{hooks[i]=typeof next==='function'?next(hooks[i]):next;}];},useRef(initial){const i=cursor++;if(!(i in hooks))hooks[i]={current:initial};return hooks[i];}};
  const Component=load('components/grower/WeatherObservationForm.tsx',{react,'react-native':{View:'View',Text:'Text',TextInput:'Input',TouchableOpacity:'Button'},'react-i18next':{useTranslation:()=>({t:k=>k})},'expo-crypto':{randomUUID:()=>`generated-${++seq}`},'../../contexts/AuthContext':{useAuth:()=>({user:{id:'a'}})},'../../lib/offline-storage':{currentStorageOwner:async()=>'a',offlineStorageForOwner:()=>({savePendingWeatherObservation:save,getPendingWeatherObservations:pending})},'../../lib/sync-service':{syncService:{syncPendingWeatherObservations:sync}},'../../lib/network-utils':{isDeviceOnline:async()=>online},'../../lib/api-error':{apiErrorMessage:e=>e.message},'./GrowerDateField':{GrowerDateField:'Date'},'./GrowerTimeField':{GrowerTimeField:'Time'}}).default;
  const render=()=>{cursor=0;tree=Component({farmId:'farm',parcelId:'parcel',plantingId:'planting'});};
  const nodes=()=>{const list=[];const visit=n=>{if(Array.isArray(n))return n.forEach(visit);if(n?.props){list.push(n);visit(n.props.children);}};visit(tree);return list;};
  const button=text=>nodes().find(n=>n.type==='Button'&&n.props.children?.props?.children===text);
  const input=key=>nodes().find(n=>n.type==='Input'&&n.props.accessibilityLabel===`glossary.productionHistory.${key}`);
  const change=(key,value)=>{input(key).props.onChangeText(value);render();};
  render();button('glossary.productionHistory.addWeather').props.onPress();render();change('minimumC','-2');change('maximumC','3');
  return {render,change,input,save:()=>button('common.save').props.onPress(),async flush(){for(let i=0;i<30;i++){await Promise.resolve();render();}}};
}

test('two immediate taps persist one event and the next saved form gets a fresh reference',async()=>{
  const rows=[];const screen=formScreen({save:async row=>rows.push(row),online:false});
  screen.save();screen.save();await screen.flush();
  assert.equal(rows.length,1);assert.equal(screen.input('minimumC').props.value,'');
  screen.change('minimumC','0');screen.change('maximumC','2');screen.save();await screen.flush();
  assert.equal(rows.length,2);assert.notEqual(rows[0].id,rows[1].id);
});

test('late sync success does not erase text entered for the next event',async()=>{
  const reply=deferred(), started=deferred();const rows=[];
  const screen=formScreen({save:async row=>rows.push(row),sync:async()=>{started.resolve();await reply.promise;return {success:1,failed:0};}});
  screen.save();await started.promise;screen.render();screen.change('notes','Next field visit');screen.change('minimumC','1');
  reply.resolve();await screen.flush();
  assert.equal(screen.input('notes').props.value,'Next field visit');assert.equal(screen.input('minimumC').props.value,'1');assert.equal(rows.length,1);
});

test('editing during local persistence keeps the unsaved draft',async()=>{
  const reply=deferred(),started=deferred();
  const screen=formScreen({online:false,save:async()=>{started.resolve();await reply.promise;}});
  screen.save();await started.promise;screen.change('notes','Changed before disk write completed');reply.resolve();await screen.flush();
  assert.equal(screen.input('notes').props.value,'Changed before disk write completed');
});
