# LoomNest

> LoomNest 是独立数字项目的展示索引，不负责构建、托管或合并外部项目源码。

LoomNest 用于集中展示网站、小程序、移动应用和仍在开发中的作品。外部项目应继续在各自仓库中独立开发和部署；“接入 LoomNest”仅指在这里登记项目的展示信息、宣传素材和访问入口。

正式站点：[https://seahub.github.io/LoomNest/](https://seahub.github.io/LoomNest/)

## 项目定位

- 本仓库是 Vue 3 + Vite 单页应用。
- LoomNest 只读取项目元数据和展示素材，不读取外部项目源码。
- 外部项目的构建、部署、域名和运行状态由外部项目自行负责。
- 正式作品配置的唯一来源是 [`public/works.json`](public/works.json)。
- 正式展示素材统一存放在 [`public/assets/`](public/assets/)。

如果任务只是“把某个项目放到 LoomNest 中展示”，通常只需要新增素材并修改 `public/works.json`，不应修改 Vue 组件、样式、依赖或部署配置。

## 快速开始

环境要求：Node.js 20 或兼容版本、npm。

安装依赖并启动开发服务器：

```bash
npm install
npm run dev
```

运行自动测试：

```bash
npm test
```

构建并预览生产版本：

```bash
npm run build
npm run preview
```

`npm run dev` 和 `npm run preview` 会持续运行本地服务器。根据终端输出访问对应地址，通常为 `http://localhost:5173/` 或 `http://localhost:4173/`。

## 正式配置与目录

```text
LoomNest/
├── public/
│   ├── works.json       # 正式作品列表；页面运行时读取此文件
│   └── assets/          # 正式宣传图和二维码
├── src/
│   ├── App.vue          # 页面渲染与内置容错示例，不是日常内容配置入口
│   └── lib/works.js     # 配置标准化、分类和外链安全规则
├── prototype/           # 历史交互原型，仅供视觉参考
├── dist/                # 构建产物，不要手工编辑或提交内容变更
└── README.md            # 当前接入手册
```

需要特别区分：

- 修改正式站点内容：编辑 `public/works.json` 和 `public/assets/`。
- `prototype/works.json` 只影响历史原型，不影响正式 Vue 站点。
- `src/App.vue` 中的 `fallbackWorks` 只在正式 JSON 加载失败时用于容错，不应与每次作品接入同步修改。
- `dist/` 和 `node_modules/` 是生成或依赖目录，不得作为接入配置手工编辑。

## 将一个外部项目接入 LoomNest

以下步骤适用于人类维护者和 AI。除非任务明确要求改变展示功能，否则应按顺序执行，不要跳过验证。

### 第 1 步：收集接入信息

开始修改前，确认以下信息：

- 项目的中文标题和英文标题。
- 项目类型：网站、小程序、移动应用或未来作品。
- 年份和一句话简介。
- 在项目中的职责列表。
- 一张已经压缩的宣传图。
- `live` 项目的正式访问入口；不要使用示例域名或商店首页代替最终链接。
- 小程序的可扫描二维码和准确的二维码替代文本。
- 项目在列表中的目标位置。未特别说明时，在数组末尾新增，且不调整现有项目顺序。

如果 `live` 项目缺少正式入口、标题、年份或宣传图，应先向需求方索取，不要捏造。只有需求方明确表示项目尚未发布时，才能按 `future` / `soon` 接入。

### 第 2 步：选择项目类型

每个项目只能选择一个 `type`：

| 展示类型 | `type` | `status` | `access` 配置 | 页面行为 |
| --- | --- | --- | --- | --- |
| 网站 | `web` | `live` | `url` | 显示“访问网站”链接 |
| 小程序 | `mini-program` | `live` | `qrImage`、可选 `qrAlt` | 显示二维码和扫码说明 |
| 移动应用 | `mobile` | `live` | `appStore` 和/或 `googlePlay` | 显示实际存在的商店入口 |
| 未来作品 | `future` | `soon` | 空对象 `{}` | 显示 `Coming Soon`，不显示链接 |

不要写入其他 `type` 值。未知类型无法进入现有分类筛选，且可能被错误地当作网站入口渲染。如果确实需要新类型，应把它作为单独的功能开发任务处理，而不是只修改 JSON。

当 `status` 为 `soon`，或 `type` 为 `future` 时，页面都会按未来作品处理，并忽略 `access` 中的链接。

### 第 3 步：准备素材

1. 将宣传图转换为 `.jpg`、`.jpeg` 或 `.webp`，并在保证清晰度的前提下压缩体积。自动测试不接受宣传图使用其他扩展名。
2. 使用唯一、可读的文件名，推荐使用小写英文、数字和连字符，例如 `project-name.webp`。
3. 将宣传图复制到 `public/assets/`。
4. 如果是小程序，将二维码复制到 `public/assets/`；二维码可以使用 `.png`，例如 `project-name-qr.png`。
5. 在 JSON 中使用相对路径 `./assets/<文件名>`。不要使用 `/assets/<文件名>`，否则 GitHub Pages 子路径部署时可能找不到资源。

示例：

```text
public/assets/project-name.webp
public/assets/project-name-qr.png
```

对应配置：

```json
{
  "image": "./assets/project-name.webp",
  "access": {
    "qrImage": "./assets/project-name-qr.png"
  }
}
```

### 第 4 步：编辑 public/works.json

`public/works.json` 必须是一个非空 JSON 数组，每个数组元素代表一个项目。数组中的对象顺序就是页面展示顺序。

编辑时遵守以下规则：

1. 先读取整个现有数组，确认目标 `id` 没有被使用。
2. 从下方对应类型示例复制一个完整对象。
3. 将对象插入需求方指定的位置；未指定时追加到数组末尾。
4. 替换所有示例内容和占位链接。
5. 保留其他项目及其顺序，不删除、不重写无关记录。
6. 保持 JSON 合法：不能写注释，最后一个字段或数组元素后不能有多余逗号。

### 第 5 步：验证配置

先检查 JSON 是否可解析、顶层是否为非空数组，以及 `id` 是否唯一：

```bash
node -e "const fs=require('node:fs');const works=JSON.parse(fs.readFileSync('public/works.json','utf8'));if(!Array.isArray(works)||works.length===0)throw new Error('works.json 必须是非空数组');const ids=works.map(work=>work.id);if(new Set(ids).size!==ids.length)throw new Error('作品 id 重复');console.log('works.json: ok');"
```

然后逐项确认：

- `image` 指向 `public/assets/` 中真实存在的宣传图。
- 小程序的 `qrImage` 指向真实存在且可以扫描的二维码。
- 网站和应用商店链接是完整的绝对 URL，并以 `http://` 或 `https://` 开头。
- `access` 只包含当前类型需要的字段。
- `live` 项目没有使用 `example.com`、应用商店首页或其他占位入口。

### 第 6 步：本地检查

运行自动测试和生产构建：

```bash
npm test
npm run build
```

自动测试会检查正式 JSON、宣传图扩展名和宣传图文件是否存在。两条命令都必须成功。

之后启动本地站点：

```bash
npm run dev
```

在浏览器中确认：

1. 项目出现在预期位置和正确分类中。
2. 标题、年份、简介、职责和宣传图正确。
3. 展开项目后，网站链接、二维码或应用商店入口符合项目类型。
4. 外链可以打开正式项目；二维码可以被真实设备扫描。
5. 页面没有出现“暂时使用示例数据”的提示，浏览器控制台没有配置加载错误。

也可以在 `npm run build` 后使用 `npm run preview` 检查生产构建。

### 第 7 步：发布

只有在获得提交或推送授权后，才执行 Git 操作。一次常规接入通常只提交以下文件：

```bash
git add public/works.json public/assets/<宣传图文件名>
git add public/assets/<二维码文件名>  # 仅小程序需要
git commit -m "content: add <项目名称>"
```

推送到 `main` 后，[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 会依次执行 `npm ci`、`npm test`、`npm run build`，然后发布 `dist/` 到 GitHub Pages。不要手工提交 `dist/`。

## 配置字段说明

| 字段 | 类型 | 接入要求 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 必填 | 全局唯一且长期稳定；推荐只使用小写英文、数字和连字符。不要因标题变化随意修改。 |
| `index` | number | 可选 | 仅覆盖页面显示编号，不决定排序；通常省略并使用数组位置自动编号。 |
| `title` | string | 必填 | 页面显示的主标题。 |
| `titleEn` | string | 应填写 | 英文或辅助标题；没有英文名时可与 `title` 相同。 |
| `type` | string | 必填 | 只允许 `web`、`mini-program`、`mobile`、`future`。 |
| `year` | number \| string | 必填 | 已发布项目通常使用四位年份；未确定时可在未来作品中使用 `"—"`。 |
| `summary` | string | 必填 | 简短说明项目解决的问题或提供的体验。 |
| `image` | string | 必填 | 宣传图相对路径；必须指向 `.jpg`、`.jpeg` 或 `.webp` 文件。 |
| `role` | string[] | 应填写 | 职责数组，例如 `["产品设计", "前端开发"]`；空数组会显示“独立创作”。 |
| `access` | object | 必填 | 根据 `type` 使用对应字段；未来作品使用 `{}`。 |
| `status` | string | 必填 | 只使用 `live` 或 `soon`。除明确的未来作品外使用 `live`。 |

页面会为部分缺失字段提供默认值，但这是运行时容错，不是正式内容规范。接入时应按上表显式填写字段。

外链安全规则：`access.url`、`access.appStore` 和 `access.googlePlay` 只有在能够解析为 `http://` 或 `https://` URL 时才会显示为链接。相对 URL、`javascript:`、空字符串和无法解析的值都不会成为可点击入口。

## 四种项目类型示例

下面展示的是单个数组元素。接入时应把所选对象插入现有 `public/works.json` 数组，而不是用单个对象替换整个文件。

示例中的名称、年份、职责、素材路径和链接全部需要替换。`example.com` 及示例商店链接不得作为正式接入结果。

### 网站

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
  "access": {
    "url": "https://example.com/project"
  },
  "status": "live"
}
```

### 小程序

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

`qrAlt` 应描述二维码所属项目和用途，不能写成无意义的“图片”或“二维码”。

### 移动应用

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

只保留实际存在的平台。例如只有 App Store 版本时，删除 `googlePlay`，不要保留空字符串或商店首页。

### 未来作品

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

未来作品仍然需要宣传图，但不需要 URL。项目正式发布后，应把 `type` 改为实际类型、把 `status` 改为 `live`，并补充对应的 `access` 字段。

## AI 执行规范

AI 接到项目接入任务时，必须遵守以下规则：

1. 修改前读取本 README、完整的 `public/works.json`、`public/assets/` 文件列表和 `git status --short`。
2. 明确外部项目仍独立部署。不得复制其源码、依赖、构建产物或整个仓库到 LoomNest。
3. 从实际访问方式判断 `type`。不得创建未受支持的类型，也不得为迁就缺失信息而随意选择类型。
4. 对 `live` 项目核验正式 URL。标题、年份、职责、URL 或素材缺失时不得捏造；应向用户索取，或在用户明确授权后改为未来作品。
5. 生成唯一 `id` 和素材文件名前，先检查现有记录与文件，避免覆盖。
6. 只修改本次接入需要的 `public/works.json` 记录和 `public/assets/` 素材。不要修改 `prototype/works.json`、`src/App.vue` 的回退数据、`dist/`、`node_modules/` 或无关项目。
7. 保留现有数组、记录和顺序，除非用户明确指定插入位置或要求调整顺序。避免无关格式化和重构。
8. 修改后运行 JSON/ID 检查、`npm test` 和 `npm run build`，并进行页面检查。不得把回退到示例数据视为成功。
9. 未获得明确授权时，不提交、不推送、不触发部署。
10. 完成时报告新增或修改的记录、素材路径、入口类型、测试结果、构建结果，以及仍需人工确认的事项。

## 完成标准

只有同时满足以下条件，才能声明项目已接入：

- `public/works.json` 是可解析的非空数组，新增对象结构完整。
- 新 `id` 与现有项目不重复。
- 项目位于预期数组位置，并能出现在正确分类中。
- 宣传图存在，路径和扩展名正确；小程序二维码存在且可以扫描。
- `access` 与 `type` 匹配，`live` 项目的入口是实际可用的正式地址。
- 页面没有回退到内置示例数据。
- `npm test` 成功并输出 `vue app helpers: ok`。
- `npm run build` 成功。
- 本地页面中的标题、图片、详情和访问入口均已检查。
- 最终变更没有包含无关文件或外部项目源码。

## 常见问题

| 现象 | 检查与处理 |
| --- | --- |
| 页面提示“暂时使用示例数据” | 检查 `public/works.json` 是否为合法、非空的 JSON 数组；检查开发服务器是否能请求到正确的 `works.json` 路径。修复前不能认定接入成功。 |
| 宣传图不显示，或 `npm test` 报素材错误 | 检查文件是否真实存在于 `public/assets/`，文件名大小写是否一致，扩展名是否为 `.jpg`、`.jpeg` 或 `.webp`，以及 JSON 是否使用 `./assets/...` 相对路径。 |
| 网站链接不显示 | 确认 `type` 为 `web`、字段名为 `access.url`，且值是完整的 HTTP(S) URL。 |
| 小程序只显示“二维码待补充” | 确认 `type` 为 `mini-program`，并检查 `access.qrImage` 的文件路径。 |
| 应用商店入口不显示 | 确认 `type` 为 `mobile`，字段名是 `access.appStore` 或 `access.googlePlay`，并检查 URL 协议。 |
| 项目显示为 `Coming Soon` | 检查 `type` 是否误写为 `future`，或 `status` 是否仍为 `soon`。 |
| 项目出现在“全部”中，但不在预期分类中 | 检查 `type` 是否严格使用四个允许值之一，不要增加空格、大小写变化或自定义值。 |
| 展示顺序不正确 | 直接调整 `public/works.json` 中对象的数组顺序；不要通过修改组件代码排序。 |
| GitHub Pages 上图片或二维码丢失 | 确认配置使用 `./assets/...`，不要使用站点根路径 `/assets/...`。 |
| 本地正常但部署失败 | 查看 GitHub Actions 日志，依次定位 `npm ci`、`npm test`、`npm run build` 或 Pages 发布阶段。 |

## 原型说明

`prototype/` 保留了已批准的静态交互原型，仅用于视觉和交互参考。它拥有独立的 `prototype/works.json`，不会驱动正式站点。

如需单独预览原型：

```bash
python3 -m http.server 4173 --directory prototype
```

然后访问 `http://127.0.0.1:4173/`。不要为了接入正式项目而修改原型配置。
