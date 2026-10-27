import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enrollmentEnd, enrollmentLabel } from '../src/features/members/services/enrollment.ts';
const terms = { months: 1, start: '2026-01-31', amount: 150, method: 'Yape/Plin' };
test('calendar months clamp to the target month instead of overflowing', () => {
 assert.equal(enrollmentEnd(terms), '2026-02-28');
 assert.equal(enrollmentEnd({ ...terms, start: '2028-01-31' }), '2028-02-29');
 assert.equal(enrollmentEnd({ ...terms, start: '2026-10-26', months: 4 }), '2027-02-26');
});
test('invalid durations are rejected and labels use months only', () => {
 assert.equal(enrollmentEnd({ ...terms, months: 0 }), '');
 assert.equal(enrollmentEnd({ ...terms, months: 1.5 }), '');
 assert.equal(enrollmentEnd({ ...terms, months: 25 }), '');
 assert.equal(enrollmentEnd({ ...terms, start: '' }), '');
 assert.equal(enrollmentLabel(terms), '1 mes');
 assert.equal(enrollmentLabel({ ...terms, months: 6 }), '6 meses');
});
