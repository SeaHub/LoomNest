# LoomNest Main Content Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the left introduction and `About` navigation entry, then let the works area occupy the full existing content container.

**Architecture:** Keep the current Vue single-page structure and all work-list behavior. Make `works-column` the only child of the main grid, change that grid to one full-width column, and remove CSS used exclusively by the deleted introduction.

**Tech Stack:** Vue 3, Vite 8, CSS Grid, Node.js assertion tests, Chromium layout checks

## Global Constraints

- Keep the current responsive container width and viewport side margins.
- Do not change work data, filtering, detail expansion, access links, theme switching, reduced-motion behavior, or deployment.
- Do not move the deleted introduction content elsewhere.
- Do not add dependencies.
- Preserve the `#works` skip link and valid `Works` and `Notes` navigation anchors.

---

### Task 1: Expand the works area and remove the introduction

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: the existing `App.vue` template contract and CSS class names.
- Produces: a template with `works-column` as the sole `page-grid` child and a single-column `.page-grid` layout at every viewport width.

- [x] **Step 1: Record the failing rendered-layout test**

Start the local server:

```bash
npm run dev -- --host 127.0.0.1
```

At a desktop viewport around `1712 × 1025`, evaluate the rendered DOM and record:

- whether `.intro-column` exists;
- whether `a[href="#about"]` exists;
- the bounding widths of `.page-grid` and `.works-column`;
- the computed `grid-template-columns` value.

Expected before implementation: the introduction and About link exist, the works width is smaller than the grid width, and the grid reports two columns.

- [x] **Step 2: Remove the introduction and About entry**

In `src/App.vue`, keep only the valid navigation links:

```vue
<nav class="site-nav" aria-label="主导航">
  <a class="is-current" href="#works">Works</a>
  <a href="#notes">Notes</a>
</nav>
```

Delete the complete `<aside class="intro-column" id="about">…</aside>` block. Keep the existing `<section class="works-column" id="works" …>` unchanged as the only child inside `<main class="page-grid">`.

- [x] **Step 3: Convert the main grid to one column and remove dead styles**

In `src/styles.css`, replace the desktop grid declaration with:

```css
.page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding: 74px 0 84px;
}

.works-column { min-width: 0; }
```

Delete rules used only by the removed introduction:

```css
.intro-column
.intro-column h1
.intro-copy
.intro-copy--en
.meta-list
.meta-list div
.meta-list dt
.meta-list dd
.reveal
.reveal--one
.reveal--two
.reveal--three
.reveal--four
.reveal--five
@keyframes rise-in
```

Remove `meta-list dt` from the shared monospace selector. In the `max-width: 900px` and `max-width: 680px` media queries, delete the now-redundant `.page-grid` column/gap override and all `.intro-column`, `.intro-column h1`, and `.meta-list` declarations. Preserve existing responsive width, padding, work-row, detail, footer, and loading-row rules.

- [x] **Step 4: Run automated verification**

Run: `npm test`

Expected: `vue app helpers: ok`

Run: `npm run build`

Expected: Vite exits with code 0 and writes the production bundle to `dist/`.

- [x] **Step 5: Verify the rendered layout**

At a desktop viewport around `1712 × 1025`, verify:

- the left introduction and `About` link are absent;
- the works heading, filters, column labels, rows, and expanded detail use the full main container width;
- no large blank column remains on the left;
- `Works` and `Notes` navigate to valid targets;
- filters, theme cycling, row expansion, and Escape-to-close still work.

At a mobile viewport around `390 × 844`, verify:

- the works section begins after the normal main top padding with no introduction gap;
- rows and expanded details do not overflow horizontally;
- the header navigation contains only `Works` and `Notes`.

- [ ] **Step 6: Commit the implementation**

```bash
git add docs/superpowers/plans/2026-07-31-main-content-expansion.md src/App.vue src/styles.css
git commit -m "feat: expand works content area"
```
