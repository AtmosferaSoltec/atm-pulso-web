import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enrollmentEnd, enrollmentTotal } from '../src/features/members/services/enrollment.ts';
const terms = { quantity: 1, unit: 'months', start: '2026-01-31', amount: 150, discount: 0, method: 'Yape' };
test('calendar months clamp to the target month instead of overflowing', () => {
 assert.equal(enrollmentEnd(terms), '2026-02-28');
 assert.equal(enrollmentEnd({ ...terms, start: '2028-01-31' }), '2028-02-29');
 assert.equal(enrollmentEnd({ ...terms, start: '2026-10-26', quantity: 4 }), '2027-02-26');
});
test('custom days, invalid durations, and optional discounts', () => {
 assert.equal(enrollmentEnd({ ...terms, unit: 'days', quantity: 30 }), '2026-03-02');
 assert.equal(enrollmentEnd({ ...terms, quantity: 0 }), '');
 assert.equal(enrollmentEnd({ ...terms, quantity: 1.5 }), '');
 assert.equal(enrollmentEnd({ ...terms, start: '' }), '');
 assert.equal(enrollmentTotal(terms), 150);
 assert.equal(enrollmentTotal({ ...terms, amount: 320, discount: 10 }), 288);
 assert.equal(enrollmentTotal({ ...terms, amount: 99.99, discount: 15 }), 84.99);
});
