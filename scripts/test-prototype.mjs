import assert from 'node:assert/strict';
import {
  filterWorks,
  getAccessKind,
  normalizeWorks,
  renderAccessActions,
  renderFilterButtons,
  renderWorkRow,
  resolveTheme,
} from '../prototype/app.js';

const sample = normalizeWorks([
  { id: 'web-1', title: 'Web', type: 'web', year: 2026 },
  { id: 'mini-1', title: 'Mini', type: 'mini-program', year: 2025 },
  { id: 'soon-1', title: 'Soon', type: 'future', status: 'soon' },
]);

assert.equal(sample.length, 3);
assert.equal(sample[0].status, 'live');
assert.equal(filterWorks(sample, 'mobile').length, 0);
assert.equal(filterWorks(sample, 'mini-program').length, 1);
assert.equal(getAccessKind(sample[2]), 'future');
assert.equal(resolveTheme('system', true), 'dark');
assert.equal(resolveTheme('light', true), 'light');

const webMarkup = renderAccessActions({
  id: 'web-2',
  title: 'Web',
  type: 'web',
  status: 'live',
  access: { url: 'https://example.com' },
});
assert.match(webMarkup, /访问网站/);

const miniMarkup = renderAccessActions({
  id: 'mini-2',
  title: 'Mini',
  type: 'mini-program',
  status: 'live',
  access: { qrImage: './qr.png', qrAlt: 'Mini 二维码' },
});
assert.match(miniMarkup, /二维码/);
assert.match(miniMarkup, /Mini 二维码/);

const mobileMarkup = renderAccessActions({
  id: 'mobile-2',
  title: 'Mobile',
  type: 'mobile',
  status: 'live',
  access: { appStore: 'https://apps.apple.com', googlePlay: 'https://play.google.com' },
});
assert.match(mobileMarkup, /App Store/);
assert.match(mobileMarkup, /Google Play/);

const soonMarkup = renderAccessActions({
  id: 'soon-2',
  title: 'Soon',
  type: 'future',
  status: 'soon',
  access: {},
});
assert.match(soonMarkup, /Coming Soon/);
assert.doesNotMatch(soonMarkup, /href=/);

const rowMarkup = renderWorkRow(
  {
    id: 'row-1',
    title: 'Row title',
    titleEn: 'Row title',
    type: 'web',
    year: 2026,
    summary: 'Summary',
    image: './row.png',
    role: ['Design'],
    access: { url: 'https://example.com' },
    status: 'live',
  },
  false,
);
assert.match(rowMarkup, /aria-expanded="false"/);
assert.match(rowMarkup, /aria-controls="detail-row-1"/);
assert.match(rowMarkup, /Row title/);

const filterMarkup = renderFilterButtons(
  [
    { type: 'web' },
    { type: 'web' },
    { type: 'mobile' },
  ],
  'all',
);
assert.match(filterMarkup, /全部/);
assert.match(filterMarkup, /网站/);
assert.match(filterMarkup, /应用/);
assert.match(filterMarkup, /data-filter="web"/);

console.log('prototype helpers: ok');
