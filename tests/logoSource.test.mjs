import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logoSource } from '../src/features/branding/services/logoSource.ts';

const base = 'http://localhost:3001/api/v1';

test('a signed https link is used as it is', () => {
  const link = 'https://files.example/logo.png?X-Amz-Signature=abc';
  assert.equal(logoSource(link, base), link);
});

test('an API path gets the API base', () => {
  assert.equal(logoSource('/gym/logo', base), `${base}/gym/logo`);
});

test('no logo, or an unsafe scheme, means the monogram', () => {
  assert.equal(logoSource(null, base), null);
  assert.equal(logoSource(undefined, base), null);
  assert.equal(logoSource('', base), null);
  assert.equal(logoSource('javascript:alert(1)', base), null);
  assert.equal(logoSource('data:image/png;base64,AAAA', base), null);
});
