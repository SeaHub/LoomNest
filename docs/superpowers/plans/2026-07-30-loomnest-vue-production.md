# LoomNest Vue Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** 将现有 LoomNest 静态原型迁移为可运营的 Vue + Vite 网站，并部署到 GitHub Pages。

**Architecture:** 根目录使用 Vite 应用，Vue 组件管理交互状态，纯函数模块处理作品数据与链接安全，`public/works.json` 保持内容可编辑。Vite base 根据 GitHub Actions 的仓库名自动生成，Pages 工作流只发布构建产物。

**Tech Stack:** Vue 3, Vite, JavaScript ESM, CSS custom properties, GitHub Actions.

## Global Constraints

- 保留 Living Index 的编号作品索引和展开式详情。
- 支持 system、light、dark 三种主题，并持久化手动选择。
- 作品数据从 `public/works.json` 加载，加载失败显示友好提示和内置 fallback。
- 所有外链只允许 http/https，缺失链接不渲染空按钮。
- 支持键盘焦点、Escape 收起、reduced-motion 和 900px/680px 响应式断点。
- 使用半透明、模糊、内描边、高光的 Apple Liquid Glass 材质覆盖核心控件。

---

### Task 1: Establish the Vue application and data contract

**Files:**
- Create: `package.json`, `index.html`, `vite.config.js`
- Create: `src/main.js`, `src/lib/works.js`, `scripts/test-vue-app.mjs`
- Copy: `prototype/assets/*` to `public/assets/*`
- Copy: `prototype/works.json` to `public/works.json`

- [ ] Write the pure-function assertions in `scripts/test-vue-app.mjs` and run them to observe the missing-module failure.
- [ ] Implement `src/lib/works.js` with normalize/filter/access/theme/safe-url helpers.
- [ ] Add Vite scripts and run the helper test again.

### Task 2: Implement Vue layout and interactions

**Files:**
- Create: `src/App.vue`
- Modify: `src/main.js`

- [ ] Render semantic header, intro, filters, work list, details, footer, loading and fallback states.
- [ ] Add theme persistence and system preference listener.
- [ ] Add one-open-row state, filter state, Escape handling, focus restoration and smooth scrolling.
- [ ] Add type-specific access actions for web, mini-program, mobile and future records.

### Task 3: Implement the visual system and motion

**Files:**
- Create: `src/styles.css`

- [ ] Port the approved prototype layout tokens and responsive grid.
- [ ] Add Liquid Glass layers, pointer-following shine, row/detail/filter transitions and image reveal.
- [ ] Add focus, reduced-motion and opaque fallback styles.

### Task 4: Configure GitHub Pages and documentation

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/robots.txt`, `public/site.webmanifest`
- Modify: `README.md`

- [ ] Configure Vite base path and Pages artifact deployment.
- [ ] Document local development, content editing and deployed URL.
- [ ] Run tests, build, preview checks and browser interaction checks.

### Task 5: Deploy and verify

- [ ] Commit the Vue migration and deployment workflow.
- [ ] Push to GitHub and wait for the Pages workflow.
- [ ] Verify the deployed HTML, asset paths and interaction behavior.
