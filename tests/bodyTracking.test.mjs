import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMeasurementInput, chartModel, deltasAgainstPrevious, emptyForm, formatDelta, parseDecimal, weightChange, weightPoints } from '../src/features/body-tracking/services/measurements.ts';
import { buildRoutineInput, currentRoutine, emptyRoutine, historyOf } from '../src/features/body-tracking/services/routines.ts';

const TODAY = '2026-10-30';
const box = { width: 560, height: 190, left: 40, right: 16, top: 14, bottom: 28 };
const record = (id, date, weight, created = `${date}T10:00:00Z`) => ({ id, measured_on: date, weight_kg: weight, created_at: created, notes: '' });

test('decimals accept one digit and a comma', () => {
  assert.equal(parseDecimal('95'), 95);
  assert.equal(parseDecimal('95,5'), 95.5);
  assert.equal(parseDecimal(' 95.5 '), 95.5);
  for (const bad of ['', 'abc', '95.55', '-3', '1e3', '.5', '95.']) assert.equal(parseDecimal(bad), null, bad);
});

test('a measurement needs a date and at least one value inside the ranges', () => {
  const form = (patch) => ({ ...emptyForm(TODAY), ...patch });
  assert.equal(buildMeasurementInput(form({}), TODAY).ok, false);
  assert.match(buildMeasurementInput(form({}), TODAY).error, /al menos un valor/);
  assert.equal(buildMeasurementInput(form({ measured_on: '2026-10-31', weight_kg: '80' }), TODAY).ok, false);
  assert.equal(buildMeasurementInput(form({ weight_kg: '19.9' }), TODAY).ok, false);
  assert.equal(buildMeasurementInput(form({ weight_kg: '80.55' }), TODAY).ok, false);
  assert.equal(buildMeasurementInput(form({ weight_kg: '80', waist_cm: '5' }), TODAY).ok, false);
  const ok = buildMeasurementInput(form({ weight_kg: '95,5', waist_cm: '', notes: '  en ayunas ' }), TODAY);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.input, { measured_on: TODAY, weight_kg: 95.5, notes: 'en ayunas' });
  assert.equal(buildMeasurementInput(form({ waist_cm: '90' }), TODAY).ok, true, 'any one value is enough');
});

test('the chart orders the weights by date and spaces them by days', () => {
  const points = weightPoints([record('c', '2026-10-30', 93), record('a', '2026-09-30', 95), record('no-weight', '2026-10-10', null), record('b', '2026-10-15', 94.2)]);
  assert.deepEqual(points.map((p) => p.id), ['a', 'b', 'c']);
  const model = chartModel(points, box);
  assert.equal(model.dots.length, 3);
  assert.equal(model.dots[0].x, 40);
  assert.equal(model.dots[2].x, 544);
  assert.ok(model.dots[1].x > 40 && model.dots[1].x < 544);
  assert.ok(model.dots[0].y < model.dots[2].y, 'a lower weight is drawn lower');
  assert.ok(model.dots.every((d) => d.y >= box.top && d.y <= box.height - box.bottom));
  assert.match(model.path, /^M40 /);
  assert.equal(model.ticks.length, 4);
});

test('a single weight is centred and never divides by zero', () => {
  const model = chartModel(weightPoints([record('a', '2026-10-30', 80)]), box);
  assert.equal(model.dots.length, 1);
  assert.ok(Number.isFinite(model.dots[0].y) && Number.isFinite(model.dots[0].x));
  assert.deepEqual(chartModel([], box).dots, []);
  assert.equal(weightChange(weightPoints([record('a', '2026-10-30', 80)])), null);
});

test('change since the first weight and per row', () => {
  const records = [record('c', '2026-10-30', 93), record('b', '2026-10-15', 94.2), record('a', '2026-09-30', 95)];
  const change = weightChange(weightPoints(records));
  assert.deepEqual(change, { from: 95, to: 93, delta: -2, days: 30 });
  assert.equal(formatDelta(-2), '−2 kg');
  assert.equal(formatDelta(1.5), '+1,5 kg');
  assert.equal(formatDelta(0), '0 kg');
  const deltas = deltasAgainstPrevious(records);
  assert.equal(deltas.get('a'), undefined);
  assert.equal(deltas.get('b'), -0.8);
  assert.equal(deltas.get('c'), -1.2);
});

test('routines need a title and a past date; the current one is highlighted', () => {
  const form = (patch) => ({ ...emptyRoutine(TODAY), ...patch });
  assert.equal(buildRoutineInput(form({}), TODAY).ok, false);
  assert.equal(buildRoutineInput(form({ title: 'X', started_on: '2026-11-01' }), TODAY).ok, false);
  assert.equal(buildRoutineInput(form({ title: 'X', content: 'c'.repeat(5001) }), TODAY).ok, false);
  const ok = buildRoutineInput(form({ title: '  Fuerza   A ', content: ' 3x8 ' }), TODAY);
  assert.deepEqual(ok.input, { started_on: TODAY, title: 'Fuerza A', content: '3x8', notes: '', is_current: true });
  const routines = [{ id: '1', is_current: true }, { id: '2', is_current: true }, { id: '3', is_current: false }];
  assert.equal(currentRoutine(routines).id, '1');
  assert.deepEqual(historyOf(routines).map((r) => r.id), ['2', '3']);
  assert.equal(currentRoutine([{ id: '3', is_current: false }]), null);
});
