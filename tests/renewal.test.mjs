import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAmend, periodState, renewalStart } from '../src/features/members/services/renewal.ts';

const today = '2026-10-30';
const baile = (starts_on, ends_on) => ({ plan_id: 'baile', starts_on, ends_on });
const todo = (starts_on, ends_on) => ({ plan_id: 'todo', starts_on, ends_on });

test('a period is current, scheduled or ended by its dates', () => {
  assert.equal(periodState({ starts_on: '2026-10-01', ends_on: '2026-11-01' }, today), 'current');
  assert.equal(periodState({ starts_on: '2026-10-01', ends_on: '2026-10-30' }, today), 'current', 'the end date is still a covered day');
  assert.equal(periodState({ starts_on: '2026-11-01', ends_on: '2026-12-01' }, today), 'scheduled');
  assert.equal(periodState({ starts_on: '2026-09-01', ends_on: '2026-10-29' }, today), 'ended');
});

test('only a period that has not ended can be corrected', () => {
  assert.equal(canAmend({ starts_on: '2026-10-01', ends_on: '2026-11-01' }, today), true);
  assert.equal(canAmend({ starts_on: '2026-11-01', ends_on: '2026-12-01' }, today), true);
  assert.equal(canAmend({ starts_on: '2026-09-01', ends_on: '2026-10-29' }, today), false);
});

test('renewing a plan that is current continues where its last period ends', () => {
  const result = renewalStart([baile('2026-10-10', '2026-11-10')], 'baile', today);
  assert.deepEqual(result, { start: '2026-11-10', continues: true, lastEnd: '2026-11-10' });
});

test('the last period of the plan counts, including a scheduled one', () => {
  const periods = [baile('2026-10-10', '2026-11-10'), baile('2026-11-10', '2026-12-10')];
  assert.equal(renewalStart(periods, 'baile', today).start, '2026-12-10');
});

test('other plans do not move the start', () => {
  const periods = [baile('2026-10-10', '2026-11-10'), todo('2026-10-01', '2027-04-01')];
  assert.equal(renewalStart(periods, 'baile', today).start, '2026-11-10');
  assert.deepEqual(renewalStart(periods, 'gold', today), { start: today, continues: false, lastEnd: null });
});

test('an ended plan starts again today and is not a continuation', () => {
  const result = renewalStart([baile('2026-08-01', '2026-09-01')], 'baile', today);
  assert.deepEqual(result, { start: today, continues: false, lastEnd: '2026-09-01' });
});
