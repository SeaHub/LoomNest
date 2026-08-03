# LoomNest 中文项目接入 README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将根目录 `README.md` 重写为中文、可由人类和 AI 直接执行的外部项目展示接入手册。

**Architecture:** 只修改根目录 README，不改变站点代码或配置格式。文档以 `public/works.json` 为唯一作品数据源、以 `public/assets/` 为正式素材目录，使用顺序化流程、字段表、四类完整示例、AI 操作约束和故障排查覆盖一次接入的完整生命周期。

**Tech Stack:** Markdown、JSON、Vue 3、Vite、Node.js、GitHub Actions、GitHub Pages

## Global Constraints

- “接入”只表示登记展示信息、宣传素材和访问入口；外部项目继续独立开发与部署。
- README 使用中文，命令、路径、字段名和配置值保留英文。
- 正式配置仅为 `public/works.json`；正式素材仅放在 `public/assets/`。
- 不修改页面逻辑、配置格式、测试脚本、现有素材或部署流程。
- 不将外部项目源码、依赖或构建产物复制到 LoomNest。
- `type` 只允许 `web`、`mini-program`、`mobile`、`future`。
- 外部链接只允许 `http://` 和 `https://`。
- 每个作品的 `image` 必须存在，扩展名必须为 `.jpg`、`.jpeg` 或 `.webp`；二维码可以使用 `.png`。
- 配置加载失败后的示例数据回退只是容错，不代表接入成功。

---

## File Structure

- Modify: `README.md` — 项目说明、正式接入流程、配置契约、AI 执行规范、验证与排查的唯一入口。
- Reference only: `public/works.json` — 核对当前正式数据结构与路径写法。
- Reference only: `src/lib/works.js` — 核对字段默认值、类型分流和 URL 安全规则。
- Reference only: `src/App.vue` — 核对配置加载、回退行为和实际入口渲染。
- Reference only: `scripts/test-vue-app.mjs` — 核对宣传图存在性与扩展名约束。
- Reference only: `.github/workflows/deploy.yml` — 核对测试、构建和 GitHub Pages 发布流程。

### Task 1: 重写并验证项目接入 README

**Files:**
- Modify: `README.md`
- Test: `README.md`

**Interfaces:**
- Consumes: `public/works.json` 中的作品对象结构、`src/lib/works.js` 的标准化与 URL 规则、`src/App.vue` 的渲染分支、`scripts/test-vue-app.mjs` 的素材约束、`.github/workflows/deploy.yml` 的发布步骤。
- Produces: 一份无需依赖设计规格即可执行的中文 `README.md`；它不会改变任何运行时接口。

- [x] **Step 1: 重新核对实现事实，防止 README 与代码脱节**

Run:

```bash
sed -n '1,220p' public/works.json
sed -n '1,180p' src/lib/works.js
rg -n "loadWorks|getAccessKind|qrImage|appStore|googlePlay|access.url" src/App.vue
rg -n "publicWorks|compressed preview image|preview image should exist" scripts/test-vue-app.mjs
sed -n '1,160p' .github/workflows/deploy.yml
```

Expected: 能确认四类 `type`、两种 `status`、各类 `access` 字段、HTTP(S) 链接限制、素材扩展名限制，以及推送 `main` 后的测试/构建/发布顺序。

- [x] **Step 2: 用已批准的章节结构完整替换 README**

将 `README.md` 写成以下章节，且不得用省略号代替可执行内容：

```markdown
# LoomNest

> LoomNest 是独立项目的展示索引，不负责构建或托管外部项目源码。

## 项目定位
## 快速开始
## 正式配置与目录
## 将一个外部项目接入 LoomNest
### 第 1 步：收集接入信息
### 第 2 步：选择项目类型
### 第 3 步：准备素材
### 第 4 步：编辑 public/works.json
### 第 5 步：验证配置
### 第 6 步：本地检查
### 第 7 步：发布
## 配置字段说明
## 四种项目类型示例
### 网站
### 小程序
### 移动应用
### 未来作品
## AI 执行规范
## 完成标准
## 常见问题
## 原型说明
```

必须在正文中明确：

- `public/works.json` 是顶层数组，数组顺序决定展示顺序。
- `id` 唯一且稳定，建议只含小写英文、数字和连字符。
- `title`、`titleEn`、`type`、`year`、`summary`、`image`、`role`、`access`、`status` 的含义、类型和接入时是否应填写。
- `web` → `access.url`。
- `mini-program` → `access.qrImage` 与可选 `access.qrAlt`。
- `mobile` → `access.appStore` 和/或 `access.googlePlay`。
- `future` 或 `status: "soon"` → `Coming Soon`，不提供入口链接。
- 宣传图使用 `./assets/<name>.jpg|jpeg|webp`，二维码可以使用 `./assets/<name>.png`。
- `prototype/works.json` 不是正式数据源，`dist/` 和 `node_modules/` 不得手工编辑。
- JSON 失败回退到内置示例时，接入仍判定为失败。
- AI 不得捏造缺失的标题、年份、正式 URL 或素材，不得改写无关作品。
- 发布章节保留正式站点 `https://seahub.github.io/LoomNest/`，并说明推送 `main` 后由 `.github/workflows/deploy.yml` 自动运行测试、构建和发布。
- 常见问题必须给出“现象 → 检查动作”：示例数据提示对应 JSON 语法/非空数组/请求路径；图片失败对应文件存在性/大小写/扩展名/相对路径；链接缺失对应 `access` 键和 HTTP(S) 协议；分类错误对应 `type`；排序错误对应 JSON 数组顺序；GitHub Pages 资源丢失对应禁止使用 `/assets/...` 根路径。

- [x] **Step 3: 写入四个可复制的完整 JSON 示例**

示例必须分别使用下列结构；实际 README 中将示例域名明确标注为“仅示例，接入时必须替换”，避免 AI 把占位链接当作完成结果。

```json
{
  "id": "project-website",
  "title": "项目名称",
  "titleEn": "Project Name",
  "type": "web",
  "year": 2026,
  "summary": "一句话说明项目解决的问题或提供的体验。",
  "image": "./assets/project-website.webp",
  "role": ["产品设计", "前端开发"],
  "access": { "url": "https://example.com/project" },
  "status": "live"
}
```

```json
{
  "id": "project-mini-program",
  "title": "小程序名称",
  "titleEn": "Mini Program Name",
  "type": "mini-program",
  "year": 2026,
  "summary": "一句话说明小程序的用途。",
  "image": "./assets/project-mini-program.webp",
  "role": ["产品设计", "开发"],
  "access": {
    "qrImage": "./assets/project-mini-program-qr.png",
    "qrAlt": "小程序名称的微信小程序二维码"
  },
  "status": "live"
}
```

```json
{
  "id": "project-mobile-app",
  "title": "应用名称",
  "titleEn": "Mobile App Name",
  "type": "mobile",
  "year": 2026,
  "summary": "一句话说明移动应用的用途。",
  "image": "./assets/project-mobile-app.webp",
  "role": ["产品设计", "移动端开发"],
  "access": {
    "appStore": "https://apps.apple.com/app/example",
    "googlePlay": "https://play.google.com/store/apps/details?id=com.example.app"
  },
  "status": "live"
}
```

```json
{
  "id": "project-future",
  "title": "未来项目名称",
  "titleEn": "Future Project Name",
  "type": "future",
  "year": "—",
  "summary": "项目仍在开发中的简短说明。",
  "image": "./assets/project-future.webp",
  "role": ["研究中"],
  "access": {},
  "status": "soon"
}
```

- [x] **Step 4: 对 README 做静态完整性检查**

Run:

```bash
rg -n '^## |^### ' README.md
rg -n 'public/works\.json|public/assets/|prototype/works\.json|npm test|npm run build|npm run dev|npm run preview' README.md
rg -n 'web|mini-program|mobile|future|appStore|googlePlay|qrImage|qrAlt|status|Coming Soon' README.md
git diff --check -- README.md
```

Expected: 章节完整；正式配置、正式素材、原型区别和四类入口均有明确说明；所有命令均出现；`git diff --check` 无输出并返回 0。

- [x] **Step 5: 验证仓库现有测试和生产构建**

Run:

```bash
npm test
npm run build
```

Expected: `npm test` 输出 `vue app helpers: ok`；`npm run build` 返回 0，并生成生产包。构建生成的 `dist/` 不纳入本次提交。

- [x] **Step 6: 审阅最终改动范围和措辞**

Run:

```bash
git diff -- README.md
git status --short
```

Expected: 运行时文件没有变化；除本计划文档外，实施改动仅包含 `README.md`。README 中没有未完成标记或未解释的占位值，也没有指示 AI 编辑 `prototype/works.json`、`dist/` 或 `node_modules/`。

- [x] **Step 7: 提交 README**

```bash
git add README.md docs/superpowers/plans/2026-08-03-readme-project-integration.md
git commit -m "docs: explain external project integration"
```

Expected: 提交成功，提交内容仅包含 README 与本实施计划。
