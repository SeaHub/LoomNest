export function normalizeWorks(rawWorks) {
  if (!Array.isArray(rawWorks)) return [];

  return rawWorks
    .filter((work) => work && typeof work === 'object')
    .map((work, index) => ({
      id: String(work.id ?? crypto.randomUUID()),
      index: work.index ?? index + 1,
      title: String(work.title ?? 'Untitled work'),
      titleEn: String(work.titleEn ?? ''),
      type: String(work.type ?? 'future'),
      year: work.year ?? '—',
      summary: String(work.summary ?? ''),
      image: String(work.image ?? ''),
      role: Array.isArray(work.role) ? work.role.map(String) : [],
      access: work.access && typeof work.access === 'object' ? work.access : {},
      status: work.status === 'soon' ? 'soon' : 'live',
    }));
}

export function filterWorks(works, filter) {
  if (filter === 'all') return works;
  return works.filter((work) => work.type === filter);
}

export function getAccessKind(work) {
  if (work.status === 'soon' || work.type === 'future') return 'future';
  if (work.type === 'mini-program') return 'mini-program';
  if (work.type === 'mobile') return 'mobile';
  return 'web';
}

export function resolveTheme(mode, systemDark) {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeHref(value) {
  if (!value) return '';
  try {
    const base = typeof window === 'undefined' ? 'http://localhost/' : window.location.href;
    const url = new URL(value, base);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function externalLink(label, href, title) {
  const safe = safeHref(href);
  if (!safe) return '';
  return `<a class="access-link" href="${escapeHtml(safe)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(`${label}：${title}`)}">${escapeHtml(label)}<span aria-hidden="true">↗</span></a>`;
}

export function renderAccessActions(work) {
  const kind = getAccessKind(work);
  const access = work.access ?? {};

  if (kind === 'future') {
    return '<span class="access-status access-status--soon">Coming Soon</span>';
  }

  if (kind === 'mini-program') {
    const qr = access.qrImage ? `<img class="qr-image" src="${escapeHtml(access.qrImage)}" alt="${escapeHtml(access.qrAlt || `${work.title}二维码`)}" loading="lazy">` : '';
    return `${qr}<span class="access-caption">${qr ? '二维码 · 微信扫码体验' : '二维码待补充'}</span>`;
  }

  if (kind === 'mobile') {
    const links = [
      externalLink('App Store', access.appStore, work.title),
      externalLink('Google Play', access.googlePlay, work.title),
    ].filter(Boolean);
    return links.length ? links.join('') : '<span class="access-status">下载链接待补充</span>';
  }

  return externalLink('访问网站', access.url, work.title) || '<span class="access-status">访问链接待补充</span>';
}

export function renderWorkRow(work, isOpen = false) {
  const detailId = `detail-${escapeHtml(work.id)}`;
  const image = work.image
    ? `<img class="work-thumb" src="${escapeHtml(work.image)}" alt="${escapeHtml(work.title)} 宣传图" loading="lazy">`
    : '<div class="work-thumb work-thumb--empty" aria-hidden="true"></div>';
  const typeLabel = {
    web: 'WEBSITE',
    'mini-program': 'MINI PROGRAM',
    mobile: 'MOBILE APP',
    future: 'FUTURE',
  }[work.type] || 'WORK';
  const roles = work.role.length ? work.role.map(escapeHtml).join(' · ') : '独立创作';
  const detail = isOpen ? `
    <div class="work-detail" id="${detailId}" role="region" aria-label="${escapeHtml(work.title)} 详情">
      <div class="detail-copy">
        <span class="detail-label">OVERVIEW</span>
        <p>${escapeHtml(work.summary || '一件持续生长中的数字作品。')}</p>
        <span class="detail-label">ROLE</span>
        <p>${roles}</p>
      </div>
      <div class="detail-access">
        <span class="detail-label">ACCESS</span>
        <div class="access-actions">${renderAccessActions(work)}</div>
      </div>
    </div>` : '';

  return `<article class="work-entry${isOpen ? ' is-open' : ''}">
    <button class="work-row" type="button" data-work-id="${escapeHtml(work.id)}" aria-expanded="${isOpen}" aria-controls="${detailId}">
      <span class="work-number" aria-hidden="true">${escapeHtml(String(work.index ?? '—').padStart(2, '0'))}</span>
      ${image}
      <span class="work-meta">
        <span class="work-type">${typeLabel}</span>
        <strong>${escapeHtml(work.title)}</strong>
        <span class="work-title-en">${escapeHtml(work.titleEn)}</span>
      </span>
      <span class="work-year">${escapeHtml(work.year)}</span>
      <span class="work-access-preview">${getAccessKind(work) === 'future' ? 'Coming Soon' : 'Open'}</span>
      <span class="row-toggle" aria-hidden="true">${isOpen ? '−' : '+'}</span>
    </button>
    ${detail}
  </article>`;
}

const FILTERS = [
  ['all', '全部'],
  ['web', '网站'],
  ['mini-program', '小程序'],
  ['mobile', '应用'],
  ['future', '未来作品'],
];

export function renderFilterButtons(works, activeFilter = 'all') {
  return FILTERS.map(([value, label]) => {
    const count = value === 'all' ? works.length : works.filter((work) => work.type === value).length;
    return `<button class="filter-button${activeFilter === value ? ' is-active' : ''}" type="button" data-filter="${value}" aria-pressed="${activeFilter === value}">${label}<span>${count}</span></button>`;
  }).join('');
}

function renderList(works, activeFilter, openWorkId) {
  const visible = filterWorks(works, activeFilter);
  if (!visible.length) {
    return '<div class="empty-state">这个分类还没有作品。</div>';
  }
  return visible.map((work) => renderWorkRow(work, work.id === openWorkId)).join('');
}

function systemIsDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function getStoredTheme() {
  try {
    return localStorage.getItem('loomnest-theme') || 'system';
  } catch {
    return 'system';
  }
}

function setStoredTheme(mode) {
  try {
    localStorage.setItem('loomnest-theme', mode);
  } catch {
    // Private browsing can disable storage; the current page still works.
  }
}

function applyTheme(mode) {
  const resolved = resolveTheme(mode, systemIsDark());
  document.documentElement.dataset.theme = resolved;
  const button = document.querySelector('[data-theme-toggle]');
  if (button) {
    const current = mode === 'system' ? `系统 · ${resolved === 'dark' ? '深色' : '浅色'}` : mode === 'light' ? '浅色' : '深色';
    const next = mode === 'system' ? '浅色' : mode === 'light' ? '深色' : '跟随系统';
    button.textContent = `${current} · ${next}`;
    button.setAttribute('aria-label', `当前主题：${mode}，点击切换到${next}`);
  }
}

export function mountPortfolio(root, works) {
  const state = { activeFilter: 'all', openWorkId: null, themeMode: getStoredTheme() };

  root.innerHTML = `
    <a class="skip-link" href="#works">跳到作品列表</a>
    <header class="site-header">
      <a class="brand" href="./" aria-label="LoomNest 首页">LoomNest <span>— Selected Works 2022—∞</span></a>
      <nav class="site-nav" aria-label="主导航">
        <a class="is-current" href="#works">Works</a>
        <a href="#about">About</a>
        <a href="#notes">Notes</a>
      </nav>
      <button class="theme-toggle glass-control" type="button" data-theme-toggle>系统 · 浅色</button>
    </header>
    <main class="page-grid">
      <aside class="intro-column" id="about">
        <p class="eyebrow">LOOMNEST / 作品档案</p>
        <h1>把复杂的世界，做成可使用的东西。</h1>
        <p class="intro-copy">LoomNest 是一个持续生长的数字创作档案，收录网站、小程序、移动应用，以及还在路上的下一件作品。</p>
        <p class="intro-copy intro-copy--en">A living index of websites, mini programs, mobile apps, and the things still taking shape.</p>
        <dl class="meta-list">
          <div><dt>BASE</dt><dd>Hangzhou, China</dd></div>
          <div><dt>FOCUS</dt><dd>Structure · Interaction · Detail</dd></div>
          <div><dt>UPDATED</dt><dd>2026—07—30</dd></div>
        </dl>
      </aside>
      <section class="works-column" id="works" aria-labelledby="works-heading">
        <div class="section-heading">
          <div><p class="eyebrow">ARCHIVE / 01—∞</p><h2 id="works-heading">Selected Works</h2></div>
          <p class="section-note">点击作品行，展开详情</p>
        </div>
        <div class="filter-bar glass-surface" role="toolbar" aria-label="作品分类筛选"></div>
        <div class="column-labels" aria-hidden="true"><span>NO.</span><span>WORK</span><span>TYPE / YEAR</span><span>ACCESS</span></div>
        <div class="works-list" aria-live="polite"></div>
      </section>
    </main>
    <footer class="site-footer" id="notes"><span>© 2026 LoomNest</span><span>设计 · 思考 · 连接</span></footer>
  `;

  const filterBar = root.querySelector('.filter-bar');
  const list = root.querySelector('.works-list');
  const render = () => {
    filterBar.innerHTML = renderFilterButtons(works, state.activeFilter);
    list.innerHTML = renderList(works, state.activeFilter, state.openWorkId);
  };

  root.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      state.activeFilter = filter.dataset.filter;
      state.openWorkId = null;
      render();
      filterBar.querySelector(`[data-filter="${state.activeFilter}"]`)?.focus();
      return;
    }

    const row = event.target.closest('[data-work-id]');
    if (row) {
      state.openWorkId = state.openWorkId === row.dataset.workId ? null : row.dataset.workId;
      render();
      list.querySelector(`[data-work-id="${state.openWorkId || row.dataset.workId}"]`)?.focus();
    }

    const themeButton = event.target.closest('[data-theme-toggle]');
    if (themeButton) {
      state.themeMode = state.themeMode === 'system' ? 'light' : state.themeMode === 'light' ? 'dark' : 'system';
      setStoredTheme(state.themeMode);
      applyTheme(state.themeMode);
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.openWorkId) {
      state.openWorkId = null;
      render();
    }
  });

  applyTheme(state.themeMode);
  render();

  if (typeof window !== 'undefined') {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', () => {
      if (state.themeMode === 'system') applyTheme(state.themeMode);
    });
  }
}

export async function loadWorks(url = './works.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`作品配置加载失败：${response.status}`);
  return normalizeWorks(await response.json());
}
