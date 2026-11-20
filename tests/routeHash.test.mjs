import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, buildHash } from '../src/config/routeHash.ts';
import { documentTitle } from '../src/config/documentTitle.ts';

test('a hash is a page, optionally with one record id', () => {
  assert.deepEqual(parseHash('#members'), { segment: 'members', param: null });
  assert.deepEqual(parseHash('#members/abc-1'), { segment: 'members', param: 'abc-1' });
  assert.deepEqual(parseHash(''), { segment: '', param: null });
  assert.deepEqual(parseHash('#members/'), { segment: 'members', param: null });
  assert.deepEqual(parseHash('#members/a%20b'), { segment: 'members', param: 'a b' });
  assert.deepEqual(parseHash('#members/%E0%A4%A'), { segment: 'members', param: null }, 'malformed escapes are ignored');
});

test('building a hash round-trips', () => {
  assert.equal(buildHash('members'), 'members');
  assert.equal(buildHash('members', 'a b/c'), 'members/a%20b%2Fc');
  assert.equal(parseHash(`#${buildHash('members', 'a b/c')}`).param, 'a b/c');
});

test('the tab title is always Pulso, never the gym', () => {
  assert.equal(documentTitle(), 'Pulso');
  assert.equal(documentTitle('Miembros'), 'Pulso · Miembros');
});
