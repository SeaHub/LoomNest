# Header Navigation and Theme Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the header `Works` link and expose only dark/light theme switching while continuing to follow the operating-system theme until the user makes an explicit choice.

**Architecture:** Keep system following as the absence of an explicit preference (`null`) rather than a third visible mode. Put preference normalization, resolution, and two-state toggling in `src/lib/works.js`; let `App.vue` own storage, media-query lifecycle, DOM theme application, and presentation. Simplify the header grid after removing the link.

**Tech Stack:** Vue 3 Composition API, Vite 8, JavaScript ES modules, Node.js `assert`, CSS Grid

## Global Constraints

- The header theme control must display only `深色` and `浅色`; it must never display `系统` or `跟随系统`.
- With no explicit `light` or `dark` preference, the rendered theme must keep responding to `prefers-color-scheme: dark` changes.
- A stored `system`, missing value, malformed value, or storage read failure means no explicit preference.
- The first manual toggle must persist only `light` or `dark` and stop subsequent system changes from affecting the rendered theme.
- Remove the header `Works` link from both the visual layout and keyboard focus order; retain the skip link and the body `Works` heading.
- Do not modify work data, filtering, expansion, animation, or the static `prototype/` directory.
- Do not add dependencies.

---

## File Structure

- `src/lib/works.js`: normalize stored theme preferences, resolve explicit/automatic themes, and return the opposite visible theme.
- `scripts/test-vue-app.mjs`: behavior tests for automatic resolution, legacy value handling, explicit overrides, and two-state toggling.
- `src/App.vue`: connect helpers to local storage and media queries; render two-state copy; remove the header `Works` link.
- `src/styles.css`: collapse the desktop and mobile navigation grids to one filter column and remove obsolete link rules.

### Task 1: Define the visible two-state theme contract

**Files:**
- Modify: `scripts/test-vue-app.mjs:4-37`
- Modify: `src/lib/works.js:1-38`

**Interfaces:**
- Produces: `normalizeThemePreference(value: unknown): 'light' | 'dark' | null`.
- Produces: `resolveTheme(preference: 'light' | 'dark' | null, systemDark: boolean): 'light' | 'dark'`.
- Produces: `getNextTheme(theme: 'light' | 'dark'): 'light' | 'dark'`.
- Consumers: `src/App.vue` and the Node test suite.

- [ ] **Step 1: Write failing helper tests**

Add `getNextTheme` and `normalizeThemePreference` to the import from `../src/lib/works.js`, then replace the existing two theme assertions with:

```js
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
```

These expectations catch accidental reintroduction of `system` as a selectable value, failure to follow the system without a preference, explicit preferences being overridden by the system, and a three-state toggle.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test
```

Expected: FAIL during module loading because `getNextTheme` and `normalizeThemePreference` are not exported.

- [ ] **Step 3: Implement the minimal helpers**

Replace `allowedThemes` and the existing `resolveTheme` implementation in `src/lib/works.js` with:

```js
const explicitThemes = new Set(['light', 'dark']);

export function normalizeThemePreference(value) {
  return explicitThemes.has(value) ? value : null;
}

export function resolveTheme(preference, systemDark) {
  return normalizeThemePreference(preference) ?? (systemDark ? 'dark' : 'light');
}

export function getNextTheme(theme) {
  return theme === 'dark' ? 'light' : 'dark';
}
```

Keep work normalization, filtering, access, URL safety, and cache URL helpers unchanged.

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```bash
npm test
```

Expected: exit code `0` with `vue app helpers: ok`.

- [ ] **Step 5: Commit the helper contract**

```bash
git add scripts/test-vue-app.mjs src/lib/works.js
git commit -m "test: define automatic two-state themes"
```

### Task 2: Integrate automatic defaults and manual two-state selection

**Files:**
- Modify: `src/App.vue:3-122`
- Modify: `src/App.vue:242-274`
- Modify: `src/App.vue:280-304`
- Modify: `src/styles.css:130-160`
- Modify: `src/styles.css:430-435`

**Interfaces:**
- Consumes: `normalizeThemePreference`, `resolveTheme`, and `getNextTheme` from Task 1.
- Produces: an absent explicit preference that follows `systemDark`, a persisted manual preference, two-state visible/accessible copy, and a header without the `Works` link.

- [ ] **Step 1: Record the failing rendered behavior**

Start the current application:

```bash
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

In a browser with local storage cleared, inspect the rendered header at desktop and mobile widths. Expected before implementation:

- `.site-nav > a[href="#works"]` exists and can receive focus;
- `[data-theme-toggle]` contains `系统`;
- clicking the theme control from automatic dark mode persists `light` only after first passing through the old three-state sequence where applicable.

- [ ] **Step 2: Connect the two-state helpers in `App.vue`**

Add `getNextTheme` and `normalizeThemePreference` to the imports from `./lib/works.js`. Change the preference state and derived labels to:

```js
const themeMode = ref(null);
const systemDark = ref(false);

const themeResolved = computed(() => resolveTheme(themeMode.value, systemDark.value));
const themeNames = { light: '浅色', dark: '深色' };
const nextTheme = computed(() => getNextTheme(themeResolved.value));
const themeButtonLabel = computed(() => `${themeNames[themeResolved.value]} · ${themeNames[nextTheme.value]}`);
const themeButtonAriaLabel = computed(() => `当前主题：${themeNames[themeResolved.value]}，点击切换到${themeNames[nextTheme.value]}`);
```

Change `readTheme` so every non-explicit value, including legacy `system`, becomes automatic:

```js
function readTheme() {
  try {
    return normalizeThemePreference(window.localStorage.getItem('loomnest-theme'));
  } catch {
    return null;
  }
}
```

Change `cycleTheme` to leave automatic mode by persisting the opposite of the currently rendered theme:

```js
function cycleTheme() {
  themeMode.value = nextTheme.value;
  saveTheme(themeMode.value);
}
```

Watch only `themeResolved`, so system changes do not reapply an explicit theme:

```js
watch(themeResolved, applyTheme);
```

Retain the media-query setup, `handleSystemThemeChange`, initial `applyTheme()`, and unmount cleanup. This is required for automatic mode to continue responding dynamically.

- [ ] **Step 3: Remove the header link and collapse its grids**

Delete this template node from `.site-nav`:

```vue
<a class="is-current" href="#works">Works</a>
```

Render the already-composed button label without appending a mode-map lookup:

```vue
{{ themeButtonLabel }}
```

Change the desktop navigation layout to one column:

```css
.site-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  min-width: 0;
}
```

Delete the obsolete `.site-nav > a`, `.site-nav a`, hover/current, and current underline rules. At `max-width: 680px`, use:

```css
.site-nav { grid-column: 1 / -1; grid-row: 2; display: grid; grid-template-columns: minmax(0, 1fr); }
.header-filter-scroll { grid-column: 1; grid-row: 1; padding-block: 5px; }
```

Keep the skip link, `.brand`, body `#works`, and `#works-heading` unchanged.

- [ ] **Step 4: Verify the rendered behavior turns GREEN**

With local storage cleared and emulated system dark mode:

- confirm `document.documentElement.dataset.theme === 'dark'`;
- confirm theme text is `深色 · 浅色` and contains neither `系统` nor `跟随系统`;
- switch the emulated system to light and confirm the dataset and text become `light` and `浅色 · 深色`;
- click once and confirm the dataset becomes `dark` and `localStorage['loomnest-theme'] === 'dark'`;
- switch the emulated system again and confirm the explicit dark theme remains;
- set the stored value to `system`, reload, and confirm system following resumes;
- confirm `.site-nav > a[href="#works"]` is absent while `a.skip-link[href="#works"]` and `#works-heading` remain.

At widths `1564 × 1013` and `390 × 844`, confirm the filter row does not overlap the theme button and `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

- [ ] **Step 5: Run full automated verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: tests exit `0` with `vue app helpers: ok`, Vite build exits `0`, and `git diff --check` prints no errors.

- [ ] **Step 6: Commit the integration**

```bash
git add src/App.vue src/styles.css
git commit -m "feat: simplify header theme controls"
```
