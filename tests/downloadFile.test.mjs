import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadFileName, downloadFormats, slugify } from '../src/utils/downloadFile.ts';

test('the menu offers Excel, CSV and PDF in that order', () => {
  assert.deepEqual(downloadFormats.map((option) => option.format), ['xlsx', 'csv', 'pdf']);
  assert.deepEqual(downloadFormats.map((option) => option.label), ['Excel', 'CSV', 'PDF']);
});

test('file names are Spanish words, the Lima date and the format', () => {
  assert.equal(downloadFileName('pagos', '2026-11-20', 'xlsx'), 'pagos-2026-11-20.xlsx');
  assert.equal(downloadFileName('miembros', '2026-11-20', 'pdf'), 'miembros-2026-11-20.pdf');
});

test('member names become ASCII slugs', () => {
  assert.equal(slugify('José Ñañez Peña'), 'jose-nanez-pena');
  assert.equal(slugify('  María-José  O\'Neil '), 'maria-jose-o-neil');
  assert.equal(slugify('🙂'), 'miembro');
  assert.equal(slugify('a'.repeat(80)).length, 60);
});
