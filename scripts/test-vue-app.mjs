import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  filterWorks,
  getAccessKind,
  getWorksUrl,
  isSafeExternalUrl,
  normalizeWorks,
  resolveTheme,
} from '../src/lib/works.js';

const sample = normalizeWorks([
  { id: 'web-1', title: 'Web', type: 'web', year: 2026 },
  { id: 'mini-1', title: 'Mini', type: 'mini-program', year: 2025 },
  { id: 'soon-1', title: 'Soon', type: 'future', status: 'soon' },
  null,
]);

assert.equal(sample.length, 3);
assert.equal(sample[0].status, 'live');
assert.deepEqual(sample[0].role, []);
assert.equal(filterWorks(sample, 'mobile').length, 0);
assert.equal(filterWorks(sample, 'mini-program').length, 1);
assert.equal(getAccessKind(sample[2]), 'future');
assert.equal(resolveTheme('system', true), 'dark');
assert.equal(resolveTheme('light', true), 'light');
assert.equal(isSafeExternalUrl('https://example.com'), true);
assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
assert.equal(isSafeExternalUrl(''), false);
assert.equal(getWorksUrl('/LoomNest/', '3d937da'), '/LoomNest/works.json?v=3d937da');

const publicWorks = JSON.parse(fs.readFileSync(new URL('../public/works.json', import.meta.url), 'utf8'));
for (const work of publicWorks) {
  const extension = path.extname(work.image).toLowerCase();
  assert.ok(['.jpg', '.jpeg', '.webp'].includes(extension), `${work.id} should use a compressed preview image`);
  assert.ok(fs.existsSync(path.resolve('public', work.image)), `${work.id} preview image should exist`);
}

console.log('vue app helpers: ok');
