const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { parseWeatherObservation } = load('../shared/passport/weather-observation.ts');
const { sortProductionHistory } = load('../shared/passport/production-history.ts');
const weather = { from:'2026-03-01T01:00:00Z',until:'2026-03-01T04:00:00Z',minimumC:-2,maximumC:1 };
test('below-zero temperature does not fabricate frost confirmation or sensor provenance',()=>{
  const result=parseWeatherObservation({...weather,source:'SENSOR'});
  assert.equal(result.frostObserved,null);assert.equal(result.source,'GROWER_OBSERVATION');
});
test('invalid weather periods, ranges and frost values are rejected',()=>{
  for(const patch of [{minimumC:5},{maximumC:Infinity},{from:'not a date'},{until:'2025-01-01'},{frostObserved:'yes'}])assert.throws(()=>parseWeatherObservation({...weather,...patch}));
});
test('history orders actual event dates and keeps undated seed evidence without inventing a date',()=>{
  const base={kind:'seed',source:'seed',facts:[]};
  const rows=sortProductionHistory([{...base,id:'unknown',date:null},{...base,id:'harvest',date:'2026-07-01'},{...base,id:'planting',date:'2026-03-01'}]);
  assert.deepEqual(rows.map(r=>r.id),['planting','harvest','unknown']);assert.equal(rows[2].date,null);
});
