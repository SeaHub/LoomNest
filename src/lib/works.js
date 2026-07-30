const allowedThemes = new Set(['system', 'light', 'dark']);

export function normalizeWorks(rawWorks) {
  if (!Array.isArray(rawWorks)) return [];

  return rawWorks
    .filter((work) => work && typeof work === 'object')
    .map((work, index) => ({
      id: String(work.id ?? `work-${index + 1}`),
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
  const safeMode = allowedThemes.has(mode) ? mode : 'system';
  return safeMode === 'system' ? (systemDark ? 'dark' : 'light') : safeMode;
}

export function isSafeExternalUrl(value) {
  if (!value || typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getWorksUrl(baseUrl, cacheKey) {
  const normalizedBase = String(baseUrl || '/').endsWith('/') ? String(baseUrl || '/') : `${baseUrl}/`;
  return `${normalizedBase}works.json${cacheKey ? `?v=${encodeURIComponent(cacheKey)}` : ''}`;
}
