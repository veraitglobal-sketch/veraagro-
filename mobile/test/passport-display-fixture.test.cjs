const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

function deferred() { let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject}; }
const fixture = id => ({
  batch:{batchId:id,productName:id,quantity:120,unit:'kg',harvestDate:'2026-08-05'},
  summary:{productName:id,productDescription:'Sweet raspberry',productPhotoUrl:'https://example/product.jpg',lot:{batchId:id,totalQuantity:120,unit:'kg'},storage:{productStorageConditions:'Cool',freshnessEstimate:{source:'freshness_trackers',remainingHours:40}},identifiedPackaging:null},
  origin:{farmName:'Farm',regionLabel:'Serbia'}, timeline:{harvested:'2026-08-05',arrived:'2026-08-08T10:00:00Z'},
  growthLogs:[{imageUrl:'https://example/growth.jpg',notes:'Flowering stage',networkTimestamp:'2026-06-01'}],
  treatments:[{productName:'Bio spray',dosage:'2 L/ha',appliedAt:'2026-07-01'}],
  coldChainProof:{hasReadings:true,minTemp:2.1,maxTemp:7.4,evaluationCriteria:'2–8 °C',readingsWithinCriteria:true,readingsCount:3},
  protocol360:{levels:[{level:1,name:'Field check',status:'PASS'}]},
  seedOrigin:[{product:'Malina',variety:'Test variety',lotNumber:'MATERIAL-TEST-001',producer:{name:'Registered nursery',city:'Test city',country:'RS'},seedCropYear:2025,productionDate:'2025-10-01',plantedFrom:'2026-03-01',plantedTo:'2026-03-02',germinationPct:0,purityPct:99}],
  productionHistory:[{id:'irrigation',kind:'irrigation',date:'2026-05-01T06:00:00Z',endDate:'2026-05-01T07:00:00Z',source:'fieldDiary',facts:[{label:'waterLitres',value:'500 L'},{label:'method',value:'Drip'}],photos:['https://example/irrigation.jpg']},{id:'inspection',kind:'inspection',date:'2026-05-03T08:00:00Z',source:'fieldDiary',facts:[{label:'notes',value:'Leaves checked'}]},{id:'weather-1',kind:'weather',date:'2026-03-20T01:00:00Z',endDate:'2026-03-20T05:00:00Z',recordedAt:'2026-03-21T09:00:00Z',source:'fieldDiary',facts:[{label:'temperature',value:'-2.5 – 3.2 °C'},{label:'frost',value:'yes'},{label:'notes',value:'Frost observed on planting'}]}],
  historyGaps:['seed'],
  originCandidate:{supplierName:'Provisional nursery',status:'PENDING_DOCUMENTATION',verified:false,recordedAt:'2026-10-04T12:00:00Z'},
});
function screen(fetch) {
  const hooks=[],effects=[];let cursor=0,dirty=false,tree;
  let props={visible:true,batchId:'A',onClose(){}};
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
  const react={
    useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=typeof initial==='function'?initial():initial;return[hooks[i],next=>{const value=typeof next==='function'?next(hooks[i]):next;if(!Object.is(value,hooks[i])){hooks[i]=value;dirty=true;}}];},
    useRef(initial){const i=cursor++;return hooks[i]??(hooks[i]={current:initial});},
    useMemo(fn,deps){const i=cursor++;if(!hooks[i]||!same(hooks[i].deps,deps))hooks[i]={deps,value:fn()};return hooks[i].value;},
    useCallback(fn,deps){return react.useMemo(()=>fn,deps);},
    useEffect(fn,deps){const i=cursor++;const old=hooks[i];if(!old||!same(old.deps,deps))effects.push(()=>{old?.cleanup?.();hooks[i]={deps,cleanup:fn()};});},
  };
  const t=(key,opts)=>opts?`${key} ${Object.values(opts).join(' ')}`:key;
  const {default:Component}=load('components/ProductPassport.tsx',{
    react,'react-i18next':{useTranslation:()=>({t,i18n:{language:'en'}})},
    'react-native':{View:'View',Text:'Text',TouchableOpacity:'Button',ScrollView:'Scroll',ActivityIndicator:'Spinner',Image:'Image',Linking:{openURL(){}}},
    'lucide-react-native':new Proxy({}, {get:(_,key)=>key}),
    './enterprise/BioVeraBottomSheet':{BioVeraBottomSheet:'Sheet'},'./ReportProblemForm':{default:'Report'},
    '../lib/api-url':{API_URL:'http://localhost:3000'},
    '../lib/api':{passportAPI:{getByBatchId:fetch}},
  });
  function expand(node){
    if(Array.isArray(node))return node.map(expand);
    if(!node||typeof node!=='object')return node;
    if(typeof node.type==='function')return expand(node.type(node.props));
    return {...node,props:{...node.props,children:expand(node.props?.children)}};
  }
  function render(){for(let i=0;i<25;i++){cursor=0;dirty=false;tree=expand(Component(props));effects.splice(0).forEach(fn=>fn());if(!dirty)return;}throw Error('render loop');}
  function nodes(){const out=[];function visit(n){if(Array.isArray(n))n.forEach(visit);else if(n&&typeof n==='object'){out.push(n);visit(n.props?.children);}}visit(tree);return out;}
  function content(n){if(n==null||typeof n==='boolean')return '';if(Array.isArray(n))return n.map(content).join(' ');if(typeof n==='object')return content(n.props?.children);return String(n);}
  render();
  return{nodes,text:()=>content(tree),setProps(next){props={...props,...next};render();},async flush(){for(let i=0;i<12;i++){await Promise.resolve();render();}},openSections(){nodes().filter(n=>n.type==='Button'&&n.props.accessibilityRole==='button').forEach(n=>n.props.onPress());render();}};
}

test('the real mobile passport renders photos, notes, dose, temperature, delivery and quality after expansion',async()=>{
  const ui=screen(async()=>fixture('A'));await ui.flush();ui.openSections();
  const text=ui.text();
  for(const value of ['Sweet raspberry','Flowering stage','2 L/ha','2.1','7.4','Field check','buyer.passport.journeyArrived','500 L','Drip','Leaves checked','glossary.productionHistory.irrigation','glossary.productionHistory.inspection'])assert.ok(text.includes(value),`missing ${value}`);
  assert.ok(ui.nodes().some(n=>n.type==='Image'&&n.props.source.uri==='https://example/growth.jpg'));
  for(const value of ['-2.5 – 3.2 °C','Frost observed on planting','glossary.productionHistory.fieldDiary','glossary.productionHistory.recordedAt','glossary.productionHistory.yes']) assert.ok(text.includes(value),`missing history: ${value}`);
  for(const value of ['Test variety','MATERIAL-TEST-001','Registered nursery','Test city, RS','2025','99','glossary.productionHistory.productionDate','glossary.productionHistory.plantingPeriod']) assert.ok(text.includes(value),`missing material origin: ${value}`);
  for(const value of ['Provisional nursery','glossary.productionHistory.pendingOrigin','glossary.productionHistory.pendingOriginHelp']) assert.ok(text.includes(value),`missing pending origin: ${value}`);
});

test('the actual component ignores a late response after switching lots',async()=>{
  const a=deferred(),b=deferred();const ui=screen(id=>id==='A'?a.promise:b.promise);await ui.flush();ui.setProps({batchId:'B'});await ui.flush();
  b.resolve(fixture('B'));await ui.flush();a.resolve(fixture('A'));await ui.flush();
  assert.ok(ui.text().includes('B'));assert.ok(!ui.text().includes('buyer.passport.loadFailed'));
  assert.ok(ui.nodes().some(n=>n.type==='Text'&&n.props.children==='B'));
  assert.ok(!ui.nodes().some(n=>n.type==='Text'&&n.props.children==='A'));
});

test('the actual component ignores a late error after switching lots',async()=>{
  const a=deferred();const ui=screen(id=>id==='A'?a.promise:Promise.resolve(fixture('B')));await ui.flush();ui.setProps({batchId:'B'});await ui.flush();
  a.reject(Error('stale failure'));await ui.flush();assert.ok(!ui.text().includes('stale failure'));assert.ok(ui.nodes().some(n=>n.type==='Text'&&n.props.children==='B'));
});
