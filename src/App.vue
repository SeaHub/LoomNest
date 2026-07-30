<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  filterWorks,
  getAccessKind,
  getWorksUrl,
  isSafeExternalUrl,
  normalizeWorks,
  resolveTheme,
} from './lib/works.js';
import {
  animateMeasuredHeight,
  cancelMeasuredHeight,
  createFrameThrottler,
  shouldScrollDetail,
} from './lib/motion.js';

const filters = [
  { value: 'all', label: '全部' },
  { value: 'web', label: '网站' },
  { value: 'mini-program', label: '小程序' },
  { value: 'mobile', label: '应用' },
  { value: 'future', label: '未来作品' },
];

const typeLabels = {
  web: 'WEBSITE',
  'mini-program': 'MINI PROGRAM',
  mobile: 'MOBILE APP',
  future: 'FUTURE',
};

const fallbackWorks = [
  {
    id: 'fallback-web',
    title: 'Atlas 文化地图',
    titleEn: 'Atlas Culture Map',
    type: 'web',
    year: 2026,
    summary: '把城市文化、展览与公共空间整理成一张可探索的地图。',
    image: './assets/atlas-web.jpg',
    role: ['信息架构', '交互设计'],
    access: { url: 'https://example.com/atlas-culture' },
    status: 'live',
  },
  {
    id: 'fallback-mini',
    title: '织境小屋',
    titleEn: 'Weave House',
    type: 'mini-program',
    year: 2025,
    summary: '一款收集灵感、整理日常小物与城市去处的小程序。',
    image: './assets/weave-mini.jpg',
    role: ['产品设计'],
    access: { qrImage: './assets/weave-mini-qr.png', qrAlt: '织境小屋小程序二维码' },
    status: 'live',
  },
  {
    id: 'fallback-mobile',
    title: 'Flow 日记',
    titleEn: 'Flow Diary',
    type: 'mobile',
    year: 2026,
    summary: '专注与记录的日常伴侣。',
    image: './assets/flow-mobile.jpg',
    role: ['产品设计', '开发'],
    access: { appStore: 'https://apps.apple.com/', googlePlay: 'https://play.google.com/' },
    status: 'live',
  },
];

const works = ref([]);
const isLoading = ref(true);
const dataError = ref('');
const activeFilter = ref('all');
const openWorkId = ref(null);
const themeMode = ref('system');
const systemDark = ref(false);
const reducedMotion = ref(false);

let themeMedia;
let motionMedia;
let glassPointerUpdater;

const visibleWorks = computed(() => filterWorks(works.value, activeFilter.value));
const themeResolved = computed(() => resolveTheme(themeMode.value, systemDark.value));
const themeNames = { system: '系统', light: '浅色', dark: '深色' };
const nextThemeNames = { system: '浅色', light: '深色', dark: '跟随系统' };
const themeButtonLabel = computed(() => themeMode.value === 'system'
  ? `系统 · ${themeResolved.value === 'dark' ? '深色' : '浅色'}`
  : themeNames[themeMode.value]);
const themeButtonAriaLabel = computed(() => `当前主题：${themeNames[themeMode.value]}，点击切换到${nextThemeNames[themeMode.value]}`);

function readTheme() {
  try {
    const saved = window.localStorage.getItem('loomnest-theme');
    return ['system', 'light', 'dark'].includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

function saveTheme(mode) {
  try {
    window.localStorage.setItem('loomnest-theme', mode);
  } catch {
    // Storage can be disabled by private browsing; the current session still works.
  }
}

function applyTheme() {
  const resolved = themeResolved.value;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0c1017' : '#ececea');
}

function cycleTheme() {
  const modes = ['system', 'light', 'dark'];
  const currentIndex = modes.indexOf(themeMode.value);
  themeMode.value = modes[(currentIndex + 1) % modes.length];
  saveTheme(themeMode.value);
}

function countFor(filter) {
  return filter === 'all' ? works.value.length : works.value.filter((work) => work.type === filter).length;
}

function isOpen(work) {
  return openWorkId.value === work.id;
}

function handleFilter(filter) {
  if (filter === activeFilter.value) return;

  activeFilter.value = filter;
  openWorkId.value = null;

  nextTick(() => {
    document.querySelector(`[data-filter="${filter}"]`)?.focus();
  });
}

function handleRowToggle(work) {
  openWorkId.value = isOpen(work) ? null : work.id;
}

function handleKeydown(event) {
  if (event.key === 'Escape' && openWorkId.value) {
    openWorkId.value = null;
    event.preventDefault();
  }
}

function updateGlassPointer(event) {
  glassPointerUpdater?.push({
    element: event.currentTarget,
    clientX: event.clientX,
    clientY: event.clientY,
  });
}

function clearGlassPointer(event) {
  glassPointerUpdater?.cancel();
  event.currentTarget.style.removeProperty('--pointer-x');
  event.currentTarget.style.removeProperty('--pointer-y');
}

function handleDetailBeforeEnter(element) {
  element.style.height = '0px';
  element.dataset.motion = 'entering';
}

function handleDetailEnter(element, done) {
  animateMeasuredHeight(element, {
    opening: true,
    reducedMotion: reducedMotion.value,
    done: () => {
      element.dataset.motion = 'open';
      done();
    },
  });
}

function handleDetailLeave(element, done) {
  element.dataset.motion = 'leaving';
  animateMeasuredHeight(element, {
    opening: false,
    reducedMotion: reducedMotion.value,
    done,
  });
}

function handleDetailCancelled(element) {
  cancelMeasuredHeight(element);
  element.removeAttribute('data-motion');
}

function handleDetailAfterEnter(element) {
  if (reducedMotion.value) return;

  const detail = element.querySelector('.work-detail');
  if (!detail) return;

  const rect = detail.getBoundingClientRect();
  if (shouldScrollDetail(rect, { height: window.innerHeight })) {
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function safeUrl(value) {
  return isSafeExternalUrl(value) ? value : '';
}

function typeLabel(work) {
  return typeLabels[work.type] || 'WORK';
}

function roleLabel(work) {
  return work.role.length ? work.role.join(' · ') : '独立创作';
}

async function loadWorks() {
  isLoading.value = true;
  dataError.value = '';

  try {
    const response = await fetch(getWorksUrl(import.meta.env.BASE_URL, Date.now()), { cache: 'no-store' });
    if (!response.ok) throw new Error(`作品配置加载失败：${response.status}`);

    const loaded = normalizeWorks(await response.json());
    if (!loaded.length) throw new Error('作品配置为空');
    works.value = loaded;
  } catch (error) {
    works.value = normalizeWorks(fallbackWorks);
    dataError.value = '暂时使用示例数据：请检查 works.json 的格式或路径。';
    console.warn(error);
  } finally {
    isLoading.value = false;
  }
}

function handleSystemThemeChange(event) {
  systemDark.value = event.matches;
}

function handleReducedMotionChange(event) {
  reducedMotion.value = event.matches;
}

watch([themeMode, systemDark], applyTheme);

onMounted(() => {
  glassPointerUpdater = createFrameThrottler(({ element, clientX, clientY }) => {
    if (!element?.isConnected) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--pointer-x', `${clientX - rect.left}px`);
    element.style.setProperty('--pointer-y', `${clientY - rect.top}px`);
  });
  themeMode.value = readTheme();
  themeMedia = window.matchMedia?.('(prefers-color-scheme: dark)');
  motionMedia = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  systemDark.value = Boolean(themeMedia?.matches);
  reducedMotion.value = Boolean(motionMedia?.matches);
  themeMedia?.addEventListener?.('change', handleSystemThemeChange);
  motionMedia?.addEventListener?.('change', handleReducedMotionChange);
  applyTheme();
  loadWorks();
});

onBeforeUnmount(() => {
  glassPointerUpdater?.cancel();
  themeMedia?.removeEventListener?.('change', handleSystemThemeChange);
  motionMedia?.removeEventListener?.('change', handleReducedMotionChange);
});
</script>

<template>
  <a class="skip-link" href="#works">跳到作品列表</a>

  <header class="site-header glass-surface" @pointermove="updateGlassPointer" @pointerleave="clearGlassPointer">
    <a class="brand" href="./" aria-label="LoomNest 首页">
      LoomNest <span>— Selected Works 2022—∞</span>
    </a>
    <nav class="site-nav" aria-label="主导航">
      <a class="is-current" href="#works">Works</a>
      <a href="#about">About</a>
      <a href="#notes">Notes</a>
    </nav>
    <button class="theme-toggle glass-control" type="button" data-theme-toggle :aria-label="themeButtonAriaLabel" @click="cycleTheme">
      <span class="theme-orb" aria-hidden="true"></span>
      {{ themeButtonLabel }} · {{ nextThemeNames[themeMode] }}
    </button>
  </header>

  <p v-if="dataError" class="data-notice" role="status">{{ dataError }}</p>

  <main class="page-grid" @keydown="handleKeydown">
    <aside class="intro-column" id="about">
      <p class="eyebrow reveal reveal--one">LOOMNEST / 作品档案</p>
      <h1 class="reveal reveal--two">把复杂的世界，做成可使用的东西。</h1>
      <p class="intro-copy reveal reveal--three">LoomNest 是一个持续生长的数字创作档案，收录网站、小程序、移动应用，以及还在路上的下一件作品。</p>
      <p class="intro-copy intro-copy--en reveal reveal--four">A living index of websites, mini programs, mobile apps, and the things still taking shape.</p>
      <dl class="meta-list reveal reveal--five">
        <div><dt>BASE</dt><dd>Hangzhou, China</dd></div>
        <div><dt>FOCUS</dt><dd>Structure · Interaction · Detail</dd></div>
        <div><dt>UPDATED</dt><dd>2026—07—30</dd></div>
      </dl>
    </aside>

    <section class="works-column" id="works" aria-labelledby="works-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">ARCHIVE / 01—∞</p>
          <h2 id="works-heading">Selected Works</h2>
        </div>
        <p class="section-note">点击作品行，展开详情</p>
      </div>

      <div class="filter-bar glass-surface" role="toolbar" aria-label="作品分类筛选" @pointermove="updateGlassPointer" @pointerleave="clearGlassPointer">
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

      <div class="column-labels" aria-hidden="true">
        <span>NO.</span><span>WORK</span><span>TYPE / YEAR</span><span>ACCESS</span>
      </div>

      <div v-if="isLoading" class="works-list works-list--loading" aria-label="正在加载作品" aria-busy="true">
        <div v-for="item in 4" :key="item" class="loading-row">
          <span class="loading-block loading-block--number"></span>
          <span class="loading-block loading-block--image"></span>
          <span class="loading-copy"><span class="loading-block"></span><span class="loading-block loading-block--short"></span></span>
        </div>
      </div>

      <div v-else-if="visibleWorks.length" :key="activeFilter" class="works-list filter-swap" aria-live="polite">
        <article v-for="work in visibleWorks" :key="work.id" class="work-entry" :class="{ 'is-open': isOpen(work) }">
          <button
            class="work-row"
            type="button"
            :data-work-id="work.id"
            :aria-expanded="isOpen(work)"
            :aria-controls="`work-detail-${work.id}`"
            :aria-label="`${isOpen(work) ? '收起' : '展开'} ${work.title} 详情`"
            @click="handleRowToggle(work)"
          >
            <span class="work-number" aria-hidden="true">{{ String(work.index).padStart(2, '0') }}</span>
            <img v-if="work.image" class="work-thumb" :src="work.image" :alt="`${work.title} 宣传图`" />
            <span v-else class="work-thumb work-thumb--empty" aria-hidden="true"></span>
            <span class="work-meta">
              <span class="work-type">{{ typeLabel(work) }}</span>
              <strong>{{ work.title }}</strong>
              <span class="work-title-en">{{ work.titleEn }}</span>
            </span>
            <span class="work-year">{{ work.year }}</span>
            <span class="work-access-preview">{{ getAccessKind(work) === 'future' ? 'Coming Soon' : 'Open' }}</span>
            <span class="row-toggle" aria-hidden="true">{{ isOpen(work) ? '−' : '+' }}</span>
          </button>

          <Transition
            :css="false"
            @before-enter="handleDetailBeforeEnter"
            @enter="handleDetailEnter"
            @leave="handleDetailLeave"
            @enter-cancelled="handleDetailCancelled"
            @leave-cancelled="handleDetailCancelled"
            @after-enter="handleDetailAfterEnter"
          >
            <div
              v-if="isOpen(work)"
              class="work-detail-reveal"
            >
              <div
                :id="`work-detail-${work.id}`"
                class="work-detail glass-surface"
                role="region"
                :aria-label="`${work.title} 详情`"
                @pointermove="updateGlassPointer"
                @pointerleave="clearGlassPointer"
              >
                <div class="detail-copy">
                  <span class="detail-label">OVERVIEW</span>
                  <p>{{ work.summary || '一件持续生长中的数字作品。' }}</p>
                  <span class="detail-label">ROLE</span>
                  <p>{{ roleLabel(work) }}</p>
                </div>
                <div class="detail-access">
                  <span class="detail-label">ACCESS</span>
                  <div class="access-actions">
                    <template v-if="getAccessKind(work) === 'future'">
                      <span class="access-status access-status--soon">Coming Soon</span>
                    </template>
                    <template v-else-if="getAccessKind(work) === 'mini-program'">
                      <img v-if="work.access.qrImage" class="qr-image" :src="work.access.qrImage" :alt="work.access.qrAlt || `${work.title}二维码`" loading="lazy" />
                      <span class="access-caption">{{ work.access.qrImage ? '二维码 · 微信扫码体验' : '二维码待补充' }}</span>
                    </template>
                    <template v-else-if="getAccessKind(work) === 'mobile'">
                      <a v-if="safeUrl(work.access.appStore)" class="access-link" :href="safeUrl(work.access.appStore)" target="_blank" rel="noreferrer" :aria-label="`App Store：${work.title}`">App Store <span aria-hidden="true">↗</span></a>
                      <a v-if="safeUrl(work.access.googlePlay)" class="access-link" :href="safeUrl(work.access.googlePlay)" target="_blank" rel="noreferrer" :aria-label="`Google Play：${work.title}`">Google Play <span aria-hidden="true">↗</span></a>
                      <span v-if="!safeUrl(work.access.appStore) && !safeUrl(work.access.googlePlay)" class="access-status">下载链接待补充</span>
                    </template>
                    <template v-else>
                      <a v-if="safeUrl(work.access.url)" class="access-link" :href="safeUrl(work.access.url)" target="_blank" rel="noreferrer" :aria-label="`访问网站：${work.title}`">访问网站 <span aria-hidden="true">↗</span></a>
                      <span v-else class="access-status">访问链接待补充</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </article>
      </div>

      <div v-else class="empty-state" aria-live="polite">这个分类还没有作品。</div>
    </section>
  </main>

  <footer class="site-footer" id="notes"><span>© 2026 LoomNest</span><span>设计 · 思考 · 连接</span></footer>

</template>
