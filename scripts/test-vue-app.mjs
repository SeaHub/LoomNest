import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  filterWorks,
  getAccessKind,
  getNextTheme,
  getWorksUrl,
  isSafeExternalUrl,
  normalizeThemePreference,
  normalizeWorks,
  resolveTheme,
} from '../src/lib/works.js';
import {
  DETAIL_TRANSITION_MS,
  animateMeasuredHeight,
  createFrameThrottler,
  shouldScrollDetail,
} from '../src/lib/motion.js';

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
assert.equal(normalizeThemePreference('light'), 'light');
assert.equal(normalizeThemePreference('dark'), 'dark');
assert.equal(normalizeThemePreference('system'), null);
assert.equal(normalizeThemePreference('unexpected'), null);
assert.equal(normalizeThemePreference(null), null);
assert.equal(resolveTheme(null, true), 'dark');
assert.equal(resolveTheme(null, false), 'light');
assert.equal(resolveTheme('light', true), 'light');
assert.equal(resolveTheme('dark', false), 'dark');
assert.equal(getNextTheme('dark'), 'light');
assert.equal(getNextTheme('light'), 'dark');
assert.equal(isSafeExternalUrl('https://example.com'), true);
assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
assert.equal(isSafeExternalUrl(''), false);
assert.equal(getWorksUrl('/LoomNest/', '3d937da'), '/LoomNest/works.json?v=3d937da');

function createAnimatedElement({ height = 60, scrollHeight = 180 } = {}) {
  const element = {
    animation: null,
    keyframes: null,
    options: null,
    scrollHeight,
    style: { height: '', willChange: '' },
    getBoundingClientRect() {
      return { height };
    },
    animate(keyframes, options) {
      const listeners = { cancel: new Set(), finish: new Set() };
      const animation = {
        playState: 'running',
        addEventListener(type, callback) {
          listeners[type].add(callback);
        },
        cancel() {
          this.playState = 'idle';
          for (const callback of listeners.cancel) callback();
        },
        finish() {
          this.playState = 'finished';
          for (const callback of listeners.finish) callback();
        },
      };

      element.animation = animation;
      element.keyframes = keyframes;
      element.options = options;
      return animation;
    },
  };

  return element;
}

assert.equal(DETAIL_TRANSITION_MS, 220);

let completedTransitions = 0;
const openingElement = createAnimatedElement();
const openingAnimation = animateMeasuredHeight(openingElement, {
  opening: true,
  reducedMotion: false,
  done: () => {
    completedTransitions += 1;
  },
});

assert.deepEqual(openingElement.keyframes, [{ height: '0px' }, { height: '180px' }]);
assert.equal(openingElement.options.duration, 220);
assert.equal(openingElement.options.easing, 'cubic-bezier(0.22, 1, 0.36, 1)');
assert.equal(openingElement.style.willChange, 'height');
openingAnimation.finish();
assert.equal(openingElement.style.height, 'auto');
assert.equal(openingElement.style.willChange, '');
assert.equal(completedTransitions, 1);

const closingElement = createAnimatedElement({ height: 144, scrollHeight: 180 });
const closingAnimation = animateMeasuredHeight(closingElement, {
  opening: false,
  reducedMotion: false,
  done: () => {
    completedTransitions += 1;
  },
});

assert.deepEqual(closingElement.keyframes, [{ height: '144px' }, { height: '0px' }]);
closingAnimation.finish();
assert.equal(closingElement.style.height, '0px');
assert.equal(completedTransitions, 2);

let reducedMotionCompleted = false;
const reducedMotionElement = createAnimatedElement();
reducedMotionElement.animate = () => {
  throw new Error('reduced motion must not start an animation');
};
assert.equal(animateMeasuredHeight(reducedMotionElement, {
  opening: true,
  reducedMotion: true,
  done: () => {
    reducedMotionCompleted = true;
  },
}), null);
assert.equal(reducedMotionElement.style.height, 'auto');
assert.equal(reducedMotionCompleted, true);

assert.equal(shouldScrollDetail(
  { top: 130, bottom: 700 },
  { height: 800, topInset: 112, bottomInset: 24 },
), false);
assert.equal(shouldScrollDetail(
  { top: 130, bottom: 790 },
  { height: 800, topInset: 112, bottomInset: 24 },
), true);
assert.equal(shouldScrollDetail(
  { top: 90, bottom: 700 },
  { height: 800, topInset: 112, bottomInset: 24 },
), true);

function createFrameScheduler() {
  let nextId = 1;
  const callbacks = new Map();

  return {
    cancelFrame(id) {
      callbacks.delete(id);
    },
    flush() {
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback();
    },
    get pendingCount() {
      return callbacks.size;
    },
    requestFrame(callback) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    },
  };
}

const scheduler = createFrameScheduler();
const deliveredFrames = [];
const throttler = createFrameThrottler(
  (value) => deliveredFrames.push(value),
  {
    requestFrame: scheduler.requestFrame.bind(scheduler),
    cancelFrame: scheduler.cancelFrame.bind(scheduler),
  },
);

throttler.push({ id: 'header', x: 10 });
throttler.push({ id: 'header', x: 18 });
assert.equal(scheduler.pendingCount, 1);
scheduler.flush();
assert.deepEqual(deliveredFrames, [{ id: 'header', x: 18 }]);

throttler.push({ id: 'header', x: 30 });
throttler.cancel();
throttler.push({ id: 'filter', x: 20 });
assert.equal(scheduler.pendingCount, 1);
scheduler.flush();
assert.deepEqual(deliveredFrames, [
  { id: 'header', x: 18 },
  { id: 'filter', x: 20 },
]);

const publicWorks = JSON.parse(fs.readFileSync(new URL('../public/works.json', import.meta.url), 'utf8'));
for (const work of publicWorks) {
  const extension = path.extname(work.image).toLowerCase();
  assert.ok(['.jpg', '.jpeg', '.webp'].includes(extension), `${work.id} should use a compressed preview image`);
  assert.ok(fs.existsSync(path.resolve('public', work.image)), `${work.id} preview image should exist`);
}

console.log('vue app helpers: ok');
