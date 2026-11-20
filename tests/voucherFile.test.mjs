import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SENT_BYTES, MAX_VOUCHERS, fitsUpload, shrunkSize, voucherProblem } from '../src/features/vouchers/services/voucherFile.ts';

const file = (name, type, size) => ({ name, type, size });

test('one voucher per payment, sale or collection, of at most 2 MB', () => {
  assert.equal(MAX_VOUCHERS, 1);
  assert.equal(MAX_SENT_BYTES, 2 * 1024 * 1024);
  assert.equal(fitsUpload(MAX_SENT_BYTES), true);
  assert.equal(fitsUpload(MAX_SENT_BYTES + 1), false);
  assert.equal(fitsUpload(0), false);
});

test('photos are shrunk to a long side of 1280 px and never enlarged', () => {
  assert.deepEqual(shrunkSize(4032, 3024), { width: 1280, height: 960 });
  assert.deepEqual(shrunkSize(1080, 2400), { width: 576, height: 1280 });
  assert.deepEqual(shrunkSize(800, 600), { width: 800, height: 600 });
});

test('a PDF over 2 MB is refused with a clear message; a big photo is not (it is shrunk first)', () => {
  assert.match(voucherProblem(file('yape.pdf', 'application/pdf', MAX_SENT_BYTES + 1)), /pesa más de 2 MB/);
  assert.equal(voucherProblem(file('yape.pdf', 'application/pdf', MAX_SENT_BYTES)), null);
  assert.equal(voucherProblem(file('foto.jpg', 'image/jpeg', 8 * 1024 * 1024)), null);
  assert.match(voucherProblem(file('foto.jpg', 'image/jpeg', 41 * 1024 * 1024)), /pesa demasiado/);
  assert.match(voucherProblem(file('dibujo.svg', 'image/svg+xml', 10)), /no es una imagen ni un PDF/);
});
