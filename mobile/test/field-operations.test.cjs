const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { parseFieldOperation } = load('../shared/passport/field-operation.ts');
const { operationFromForm, operationEntryPayload } = load('lib/field-operation.ts');
const occurredAt='2026-05-01T06:00:00Z';
test('operation requires actual time and activity-specific evidence',()=>{
  const water={type:'IRRIGATION',occurredAt,waterLitres:500};
  assert.equal(parseFieldOperation(water).waterLitres,500);
  for(const change of [{waterLitres:0},{waterLitres:-1},{waterLitres:Infinity},{waterLitres:undefined},{occurredAt:'bad'},{occurredAt:'2026-02-30T10:00'},{occurredAt:'2026-05-01'},{occurredAt:'2026-05-01T24:00'},{occurredAt:'2100-01-01'},{endedAt:'2026-04-30'}])assert.throws(()=>parseFieldOperation({...water,...change}));
  assert.throws(()=>parseFieldOperation({type:'INSPECTION',occurredAt,notes:'  '}));
  assert.throws(()=>parseFieldOperation({type:'SPRAYING',occurredAt,materialName:'Test',quantity:2,unit:'unknown'}));
  assert.equal(parseFieldOperation({type:'INSPECTION',occurredAt,notes:' Leaves checked '}).notes,'Leaves checked');
});
test('mobile form preserves decimal input and sends planting, actual time, evidence and stable replay key',()=>{
  const operation=operationFromForm('SPRAYING',{occurredAt,endedAt:'',materialName:'Test material',quantity:'1,5',unit:'L',waterLitres:'200',areaHa:'0,25',method:'Manual'},'Field note');
  const entry={id:'stable-id',plantingId:'planting',parcelId:'parcel',materialID:'BAR123',operation,timestamp:'2026-05-02T10:00:00Z',location:{lat:43,lng:20}};
  const body=operationEntryPayload(entry,'farm','data:image/jpeg;base64,test');
  assert.equal(body.clientReference,'stable-id');assert.equal(body.data.plantingId,'planting');
  assert.equal(body.data.operation.quantity,1.5);assert.equal(body.data.operation.areaHa,0.25);
  assert.equal(body.data.date,'2026-05-01T06:00:00.000Z');assert.equal(body.data.capturedAt,entry.timestamp);
  assert.equal(body.fertilizerBarcode,'BAR123');assert.deepEqual(body.data.location,entry.location);
  assert.throws(()=>operationEntryPayload({...entry,plantingId:null},'farm','photo'));
  assert.throws(()=>operationEntryPayload({...entry,materialID:''},'farm','photo'));
});
test('actual offline sync retains a failed upload and retries the same operation without growth-log duplicates',async()=>{
  global.__DEV__=false;
  const data=new Map([['auth_user',JSON.stringify({id:'grower'})],['auth_token','token']]);
  const storage={getItem:async k=>data.get(k)??null,setItem:async(k,v)=>data.set(k,v),removeItem:async k=>data.delete(k)};
  const common={'@react-native-async-storage/async-storage':storage,'../i18n/config':{t:k=>k},'./i18n-strings':{tString:k=>k}};
  const offline=load('lib/offline-storage.ts',common);
  const id=await offline.offlineStorage.savePendingEntry({activityType:'Irrigation',estateId:'farm',parcelId:'parcel',harvestAnnouncementId:'planting',plantingId:'planting',photoUri:'file://photo.jpg',location:{lat:43,lng:20},operation:{type:'IRRIGATION',occurredAt,waterLitres:500,method:'Drip'}});
  const calls=[];let fail=true;
  const {syncService}=load('lib/sync-service.ts',{...common,'./offline-storage':offline,
    axios:{create:()=>({get:async()=>({data:[{id:'farm'}]}),post:async(path,body)=>{calls.push({path,body});if(fail)throw Error('Connection lost');return {data:{id:'server-id'}};}})},
    './api-url':{API_URL:'http://unused'},'./api':{},'./image-data-url':{imageUriToJpegDataUrl:async()=> 'data:image/jpeg;base64,test',assertDataUrlWithinSize:()=>{}},'./image-hash':{},'./device-id':{},
    './api-error':{apiErrorMessage:e=>e.message,axiosResponseStatus:()=>undefined}});
  assert.deepEqual(await syncService.syncPendingEntries(),{success:0,failed:1});
  assert.equal((await offline.offlineStorage.getPendingEntries())[0].status,'error');
  fail=false;
  assert.deepEqual(await syncService.syncPendingEntries(),{success:1,failed:0});
  assert.equal((await offline.offlineStorage.getPendingEntries()).length,0);
  assert.equal(calls.length,2);assert.equal(calls[0].path,'/field-entries');assert.deepEqual(calls[0],calls[1]);
  assert.equal(calls[1].body.clientReference,id);assert.equal(calls[1].body.data.operation.waterLitres,500);
  const history=await offline.offlineStorage.getFieldLogHistory();assert.equal(history[0].status,'synced');
  assert.equal(history[0].detailData.operation.waterLitres,500);assert.equal(history[0].timestamp,occurredAt);
  const {fieldEntryToHistoryItem,mergeFieldLogHistory}=load('lib/field-log-history.ts');
  const server=fieldEntryToHistoryItem({id:'server-id',clientReference:id,type:'IRRIGATION',farmId:'farm',plantingId:'planting',createdAt:'2026-05-02',occurredAt,data:{operation:calls[1].body.data.operation}});
  assert.equal(server.activityType,'Irrigation');assert.equal(server.detailData.operation.waterLitres,500);
  const merged=mergeFieldLogHistory(history,[server],[]);assert.equal(merged.length,1);assert.equal(merged[0].id,'server-id');
});
test('actual mobile operation form exposes relevant inputs and passes edits into the saved payload',()=>{
  let value={occurredAt:'2026-05-01T08:00',endedAt:'',materialName:'',quantity:'',unit:'L',waterLitres:'',areaHa:'',method:''},notes='';
  const jsx=(type,props)=>({type,props});
  const Form=load('components/grower/FieldOperationFields.tsx',{
    'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},
    'react-native':{View:'View',Text:'Text',Platform:{OS:'web'}},
    'react-i18next':{useTranslation:()=>({t:k=>k})},
    '../../design-system':{EnterpriseTextField:'Input',EnterpriseTextArea:'Area'},
    './GrowerDateField':{GrowerDateField:'Date'},'./GrowerSelectField':{GrowerSelectField:'Select'},
  }).default;
  const nodes=tree=>{const out=[];function visit(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(visit);return;}out.push(n);visit(n.props?.children);}visit(tree);return out;};
  const render=type=>nodes(Form({type,value,onChange:v=>value=v,notes,onNotesChange:v=>notes=v}));
  const input=(type,key)=>render(type).find(n=>n.props?.label===`glossary.productionHistory.${key}`);
  assert.equal(input('IRRIGATION','materialName'),undefined);
  input('IRRIGATION','waterRequired').props.onChangeText('500');
  input('IRRIGATION','method').props.onChangeText('Drip');
  assert.equal(operationFromForm('IRRIGATION',value,notes).waterLitres,500);
  assert.equal(input('INSPECTION','waterRequired'),undefined);
  input('INSPECTION','inspectionFindings').props.onChangeText('Leaves checked');
  assert.equal(operationFromForm('INSPECTION',value,notes).notes,'Leaves checked');
  input('SPRAYING','materialName').props.onChangeText('Registered material');
  input('SPRAYING','usedQuantity').props.onChangeText('1,5');
  input('SPRAYING','unit').props.onSelect('mL');
  const operation=operationFromForm('SPRAYING',value,notes);
  assert.equal(operation.materialName,'Registered material');assert.equal(operation.quantity,1.5);assert.equal(operation.unit,'mL');
});
