# LoomNest Smooth Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve LoomNest's motion while making card expansion and every button interaction visibly smooth.

**Architecture:** A focused motion utility will own measured-height Web Animations, post-expansion visibility checks, and requestAnimationFrame throttling. `App.vue` will connect those primitives to Vue transition hooks, while CSS separates the height-clipped reveal shell from the stable glass panel and moves hover highlights on compositor transforms.

**Tech Stack:** Vue 3.5, Vite 8, browser Web Animations API, Node.js assertion tests, Ego Lite regression automation, GitHub Actions Pages.

## Global Constraints

- Card reveal duration is exactly 220 ms.
- No new runtime dependency is introduced.
- Existing work normalization, filtering, URL validation, theme persistence, and accessibility semantics remain unchanged.
- Reduced-motion users receive the final state immediately with no smooth scrolling.
- GitHub Pages deployment is complete only after the workflow succeeds and the public URL passes Ego Lite regression.

---

### Task 1: Motion primitives

**Files:**
- Create: `src/lib/motion.js`
- Modify: `scripts/test-vue-app.mjs`

**Interfaces:**
- Produces: `DETAIL_TRANSITION_MS`, `animateMeasuredHeight(element, options)`, `cancelMeasuredHeight(element)`, `shouldScrollDetail(rect, viewport)`, and `createFrameThrottler(callback, scheduler)`.
- `animateMeasuredHeight` consumes `{ opening: boolean, reducedMotion: boolean, done: Function }` and returns the active `Animation` or `null`.
- `shouldScrollDetail` consumes a `{ top, bottom }` rectangle and `{ height, topInset, bottomInset }` viewport.

- [ ] **Step 1: Write failing motion tests**

Add real behavior assertions that verify:

```js
assert.equal(DETAIL_TRANSITION_MS, 220);

const opening = animateMeasuredHeight(fakeElement, {
  opening: true,
  reducedMotion: false,
  done: () => { completed += 1; },
});
assert.deepEqual(fakeElement.keyframes, [{ height: '0px' }, { height: '180px' }]);
assert.equal(fakeElement.options.duration, 220);
opening.finish();
assert.equal(fakeElement.style.height, 'auto');
assert.equal(completed, 1);

assert.equal(shouldScrollDetail({ top: 130, bottom: 700 }, {
  height: 800,
  topInset: 112,
  bottomInset: 24,
}), false);
assert.equal(shouldScrollDetail({ top: 130, bottom: 790 }, {
  height: 800,
  topInset: 112,
  bottomInset: 24,
}), true);
```

Use an in-memory animation double that implements `addEventListener`, `cancel`, and `finish`; assert on the visible element style and completion behavior, not only call counts. Add a deterministic animation-frame scheduler and verify that multiple pointer inputs before a frame produce one callback containing the latest input, and that `cancel()` prevents a pending callback.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/motion.js`.

- [ ] **Step 3: Implement the minimal motion utility**

Implement:

```js
export const DETAIL_TRANSITION_MS = 220;
const activeHeightAnimations = new WeakMap();

export function shouldScrollDetail(rect, {
  height,
  topInset = 112,
  bottomInset = 24,
}) {
  return rect.top < topInset || rect.bottom > height - bottomInset;
}
```

`animateMeasuredHeight` cancels an existing animation, measures `scrollHeight` for opening and `getBoundingClientRect().height` for closing, animates exact pixel heights with `cubic-bezier(0.22, 1, 0.36, 1)`, and clears `height` to `auto` only after a successful open. When motion is reduced or `element.animate` is absent, apply the final height and call `done` synchronously.

`createFrameThrottler` retains only the latest input until the scheduled frame runs and exposes `cancel()` for unmount and pointer-leave cleanup.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test`

Expected: `vue app helpers: ok`.

- [ ] **Step 5: Commit motion primitives**

```bash
git add src/lib/motion.js scripts/test-vue-app.mjs
git commit -m "test: add smooth interaction motion primitives"
```

### Task 2: Vue reveal lifecycle

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: all exports from `src/lib/motion.js`.
- Produces: a `.work-detail-reveal` shell whose height is animated independently of its `.work-detail` glass child.

- [ ] **Step 1: Capture the failing browser behavior**

In the existing Ego Lite task space, reload the local site, click `button[data-work-id="atlas-culture"]`, and record:

- current computed transition includes `max-height 0.42s`;
- layout-shift entries are produced during expansion;
- the detail's live `backdrop-filter` surface is scaled by the transition.

Expected: all three current behaviors are present.

- [ ] **Step 2: Connect measured transition hooks**

Import motion primitives and add Vue hooks:

```js
function handleDetailEnter(element, done) {
  animateMeasuredHeight(element, {
    opening: true,
    reducedMotion: reducedMotion.value,
    done,
  });
}

function handleDetailLeave(element, done) {
  animateMeasuredHeight(element, {
    opening: false,
    reducedMotion: reducedMotion.value,
    done,
  });
}
```

Cancel active height animations from Vue's enter/leave cancellation hooks. In `after-enter`, query the region inside the shell and call smooth `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` only when `shouldScrollDetail` reports that the final region is outside the usable viewport and reduced motion is off.

- [ ] **Step 3: Separate layout and visual animation**

Wrap the region:

```vue
<Transition
  :css="false"
  @enter="handleDetailEnter"
  @leave="handleDetailLeave"
  @enter-cancelled="handleDetailCancelled"
  @leave-cancelled="handleDetailCancelled"
  @after-enter="handleDetailAfterEnter"
>
  <div v-if="isOpen(work)" class="work-detail-reveal">
    <div class="work-detail glass-surface" role="region">...</div>
  </div>
</Transition>
```

Move horizontal spacing and bottom padding to `.work-detail-reveal`, set `overflow: clip`, and keep `.work-detail` at `transform: none`. Animate only the inner copy/access children with opacity and `translate3d(0, -4px, 0)` for 180 ms. Shorten row, thumbnail, toggle, access-link, filter-swap, theme, and focus feedback transitions to 160–220 ms.

- [ ] **Step 4: Run unit and build verification**

Run: `npm test && npm run build`

Expected: tests print `vue app helpers: ok`; Vite exits 0 and writes `dist/`.

- [ ] **Step 5: Commit card reveal integration**

```bash
git add src/App.vue src/styles.css
git commit -m "perf: smooth measured card reveal animations"
```

### Task 3: Compositor-friendly glass pointer

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`
- Modify: `scripts/test-vue-app.mjs`

**Interfaces:**
- Consumes: `createFrameThrottler`.
- Produces: one pending pointer update per animation frame and a fixed-size highlight moved by `translate3d`.

- [ ] **Step 1: Add the failing pointer-throttle integration assertion**

Extend the deterministic scheduler test so two surfaces can clear and reschedule safely:

```js
throttler.push({ id: 'header', x: 10 });
throttler.cancel();
throttler.push({ id: 'filter', x: 20 });
scheduler.flush();
assert.deepEqual(delivered, [{ id: 'filter', x: 20 }]);
```

Run: `npm test`

Expected: FAIL until cancellation resets the throttler's pending frame state.

- [ ] **Step 2: Implement and connect frame throttling**

Create the throttler in `onMounted`. Extract `event.currentTarget`, `clientX`, and `clientY` synchronously, then measure and write `--pointer-x`/`--pointer-y` in the scheduled frame. Cancel pending work on pointer leave and unmount.

Replace the full-surface moving gradient with a fixed-size radial-gradient pseudo-element. Keep the gradient static and move it with:

```css
transform: translate3d(
  calc(var(--pointer-x) - 50%),
  calc(var(--pointer-y) - 50%),
  0
);
will-change: transform;
```

- [ ] **Step 3: Verify tests and production build**

Run: `npm test && npm run build`

Expected: both commands exit 0 without warnings or errors.

- [ ] **Step 4: Commit pointer optimization**

```bash
git add src/App.vue src/styles.css scripts/test-vue-app.mjs
git commit -m "perf: throttle compositor glass highlights"
```

### Task 4: Local Ego Lite regression

**Files:**
- Modify only if regression reveals a defect: `src/App.vue`, `src/styles.css`, `src/lib/motion.js`, `scripts/test-vue-app.mjs`

**Interfaces:**
- Consumes: the complete local Vue app at the Vite development URL.
- Produces: verified interaction and performance evidence.

- [ ] **Step 1: Run semantic interaction regression**

Reuse Ego Lite task space `11`. Verify card open/close, rapid switching, Escape-to-close, every filter, all three theme states, and external-access semantics. After each action, observe `aria-expanded`, visible region state, focus, and absence of console errors.

- [ ] **Step 2: Run visual responsive regression**

Capture desktop and mobile screenshots. Verify no clipping, overlay, collapsed spacing, sticky-header collision, or detail-content jump at the settled state.

- [ ] **Step 3: Run performance sampling**

Collect Event Timing, Long Animation Frame, layout shift, and CDP `Performance.getMetrics` samples for card expansion and filter changes. Acceptance criteria:

- no long task over 50 ms at normal CPU speed;
- no long animation frame attributable to the click handler;
- click processing time below 16 ms;
- the computed detail transition no longer includes `max-height`;
- the glass panel itself remains unscaled.

- [ ] **Step 4: Run final local verification**

Run: `npm test && npm run build && git diff --check`

Expected: all commands exit 0.

### Task 5: GitHub Pages deployment and public regression

**Files:**
- No source changes unless deployment regression finds a defect.

**Interfaces:**
- Consumes: verified `main` branch and `.github/workflows/deploy.yml`.
- Produces: successful GitHub Pages deployment and verified public site.

- [ ] **Step 1: Push main**

Run: `git push origin main`

Expected: remote `main` advances to the verified local commit.

- [ ] **Step 2: Monitor GitHub Actions**

Use authenticated GitHub CLI state to identify the Pages workflow run for the pushed commit and wait until its conclusion is `success`. If authentication is unavailable, verify the workflow and deployment status through the repository's public Actions endpoints.

- [ ] **Step 3: Run public Ego Lite regression**

Navigate task space `11` to `https://seahub.github.io/LoomNest/`. Repeat card open/close, rapid switching, filter, theme, Escape, desktop/mobile settled visuals, console-error checks, and the normal-speed performance acceptance criteria.

- [ ] **Step 4: Close the browser task space**

After successful online regression, run `completeTaskSpace(11, { keep: false })` in its own final Ego Lite heredoc and confirm `{ done: true }`.
