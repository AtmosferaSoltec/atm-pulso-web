import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialKioskState,
  kioskReducer,
  canSubmit,
  resetDelay,
  maskDocument,
  firstNameOf,
  daysBetween,
  outcomeFromCheck,
  failureFromRequest,
  pinFailureText,
  RESULT_RESET_MS,
  IDLE_CLEAR_MS,
  MAX_DOCUMENT_DIGITS,
} from '../src/features/kiosk/services/kioskScreen.ts';

const type = (digits, state = initialKioskState) => [...digits].reduce((current, value) => kioskReducer(current, { type: 'digit', value }), state);

test('digits are typed up to the longest document and only digits count', () => {
  assert.equal(type('1234').digits, '1234');
  assert.equal(type('1'.repeat(20)).digits.length, MAX_DOCUMENT_DIGITS);
  assert.equal(kioskReducer(type('12'), { type: 'digit', value: 'a' }).digits, '12');
  assert.equal(kioskReducer(type('12'), { type: 'backspace' }).digits, '1');
  assert.deepEqual(kioskReducer(type('12'), { type: 'clear' }), initialKioskState);
});

test('submit needs 8 digits and sends only once', () => {
  assert.equal(canSubmit(type('1234567')), false);
  assert.equal(kioskReducer(type('1234567'), { type: 'submit' }).phase, 'entering');
  const checking = kioskReducer(type('12345678'), { type: 'submit' });
  assert.deepEqual(checking, { phase: 'checking', digits: '12345678' });
  // A second tap while checking changes nothing (no double send), nor can digits be typed.
  assert.equal(kioskReducer(checking, { type: 'submit' }), checking);
  assert.equal(kioskReducer(checking, { type: 'digit', value: '9' }), checking);
});

test('an answer only lands while checking, and reset returns to an empty keypad', () => {
  const outcome = outcomeFromCheck({ allowed: false, reason: 'NOT_REGISTERED', ends_on: null, member: null }, '2026-10-30');
  assert.equal(kioskReducer(type('12345678'), { type: 'answered', outcome }).phase, 'entering', 'a late answer is ignored');
  const checking = kioskReducer(type('12345678'), { type: 'submit' });
  const shown = kioskReducer(checking, { type: 'answered', outcome });
  assert.equal(shown.phase, 'result');
  assert.equal(JSON.stringify(shown).includes('12345678'), false, 'the typed document is gone from the state once answered');
  assert.deepEqual(kioskReducer(shown, { type: 'reset' }), initialKioskState);
  const failed = kioskReducer(checking, { type: 'failed', failure: failureFromRequest({ status: 0, code: 'NETWORK_ERROR' }) });
  assert.equal(failed.phase, 'error');
  assert.equal(JSON.stringify(failed).includes('12345678'), false);
});

test('the screen resets by itself: 5 s after an answer, 20 s of idle with digits typed', () => {
  assert.equal(RESULT_RESET_MS, 5000);
  assert.equal(resetDelay(initialKioskState), null);
  assert.equal(resetDelay(type('12')), IDLE_CLEAR_MS);
  assert.equal(resetDelay({ phase: 'checking', digits: '12345678' }), null);
  const outcome = outcomeFromCheck({ allowed: true, reason: 'MEMBERSHIP_VALID', ends_on: '2026-11-30', member: { full_name: 'ANA PEREZ' } }, '2026-10-30');
  assert.equal(resetDelay({ phase: 'result', outcome }), 5000);
  assert.equal(resetDelay({ phase: 'error', failure: failureFromRequest({ status: 500, code: 'X' }) }), 5000);
});

test('the document is masked except for its last digit', () => {
  assert.equal(maskDocument(''), '');
  assert.equal(maskDocument('7'), '7');
  assert.equal(maskDocument('74455518'), '•••••••8');
});

test('only the first name is kept, capitalised', () => {
  assert.equal(firstNameOf('JUAN CARLOS PÉREZ'), 'Juan');
  assert.equal(firstNameOf('  andrea   garcía '), 'Andrea');
  assert.equal(firstNameOf(''), null);
  assert.equal(firstNameOf(null), null);
});

test('days are counted on calendar dates', () => {
  assert.equal(daysBetween('2026-10-30', '2026-10-30'), 0);
  assert.equal(daysBetween('2026-10-30', '2026-11-30'), 31);
  assert.equal(daysBetween('2026-12-30', '2027-01-02'), 3);
});

test('allowed shows the first name and the days left, never the document', () => {
  const answer = { allowed: true, reason: 'MEMBERSHIP_VALID', ends_on: '2026-11-22', member: { full_name: 'MARÍA LÓPEZ', document_number: '74455518', id: 'x' } };
  const outcome = outcomeFromCheck(answer, '2026-10-30');
  assert.equal(outcome.allowed, true);
  assert.equal(outcome.headline, '¡Hola, María!');
  assert.equal(outcome.detail, 'Te quedan 23 días de membresía');
  assert.equal(outcome.endingSoon, false);
  const text = JSON.stringify(outcome);
  assert.equal(text.includes('74455518'), false);
  assert.equal(text.includes('LÓPEZ') || text.includes('López'), false);
  assert.equal(outcomeFromCheck({ ...answer, ends_on: '2026-11-05' }, '2026-10-30').endingSoon, true);
  assert.equal(outcomeFromCheck({ ...answer, ends_on: '2026-10-31' }, '2026-10-30').detail, 'Te queda 1 día de membresía');
  assert.equal(outcomeFromCheck({ ...answer, ends_on: '2026-10-30' }, '2026-10-30').detail, 'Hoy es el último día de tu membresía');
});

test('every denial has a plain Spanish reason', () => {
  const denied = (reason, ends_on = null, member = null) => outcomeFromCheck({ allowed: false, reason, ends_on, member }, '2026-10-30');
  assert.equal(denied('NOT_REGISTERED').headline, 'Documento no registrado');
  assert.equal(denied('MEMBERSHIP_EXPIRED', '2026-09-01', { full_name: 'Luis Ramos' }).headline, 'Membresía vencida');
  assert.equal(denied('MEMBERSHIP_EXPIRED', '2026-09-01', { full_name: 'Luis Ramos' }).detail, 'Luis, renueva en recepción');
  assert.equal(denied('MEMBERSHIP_NOT_STARTED', '2026-11-04').detail, 'Tu membresía empieza en 5 días');
  assert.equal(denied('MEMBERSHIP_NOT_STARTED', '2026-10-31').detail, 'Tu membresía empieza mañana');
  assert.equal(denied('BRANCH_NOT_ALLOWED').headline, 'Sede no permitida');
  assert.equal(denied('WHATEVER').allowed, false);
  for (const reason of ['NOT_REGISTERED', 'MEMBERSHIP_EXPIRED', 'MEMBERSHIP_NOT_STARTED', 'BRANCH_NOT_ALLOWED']) assert.equal(denied(reason).allowed, false);
});

test('request failures never look like an allowed answer', () => {
  assert.equal(failureFromRequest({ status: 0, code: 'NETWORK_ERROR' }).kind, 'offline');
  assert.equal(failureFromRequest({ status: 429, code: 'TOO_MANY_REQUESTS' }).kind, 'rate_limited');
  assert.equal(failureFromRequest({ status: 401, code: 'UNAUTHORIZED' }).kind, 'session');
  assert.equal(failureFromRequest({ status: 403, code: 'FEATURE_DISABLED' }).kind, 'disabled');
  assert.equal(failureFromRequest({ status: 400, code: 'VALIDATION_FAILED' }).kind, 'invalid');
  assert.equal(failureFromRequest({ status: 500, code: 'INTERNAL_ERROR' }).kind, 'server');
  assert.equal('allowed' in failureFromRequest({ status: 500, code: 'X' }), false);
});

test('PIN failures speak plainly', () => {
  assert.equal(pinFailureText({ status: 403, code: 'KIOSK_PIN_INVALID' }), 'PIN incorrecto.');
  assert.match(pinFailureText({ status: 429, code: 'KIOSK_PIN_LOCKED' }), /Demasiados intentos/);
  assert.match(pinFailureText({ status: 0, code: 'NETWORK_ERROR' }), /Sin conexión/);
});
