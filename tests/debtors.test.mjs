import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysBetween, debtAge, pendingCountLabel } from '../src/features/sales/services/debtors.ts';

test('days between two dates, never negative', () => {
  assert.equal(daysBetween('2026-11-20', '2026-11-20'), 0);
  assert.equal(daysBetween('2026-11-19', '2026-11-20'), 1);
  assert.equal(daysBetween('2026-10-31', '2026-11-20'), 20);
  assert.equal(daysBetween('2025-12-31', '2026-01-01'), 1, 'across the year');
  assert.equal(daysBetween('2026-11-21', '2026-11-20'), 0, 'a date after today counts as today');
  assert.equal(daysBetween('nope', '2026-11-20'), 0);
});

test('the age of the debt reads naturally', () => {
  assert.equal(debtAge('2026-11-20', '2026-11-20'), 'hoy');
  assert.equal(debtAge('2026-11-19', '2026-11-20'), 'ayer');
  assert.equal(debtAge('2026-11-15', '2026-11-20'), 'hace 5 días');
});

test('pending count in singular and plural', () => {
  assert.equal(pendingCountLabel(1), '1 venta pendiente');
  assert.equal(pendingCountLabel(2), '2 ventas pendientes');
});
