# LoomNest Portfolio Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Build a standalone, GitHub Pages-compatible HTML prototype that presents LoomNest works from editable JSON, supports type-specific access actions, inline expansion, filtering, and system/light/dark Liquid Glass themes.

**Architecture:** Keep the prototype isolated under `prototype/`. `works.json` is the only content source; `app.js` exposes small pure helpers plus DOM rendering; `styles.css` owns the responsive Liquid Glass visual system. The page is static and has no backend, auth, or build step, so GitHub Pages can serve the folder directly.

**Tech Stack:** Vanilla HTML, CSS, ES modules, JSON, Node.js built-in assertions for pure-function checks, Python `http.server` for local preview.

## Global Constraints

- Use the selected “Living Index” information hierarchy: numbered index rows with inline detail expansion.
- Support `system`, `light`, and `dark` themes; default to the system preference with a manual toggle.
- Generate access UI from `type`: `web`, `mini-program`, `mobile`, and `future`.
- Keep works in a standalone editable `prototype/works.json` file.
- Show no empty access buttons when a URL is missing; show `Coming Soon` for `status: "soon"`.
- Keep the prototype independent from future production code and compatible with GitHub Pages.
- All actionable controls need keyboard focus styles and accessible names.

---

### Task 1: Establish data helpers and test contract

**Files:**
- Create: `prototype/app.js`
- Create: `scripts/test-prototype.mjs`

**Interfaces:**
- `normalizeWorks(rawWorks) -> Work[]`: returns a safe list with defaults for missing optional fields.
- `filterWorks(works, filter) -> Work[]`: returns all works for `all`, otherwise matches `work.type`.
- `getAccessKind(work) -> "web" | "mini-program" | "mobile" | "future"`: maps `future` or `soon` to `future`.
- `resolveTheme(mode, systemDark) -> "light" | "dark"`: resolves `system` to the supplied system preference.

- [ ] **Step 1: Write failing pure-function checks**

  In `scripts/test-prototype.mjs`, import the four named helpers and assert:

  ```js
  import assert from 'node:assert/strict';
  import { filterWorks, getAccessKind, normalizeWorks, resolveTheme } from '../prototype/app.js';

  const sample = normalizeWorks([
    { id: 'web-1', title: 'Web', type: 'web', year: 2026 },
    { id: 'mini-1', title: 'Mini', type: 'mini-program', year: 2025 },
    { id: 'soon-1', title: 'Soon', type: 'future', status: 'soon' }
  ]);

  assert.equal(sample.length, 3);
  assert.equal(sample[0].status, 'live');
  assert.equal(filterWorks(sample, 'mobile').length, 0);
  assert.equal(filterWorks(sample, 'mini-program').length, 1);
  assert.equal(getAccessKind(sample[2]), 'future');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('light', true), 'light');
  console.log('prototype helpers: ok');
  ```

- [ ] **Step 2: Run the checks and confirm the initial failure**

  Run `node scripts/test-prototype.mjs`.

  Expected result: FAIL because `prototype/app.js` and the named exports do not exist yet.

- [ ] **Step 3: Implement the minimal helper exports**

  Keep helpers pure and use these defaults: `titleEn: ''`, `summary: ''`, `image: ''`, `role: []`, `access: {}`, `status: 'live'`, and `year: '—'`. `normalizeWorks` must ignore non-object items and preserve JSON order.

- [ ] **Step 4: Run the checks again**

  Run `node scripts/test-prototype.mjs` and expect `prototype helpers: ok`.

- [ ] **Step 5: Commit the isolated helper contract**

  Run `git add prototype/app.js scripts/test-prototype.mjs && git commit -m "test: define portfolio data helpers"`.

### Task 2: Add editable demo content and access rendering

**Files:**
- Create: `prototype/works.json`
- Modify: `prototype/app.js`

**Interfaces:**
- `renderAccessActions(work) -> string`: returns the type-specific action markup; never emits empty links.
- `renderWorkRow(work, isOpen) -> string`: returns one index row and optional detail content.

- [ ] **Step 1: Add representative JSON records**

  Add at least five records in `prototype/works.json`: two `web`, one `mini-program` with `access.qrImage`, one `mobile` with both store links, and one `future` with `status: "soon"`. Use local asset paths under `./assets/` and realistic Chinese/English titles.

- [ ] **Step 2: Write failing access-render checks**

  Extend `scripts/test-prototype.mjs` with assertions that a web record contains `访问网站`, a mini-program record contains `二维码`, a mobile record contains both store labels, and a soon record contains `Coming Soon` but no `href=`.

- [ ] **Step 3: Implement access and row renderers**

  Escape text inserted into markup, add `target="_blank" rel="noreferrer"` to external links, add `aria-label` values containing the work title, and include a `<button>` row trigger with `aria-expanded` and `aria-controls`.

- [ ] **Step 4: Run the helper and access checks**

  Run `node scripts/test-prototype.mjs`; expect all assertions to pass.

- [ ] **Step 5: Commit content and rendering**

  Run `git add prototype/works.json prototype/app.js scripts/test-prototype.mjs && git commit -m "feat: add JSON-driven work access rendering"`.

### Task 3: Build the static page shell and Liquid Glass visual system

**Files:**
- Create: `prototype/index.html`
- Create: `prototype/styles.css`
- Create: `prototype/assets/` demo images and QR artwork copied from the approved visual exploration or generated specifically for the prototype.
- Modify: `prototype/app.js`

**Interfaces:**
- `mountPortfolio(root, works)`: renders the intro, theme control, filter bar, column labels, and work list into `root`.

- [ ] **Step 1: Add the semantic HTML shell**

  Include a skip link, `<header>` with LoomNest identity and theme control, `<main>` with intro and `aria-live` work list, and a footer. Load `styles.css` and `app.js` as a module; do not add framework dependencies.

- [ ] **Step 2: Implement desktop and mobile layout tokens**

  Use CSS custom properties for surfaces, text, borders, accents, and blur. Create the two-column desktop layout, a one-column breakpoint at 900px, and a horizontally scrollable filter row below 680px. Use `backdrop-filter` only on glass surfaces and provide opaque fallbacks for unsupported browsers.

- [ ] **Step 3: Add Liquid Glass states**

  Style selected rows, details, controls, and focus rings with translucent gradients, inner highlights, subtle border contrast, and restrained shadows. Define `[data-theme="dark"]` tokens and keep the content contrast readable in both themes.

- [ ] **Step 4: Wire JSON loading into the page**

  `index.html` calls `loadWorks()` on `DOMContentLoaded`; successful fetch renders records, while a rejected fetch shows a visible but non-blocking “示例数据” notice and renders the same in-memory demo records used by the tests.

- [ ] **Step 5: Check the static page structure**

  Run `node --check prototype/app.js` and `node scripts/test-prototype.mjs`. Confirm the file tree contains only static assets and no build output.

- [ ] **Step 6: Commit the page shell**

  Run `git add prototype && git commit -m "feat: add LoomNest Liquid Glass portfolio shell"`.

### Task 4: Add interactions, themes, responsive behavior, and accessibility

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `prototype/index.html`

**Interfaces:**
- Theme button cycles `system -> light -> dark`; current mode is persisted under `loomnest-theme`.
- Filter buttons update `aria-pressed`, counts, and the rendered list without a page reload.
- Work row buttons toggle one open detail at a time and close on Escape.

- [ ] **Step 1: Implement theme state**

  Read `loomnest-theme` from `localStorage`, resolve system preference with `matchMedia('(prefers-color-scheme: dark)')`, update `data-theme`, and listen for system changes only while mode is `system`. Update the button label and `aria-label` after every change.

- [ ] **Step 2: Implement filter and expansion state**

  Keep `activeFilter` and `openWorkId` as local state. Re-render only the work list and filter states, restore focus to the triggering button, and set `aria-expanded` accurately.

- [ ] **Step 3: Add keyboard and reduced-motion behavior**

  Use real buttons for filters and rows, close the expanded detail on Escape, provide `:focus-visible` outlines, and wrap transitions in `@media (prefers-reduced-motion: reduce)` to disable movement.

- [ ] **Step 4: Run behavior checks**

  Run `node scripts/test-prototype.mjs` and `node --check prototype/app.js`. Manually verify light/dark/system cycling, filtering counts, one-open-row behavior, Escape close, external links, QR image alt text, and missing-link suppression.

- [ ] **Step 5: Commit the completed interaction pass**

  Run `git add prototype && git commit -m "feat: add portfolio interactions and theme switching"`.

### Task 5: Preview and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add local preview instructions**

  Document `python3 -m http.server 4173 --directory prototype` and explain that `prototype/works.json` is the editable content source.

- [ ] **Step 2: Serve the prototype locally**

  Start the command from the repository root and keep the server running for preview. Open the printed URL in the available in-app browser.

- [ ] **Step 3: Verify the acceptance matrix**

  Check desktop and mobile widths, all filters, all four access types, system/light/dark themes, keyboard navigation, reduced motion, JSON fallback notice, and no console errors. Use `curl -I http://localhost:4173/` to confirm static serving.

- [ ] **Step 4: Commit documentation and final source**

  Run `git add README.md prototype && git commit -m "docs: add prototype preview instructions"`.

