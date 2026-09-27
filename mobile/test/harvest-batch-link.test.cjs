const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { harvestPlanLink } = load('lib/harvest-batch-link.ts');
const plans = [{ id: 'older-selected', parcelId: 'plot' }, { id: 'newer', parcelId: 'plot' }, { id: 'foreign-plot', parcelId: 'other' }];

test('lot payload keeps the selected plan even when a newer plan exists on the same parcel', () => {
  assert.deepEqual(harvestPlanLink('older-selected', 'plot', plans), { harvestAnnouncementId: 'older-selected' });
});
test('a queued local plan cannot be silently omitted or sent as a server identity', () => {
  assert.throws(() => harvestPlanLink('local:123', 'plot', [{ id: 'local:123', parcelId: 'plot' }]), /PLAN_NOT_SYNCED/);
});
test('a missing plan or one belonging to another parcel prevents the lot submission', () => {
  for (const id of ['missing', 'foreign-plot']) assert.throws(() => harvestPlanLink(id, 'plot', plans), /PLAN_UNAVAILABLE/);
});
test('no selected plan remains explicitly unlinked, without guessing the latest one', () => {
  assert.deepEqual(harvestPlanLink(null, 'plot', plans), {});
});
