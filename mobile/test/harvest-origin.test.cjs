const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

const planting = id => ({id, parcelId:'plot', announcementType:'PLANTING', status:'PLANNED', cropType:'Apple', estimatedDate:'2026-10-04'});
function harness(initialRows, initialIntent = null) {
  let cursor=0, dirty=false, value, intent=initialIntent, rows=initialRows;
  let parcels=[{id:'plot',cropType:'Apple',approvedAt:'2026-01-01',status:'ACTIVE'}];
  const slots=[], effects=[], sent=[], alerts=[];
  const same=(a,b)=>a && b && a.length===b.length && a.every((x,i)=>Object.is(x,b[i]));
  const react={
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;
      return [slots[i],next=>{const v=typeof next==='function'?next(slots[i]):next;if(!Object.is(v,slots[i])){slots[i]=v;dirty=true;}}];},
    useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useMemo(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
    useCallback(fn,deps){return react.useMemo(()=>fn,deps);},
    useEffect(fn,deps){const i=cursor++;const prev=slots[i];if(!prev||!same(prev.deps,deps))effects.push(()=>{prev?.cleanup?.();slots[i]={deps,cleanup:fn()};});},
  };
  const t=k=>k;
  const consume=()=>{intent=null;dirty=true;};
  const {useHarvestData}=load('features/grower/harvest/useHarvestData.ts',{
    react, 'react-i18next':{useTranslation:()=>({t})},'react-native':{Alert:{alert:(...args)=>alerts.push(args)}},
    '../../../lib/grower-permissions':{},
    '../../../lib/api':{estatesAPI:{getAll:async()=>[{id:'farm',name:'Farm'}]},parcelsAPI:{getByEstate:async()=>parcels},
      harvestAnnouncementsAPI:{getMy:async()=>{if(rows instanceof Error)throw rows;return rows;},create:async body=>{sent.push(body);return{};}}},
    '../../../lib/grower-offline-cache':{growerOfflineCache:{saveEstates:async()=>{},saveParcels:async()=>{}}},
    '../../../lib/offline-storage':{offlineStorage:{getPendingHarvestPlans:async()=>[]}},
    '../../../lib/network-utils':{isDeviceOnline:async()=>true},'../../../lib/sync-service':{syncService:{}},
    '../../../lib/api-error':{},'../plantings/map-planting-save-error':{},
  });
  function render(){for(let pass=0;pass<20;pass++){dirty=false;cursor=0;value=useHarvestData(intent,consume);effects.splice(0).forEach(fn=>fn());if(!dirty)return value;}throw Error('render loop');}
  render();
  return {render,sent,alerts,setRows(next){rows=next;},setParcels(next){parcels=next;},get value(){return value;},
    async flush(){for(let i=0;i<25;i++){await Promise.resolve();render();}}};
}

test('a missing route planting never becomes another planting on the same parcel',async()=>{
  const h=harness([planting('other')],{parcelId:'plot',plantingId:'requested'});await h.flush();
  assert.equal(h.value.selectedPlantingId,'requested');
  assert.equal(h.value.selectedPlantingUnavailable,true);
  h.value.setEstimatedQuantity('20');h.render();
  assert.equal(h.value.canSubmit,false);
  await h.value.handleSubmit();assert.equal(h.sent.length,0);
  assert.ok(h.alerts.some(args=>args[1].includes('harvestWorkflow.planUnavailable')));
});

test('only a deliberate replacement allows submitting another source planting',async()=>{
  const h=harness([planting('other')],{parcelId:'plot',plantingId:'requested'});await h.flush();
  h.value.setSelectedPlantingId('other');h.render();h.value.setEstimatedQuantity('20');h.render();
  assert.equal(h.value.selectedPlantingUnavailable,false);
  assert.equal(h.value.canSubmit,true);
  await h.value.handleSubmit();
  assert.equal(h.sent[0].sourcePlantingId,'other');assert.equal(h.sent[0].parcelId,'plot');
});

test('a refresh never replaces a selected planting that disappeared',async()=>{
  const h=harness([planting('original')]);await h.flush();assert.equal(h.value.selectedPlantingId,'original');
  h.setRows([planting('replacement')]);h.value.refreshParcels();await h.flush();
  assert.equal(h.value.selectedPlantingId,'original');assert.equal(h.value.selectedPlantingUnavailable,true);
});

test('a failed reload preserves the requested identity and retry restores that exact planting',async()=>{
  const h=harness(new Error('offline'),{parcelId:'plot',plantingId:'original'});await h.flush();
  assert.equal(h.value.selectedPlantingId,'original');assert.equal(h.value.selectedPlantingUnavailable,true);
  h.setRows([planting('newer'),planting('original')]);h.value.refreshParcels();await h.flush();
  assert.equal(h.value.selectedPlantingId,'original');assert.equal(h.value.selectedPlantingUnavailable,false);
});

test('a missing parcel is not replaced on refresh and its original selection recovers',async()=>{
  const h=harness([planting('original')],{parcelId:'plot',plantingId:'original'});await h.flush();
  h.value.setEstimatedQuantity('20');h.render();
  h.setParcels([{id:'different',status:'ACTIVE'}]);h.value.refreshParcels();await h.flush();
  assert.equal(h.value.parcelId,'plot');assert.equal(h.value.canSubmit,false);
  h.setParcels([{id:'plot',status:'ACTIVE',approvedAt:'2026-01-01'}]);h.value.refreshParcels();await h.flush();
  assert.equal(h.value.selectedPlantingId,'original');assert.equal(h.value.canSubmit,true);
  h.value.setParcelId('plot');h.render();
  assert.equal(h.value.selectedPlantingId,'original');
});
