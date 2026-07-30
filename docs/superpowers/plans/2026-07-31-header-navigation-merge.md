# Header Navigation Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the three screenshot-marked text elements and move the work-category filters into the main glass header at desktop and mobile widths.

**Architecture:** Keep filtering state and behavior inside the existing Vue `App.vue` component, but render its single filter toolbar inside the main navigation instead of the works section. Update the existing responsive CSS so the header is a single row on desktop and a two-row layout on mobile, with only the category strip scrolling horizontally.

**Tech Stack:** Vue 3, Vite 8, CSS Grid/Flexbox, Node.js assertion tests, Chromium browser verification

## Global Constraints

- Keep `Works`, theme cycling, filter counts, active state, focus behavior, filter animation, work expansion, Escape-to-close, and reduced-motion support working.
- Delete the brand subtitle, the `Notes` navigation entry, and “点击作品行，展开详情”.
- Render exactly one category toolbar, inside the main header.
- Do not add a nested glass container around the category toolbar.
- On mobile, keep brand and theme on row one; keep `Works` and the horizontally scrollable category buttons on row two.
- Do not change work data, routes, dependencies, deployment, or backend behavior.

---

## File Structure

- `src/App.vue`: owns the header markup, filter toolbar rendering, and works-section markup.
- `src/styles.css`: owns desktop and mobile header layout, category scrolling, and removal of dead section-note/filter spacing.
- `design-qa.md`: records same-viewport screenshot comparison and final visual QA status.

### Task 1: Merge the category toolbar into the header

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing `filters`, `activeFilter`, `countFor(filter)`, `handleFilter(filter)`, `themeButtonAriaLabel`, and `cycleTheme()`.
- Produces: one `.filter-bar` inside `.site-header`; `.header-filter-scroll` as the category overflow container; unchanged `data-filter`, `aria-pressed`, and click bindings.

- [x] **Step 1: Start the current app for a failing browser check**

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Use `ego-browser` at `1564 × 1013` to evaluate the rendered DOM and record these boolean requirements:

```js
({
  subtitleRemoved: !document.querySelector('.brand span'),
  notesRemoved: !document.querySelector('.site-nav a[href="#notes"]'),
  hintRemoved: !document.querySelector('.section-note'),
  filterInsideHeader: Boolean(document.querySelector('.site-header .filter-bar')),
  filterOutsideMain: !document.querySelector('main .filter-bar'),
})
```

- [x] **Step 2: Verify the browser check fails for the intended reason**

Expected before implementation:

```js
{
  subtitleRemoved: false,
  notesRemoved: false,
  hintRemoved: false,
  filterInsideHeader: false,
  filterOutsideMain: false
}
```

This proves the browser check observes the exact rendered behavior being changed, rather than source text.

- [x] **Step 3: Move the toolbar and remove marked content**

Replace the current header contents in `src/App.vue` with:

```vue
<header class="site-header glass-surface" @pointermove="updateGlassPointer" @pointerleave="clearGlassPointer">
  <a class="brand" href="./" aria-label="LoomNest 首页">LoomNest</a>
  <nav class="site-nav" aria-label="主导航">
    <div class="header-filter-scroll">
      <div class="filter-bar" role="toolbar" aria-label="作品分类筛选">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="filter-button"
          :class="{ 'is-active': activeFilter === filter.value }"
          type="button"
          :data-filter="filter.value"
          :aria-pressed="activeFilter === filter.value"
          @click="handleFilter(filter.value)"
        >
          {{ filter.label }} <span>{{ countFor(filter.value) }}</span>
        </button>
      </div>
    </div>
    <a class="is-current" href="#works">Works</a>
  </nav>
  <button class="theme-toggle glass-control" type="button" data-theme-toggle :aria-label="themeButtonAriaLabel" @click="cycleTheme">
    <span class="theme-orb" aria-hidden="true"></span>
    {{ themeButtonLabel }} · {{ nextThemeNames[themeMode] }}
  </button>
</header>
```

In the `.section-heading` block, keep only:

```vue
<div class="section-heading">
  <div>
    <p class="eyebrow">ARCHIVE / 01—∞</p>
    <h2 id="works-heading">Selected Works</h2>
  </div>
</div>
```

Delete the old main-content `<div class="filter-bar glass-surface" ...>...</div>` completely.

- [x] **Step 4: Implement the desktop header and direct filter styling**

In `src/styles.css`, replace the relevant header/navigation/filter declarations with:

```css
.site-header {
  position: sticky;
  top: 12px;
  z-index: 20;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  margin-top: 12px;
  padding: 14px 20px;
  border-radius: 24px;
}

.brand {
  font-size: 1.18rem;
  font-weight: 740;
  letter-spacing: -0.04em;
  text-decoration: none;
  white-space: nowrap;
}

.site-nav {
  display: flex;
  gap: 18px;
  align-items: center;
  min-width: 0;
}

.site-nav > a {
  flex: none;
}

.header-filter-scroll {
  min-width: 0;
  overflow-x: auto;
  padding: 5px;
  scrollbar-width: none;
}

.header-filter-scroll::-webkit-scrollbar {
  display: none;
}

.filter-bar {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  width: max-content;
}
```

Keep the current `.filter-button` and `.filter-button.is-active` rules, but change the active shadow to a compact header treatment:

```css
.filter-button.is-active {
  color: var(--ink);
  background: var(--glass-strong);
  box-shadow: inset 0 1px 0 var(--glass-shine), 0 4px 14px rgba(74, 77, 83, 0.08);
}
```

Remove the unused `.brand span` and `.section-note` rules. Change `.section-heading` to:

```css
.section-heading {
  margin-bottom: 22px;
}
```

- [x] **Step 5: Implement the mobile two-row header**

Replace the header-specific declarations inside `@media (max-width: 680px)` with:

```css
.site-header {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 16px;
  padding: 13px 14px;
  border-radius: 18px;
}

.site-nav {
  grid-column: 1 / -1;
  grid-row: 2;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
}

.site-nav > a {
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  padding-inline: 4px;
}

.header-filter-scroll {
  grid-column: 2;
  grid-row: 1;
  padding-block: 5px;
}

.theme-toggle {
  justify-self: end;
  padding-inline: 10px;
}
```

Remove the old mobile `.brand span`, `.site-nav { justify-content: space-between; }`, `.section-note`, and `.filter-bar { width: 100%; overflow-x: auto; ... }` declarations. The overflow responsibility now belongs only to `.header-filter-scroll`.

- [x] **Step 6: Run automated verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected:

- `vue app helpers: ok`
- Vite production build exits with status 0
- `git diff --check` exits with no output

- [ ] **Step 7: Commit the functional change**

```bash
git add docs/superpowers/plans/2026-07-31-header-navigation-merge.md src/App.vue src/styles.css
git commit -m "feat: merge filters into main navigation"
```

### Task 2: Verify responsive layout and interactions

**Files:**
- Modify: `design-qa.md`
- Create: `implementation-header-merge-1564.png`
- Create: `implementation-header-merge-mobile.png`
- Modify if required by QA: `src/App.vue`
- Modify if required by QA: `src/styles.css`

**Interfaces:**
- Consumes: `.site-header`, `.site-nav`, `.header-filter-scroll`, `.filter-bar`, `.filter-button`, and the existing work-row interactions from Task 1.
- Produces: same-viewport desktop/mobile evidence and `design-qa.md` containing `final result: passed`.

- [x] **Step 1: Start the local app**

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Expected: Vite serves the app on port `4173` and remains running for browser inspection.

- [x] **Step 2: Verify and capture the desktop view**

Open the app at `1564 × 1013`, wait for works data to load, and verify:

- header order is `LoomNest`, category toolbar, `Works`, theme toggle;
- the removed subtitle, `Notes`, and section hint are absent;
- the category toolbar has no nested glass outline;
- the works table begins after the title with no abandoned filter gap;
- each filter updates visible rows, count highlight, and pressed state;
- one work opens, and Escape closes it;
- all header items fit without overlap.

Save the screenshot as:

```text
implementation-header-merge-1564.png
```

- [x] **Step 3: Verify and capture the mobile view**

Set the viewport to `390 × 844` and verify:

- brand and theme are on the first header row;
- `Works` and the category strip are on the second row;
- the category strip scrolls horizontally while `Works` remains visible;
- selecting the last category moves focus into view;
- neither the header nor page creates viewport-level horizontal overflow;
- work filtering, expansion, Escape close, and theme cycling remain functional.

Save the screenshot as:

```text
implementation-header-merge-mobile.png
```

- [x] **Step 4: Run design QA against the supplied screenshot**

Compare `/var/folders/pk/3qb4pft56c93sh04v956cnlw0000gn/T/codex-clipboard-552a1355-c321-42d1-9d12-82960d0407b1.png` with the desktop and mobile implementation captures. Replace `design-qa.md` with a report that records:

```markdown
# Design QA

## Reference and captures

- Reference: supplied LoomNest screenshot at 1564 × 1013
- Desktop: `implementation-header-merge-1564.png`
- Mobile: `implementation-header-merge-mobile.png`

## Required changes

- Brand subtitle removed.
- Notes navigation removed.
- Section hint removed.
- Category toolbar merged into the glass header without a nested glass surface.
- Mobile header uses two rows with category-only horizontal scrolling.

## Findings

- P0: none
- P1: none
- P2: none

final result: passed
```

If a P0, P1, or P2 issue is found, list the concrete issue instead of declaring pass, fix it in `src/App.vue` or `src/styles.css`, repeat Steps 2–4, and only finish when the report says `final result: passed`.

- [ ] **Step 5: Re-run final verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: tests pass, production build succeeds, and no whitespace errors are reported.

- [ ] **Step 6: Commit QA evidence and any corrective changes**

```bash
git add design-qa.md implementation-header-merge-1564.png implementation-header-merge-mobile.png src/App.vue src/styles.css
git commit -m "test: verify merged header navigation"
```
