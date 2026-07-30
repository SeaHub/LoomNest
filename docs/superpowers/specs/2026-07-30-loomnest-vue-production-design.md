# LoomNest Vue 生产站设计

## 目标

将 `prototype/` 中已经验证过的信息架构与视觉语言升级为可持续运营的 Vue + Vite 单页站点，并通过 GitHub Pages 自动发布。内容由 `public/works.json` 驱动，新增作品只需要更新 JSON 与素材，不需要修改 Vue 组件。

## 结构

- `src/App.vue` 管理主题、筛选、展开项、加载状态和交互事件。
- `src/lib/works.js` 提供纯数据归一化、分类、主题和链接安全校验函数。
- `src/styles.css` 保留 Living Index 网格，同时补充 Apple Liquid Glass 的半透明层、背景模糊、内描边、光泽和滚动/列表动画。
- `public/works.json` 和 `public/assets/` 是部署后可直接访问的运营内容源。
- `.github/workflows/deploy.yml` 使用 Vite 构建并把 `dist/` 发布到 GitHub Pages。

## 交互与动效

主题按 `system → light → dark` 循环，并持久化到 localStorage。筛选按钮更新数量、选中态和列表；作品行只允许一项展开，详情用 Vue transition 展开/收起，列表重排使用 TransitionGroup。外链只接受 `http`/`https`，未来作品不渲染无效链接。所有交互拥有键盘焦点态，Escape 收起详情，系统减少动态效果时关闭位移和过渡。

## 验证

验证纯函数、生产构建、GitHub Pages base 路径、桌面/移动端渲染、主题切换、筛选、展开、键盘操作、外链抑制和 reduced motion。
