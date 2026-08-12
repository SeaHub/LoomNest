<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  filterWorks,
  getAccessKind,
  getNextTheme,
  getWorksUrl,
  isSafeExternalUrl,
  normalizeThemePreference,
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

const works = ref([]);
const isLoading = ref(true);
const dataError = ref('');
const activeFilter = ref('all');
const openWorkId = ref(null);
const themeMode = ref(null);
const systemDark = ref(false);
const reducedMotion = ref(false);

let themeMedia;
let motionMedia;
let glassPointerUpdater;

const visibleWorks = computed(() => filterWorks(works.value, activeFilter.value));
const themeResolved = computed(() => resolveTheme(themeMode.value, systemDark.value));
const themeNames = { light: '浅色', dark: '深色' };
const nextTheme = computed(() => getNextTheme(themeResolved.value));
const themeButtonLabel = computed(() => `${themeNames[themeResolved.value]} · ${themeNames[nextTheme.value]}`);
const themeButtonAriaLabel = computed(() => `当前主题：${themeNames[themeResolved.value]}，点击切换到${themeNames[nextTheme.value]}`);

function readTheme() {
  try {
    return normalizeThemePreference(window.localStorage.getItem('loomnest-theme'));
  } catch {
    return null;
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
  themeMode.value = nextTheme.value;
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
    works.value = [];
    dataError.value = '作品数据加载失败，请稍后重试。';
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

watch(themeResolved, applyTheme);

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
    <a class="brand" href="./" aria-label="LoomNest 首页">LoomNest</a>
    <nav class="site-nav" aria-label="主导航">
      <div class="header-filter-scroll">
        <div class="filter-bar" role="toolbar" aria-label="作品分类筛选">
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
      </div>
    </nav>
    <button class="theme-toggle glass-control" type="button" data-theme-toggle :aria-label="themeButtonAriaLabel" @click="cycleTheme">
      <span class="theme-orb" aria-hidden="true"></span>
      {{ themeButtonLabel }}
    </button>
  </header>

  <p v-if="dataError" class="data-notice" role="status">{{ dataError }}</p>

  <main class="page-grid" @keydown="handleKeydown">
    <section class="works-column" id="works" aria-labelledby="works-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">ARCHIVE / 01—∞</p>
          <h2 id="works-heading">Works</h2>
        </div>
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
