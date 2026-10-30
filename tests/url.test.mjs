import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withBase } from '../src/lib/url.js';

test('withBase: Basispfad davorsetzen, extern und Anker unverändert', () => {
  assert.equal(withBase('/mitrilmo-staging', '/pfadwerk.html'), '/mitrilmo-staging/pfadwerk.html');
  assert.equal(withBase('/mitrilmo-staging/', '/pfadwerk.html'), '/mitrilmo-staging/pfadwerk.html');
  assert.equal(withBase('', '/pfadwerk.html'), '/pfadwerk.html');
  assert.equal(withBase('/', '/pfadwerk.html'), '/pfadwerk.html');
  assert.equal(withBase('/mitrilmo-staging', 'pfadwerk.html'), '/mitrilmo-staging/pfadwerk.html');
  assert.equal(withBase('/mitrilmo-staging', 'https://www.youtube.com/@mitrilmo'), 'https://www.youtube.com/@mitrilmo');
  assert.equal(withBase('/mitrilmo-staging', '#impressum'), '#impressum');
  assert.equal(withBase('/mitrilmo-staging', 'mailto:a@b.de'), 'mailto:a@b.de');
});
