# Header Filter Left Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the desktop category filters to the open space immediately after the LoomNest brand and rename the works heading from `Selected Works` to `Works`.

**Architecture:** Preserve the current Vue template hierarchy and three-column header grid. Change only the filter overflow container’s grid alignment and the existing heading text, then verify the rendered geometry and responsive behavior with ego-browser before deploying the `main` branch through the existing GitHub Pages workflow.

**Tech Stack:** Vue 3, Vite 8, CSS Grid, Node.js tests, ego-browser Chromium, GitHub Actions, GitHub Pages

## Global Constraints

- Work directly on `main` as explicitly requested.
- Keep `ARCHIVE / 01—∞`, `Works` navigation, theme control, filter data, counts, selected state, focus behavior, work expansion, Escape handling, and reduced-motion behavior unchanged.
- Do not use fixed offsets, negative margins, or transforms to position the filter group.
- Keep the existing mobile two-row header and category-only horizontal scrolling.
- Do not add dependencies, routes, assets, backend behavior, or unrelated layout changes.
- Push to `origin/main`, wait for the Pages workflow, and verify the deployed URL with ego-browser.

---

## File Structure

- `src/App.vue`: changes only the visible `#works-heading` copy.
- `src/styles.css`: changes only the filter overflow container’s grid alignment.
- `design-qa.md`: records reference, captures, geometry, responsive checks, interactions, and final pass state.
- `implementation-header-left-1564.png`: desktop evidence at the supplied reference viewport.
- `implementation-header-left-mobile.png`: mobile evidence at 390 × 844.

### Task 1: Left-align the filters and rename the heading

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `.site-header`, `.brand`, `.site-nav`, `.header-filter-scroll`, `.filter-bar`, and `#works-heading`.
- Produces: a desktop filter-to-brand gap no greater than 60 CSS pixels, a right-aligned `Works` navigation entry, and heading text exactly equal to `Works`.

- [ ] **Step 1: Start the current app**

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Expected: Vite serves the current `main` branch on port 4173.

- [ ] **Step 2: Record the failing rendered behavior with ego-browser**

At a `1564 × 1013` viewport, evaluate:

```js
(() => {
  const brand = document.querySelector('.brand').getBoundingClientRect()
  const filters = document.querySelector('.filter-bar').getBoundingClientRect()
  const header = document.querySelector('.site-header').getBoundingClientRect()
  const works = document.querySelector('.site-nav > a').getBoundingClientRect()

  return {
    heading: document.querySelector('#works-heading').textContent.trim(),
    filterGap: Math.round(filters.left - brand.right),
    filterLeftRatio: Number(((filters.left - header.left) / header.width).toFixed(3)),
    worksLeftRatio: Number(((works.left - header.left) / header.width).toFixed(3)),
    filterIsInBlueTarget: filters.left - brand.right <= 60,
    headingIsWorks: document.querySelector('#works-heading').textContent.trim() === 'Works',
  }
})()
```

Expected before implementation:

- `filterIsInBlueTarget` is `false`;
- `headingIsWorks` is `false`;
- the heading is `Selected Works`.

- [ ] **Step 3: Implement the minimal template change**

In `src/App.vue`, replace:

```vue
<h2 id="works-heading">Selected Works</h2>
```

with:

```vue
<h2 id="works-heading">Works</h2>
```

Keep the surrounding eyebrow and section structure unchanged.

- [ ] **Step 4: Implement the minimal layout change**

In `src/styles.css`, change:

```css
.header-filter-scroll {
  justify-self: center;
```

to:

```css
.header-filter-scroll {
  justify-self: start;
```

Keep the current maximum width, overflow, padding, scrollbar, navigation grid, mobile grid, and theme styles unchanged.

- [ ] **Step 5: Verify the rendered behavior turns green**

Repeat the Step 2 ego-browser evaluation at `1564 × 1013`.

Expected:

- `heading` is `Works`;
- `filterGap` is between 20 and 60 CSS pixels;
- `filterLeftRatio` is below `0.2`;
- `worksLeftRatio` remains above `0.8`;
- `filterIsInBlueTarget` and `headingIsWorks` are both `true`.

- [ ] **Step 6: Run automated verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected:

- `vue app helpers: ok`;
- Vite exits with status 0 and writes `dist/`;
- `git diff --check` exits with no output.

- [ ] **Step 7: Commit the functional change**

```bash
git add src/App.vue src/styles.css
git commit -m "feat: align header filters with brand"
```

### Task 2: Verify, publish, and validate GitHub Pages

**Files:**
- Modify: `design-qa.md`
- Create: `implementation-header-left-1564.png`
- Create: `implementation-header-left-mobile.png`

**Interfaces:**
- Consumes: the rendered layout from Task 1 and the supplied screenshot at `/var/folders/pk/3qb4pft56c93sh04v956cnlw0000gn/T/codex-clipboard-275bdcd6-fa83-4022-b39e-0543085f93cd.png`.
- Produces: `design-qa.md` with `final result: passed`, committed visual evidence, synchronized `origin/main`, a successful Pages workflow, and a verified production URL.

- [ ] **Step 1: Capture and verify the desktop view**

Create or reuse the named ego-browser space:

```js
const task = await useOrCreateTaskSpace('loomnest header left align verification')
cliLog('task space id: ' + task.id)
```

At `1564 × 1013`, use that task space to verify:

- the filter group starts no more than 60 CSS pixels after the brand;
- the group is left-aligned in the screenshot’s blue target area;
- the `Works` navigation and theme control remain on the right without overlap;
- `#works-heading` reads `Works`;
- `ARCHIVE / 01—∞` remains visible;
- selecting `网站` shows exactly `Atlas 文化地图` and `Field Notes`;
- a work row expands and Escape closes it;
- theme cycling changes its mode label;
- all five work images finish loading;
- no console or page errors are reported.

Save:

```text
implementation-header-left-1564.png
```

- [ ] **Step 2: Capture and verify responsive behavior**

At `700 × 900`, verify the brand, filter scroller, `Works`, and theme control remain ordered without overlap and the page has no horizontal overflow.

At `390 × 844`, verify:

- brand/theme remain on row one;
- `Works` and categories remain on row two;
- the category region scrolls horizontally;
- selecting and focusing `未来作品` scrolls it into view and shows only `Next Chapter`;
- the page has no horizontal overflow.

Save the mobile capture as:

```text
implementation-header-left-mobile.png
```

- [ ] **Step 3: Update design QA**

Compare the reference and implementation at the same `1564 × 1013` viewport. Update `design-qa.md` with:

- source and capture paths;
- source/implementation pixel sizes and device scale factor 1;
- desktop, 700-pixel, and mobile geometry results;
- fonts, spacing, colors, image quality, and copy checks;
- interaction and console checks;
- any P0/P1/P2 iteration history;
- `final result: passed` only when no actionable P0/P1/P2 issue remains.

- [ ] **Step 4: Run final local verification**

Run:

```bash
npm test
npm run build
git diff --check
rg -n '^final result: passed$' design-qa.md
```

Expected: tests and build pass, no whitespace errors are reported, and the QA report contains the exact pass line.

- [ ] **Step 5: Commit QA evidence**

```bash
git add design-qa.md implementation-header-left-1564.png implementation-header-left-mobile.png
git commit -m "test: verify left-aligned header filters"
```

- [ ] **Step 6: Push `main` and wait for Pages**

Run:

```bash
git push origin main
```

Use `gh run list` to identify the workflow triggered by the pushed HEAD, then:

```bash
RUN_ID=$(gh run list --commit "$(git rev-parse HEAD)" --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status --interval 5
```

Expected: build and deploy jobs both complete with `success`.

- [ ] **Step 7: Verify the deployed site with ego-browser**

Open:

```bash
DEPLOY_SHA=$(git rev-parse --short HEAD)
printf 'https://seahub.github.io/LoomNest/?v=%s\n' "$DEPLOY_SHA"
```

Repeat the desktop and mobile geometry, copy, filtering, focus, expansion/Escape, theme, image-loading, overflow, and error checks against the deployed page. Confirm the deployed asset state rather than relying on the successful workflow alone.

- [ ] **Step 8: Close the ego-browser task space**

After a prior ego-browser round confirms the online checks, run a dedicated final heredoc:

```js
const result = await completeTaskSpace('loomnest header left align verification', { keep: false })
cliLog(JSON.stringify(result, null, 2))
```

Expected: `{ "done": true }`.
