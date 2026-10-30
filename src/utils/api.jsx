import axios from 'axios';
import { buildKey, readCache, writeCache, invalidateCache, dedupe, isCacheBypassed } from './cache';

// Robust URL normalization: handles trailing slashes and ensures /api prefix
const resolveApiUrl = () => {
  const raw = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
};

const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const guestCapability = localStorage.getItem('fv_chat_guest_capability');
    if (guestCapability) {
      config.headers['X-Guest-Capability'] = guestCapability;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Pages that genuinely require an existing account session.
// Note: /checkout is NOT in this list because it features an embedded guest-first
// SMS OTP checkout flow (users verify right on the page without prior login).
const PROTECTED_PREFIXES = ['/orders', '/settings', '/admin'];

// Session expiry handling on 401.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // A failed logout is not a session expiry — the caller is already tearing
      // the session down and handles its own navigation.
      const isLogout = (error.config?.url || '').includes('/auth/logout');
      if (!isLogout) {
        localStorage.removeItem('token');

        // Only bounce to sign-in when the current page actually needs a session.
        // Previously ANY 401 — including a background /auth/me while browsing
        // the shop — hard-redirected to /login, throwing people off public
        // pages mid-visit and discarding their place.
        const currentPath = window.location.pathname;
        const needsSession = PROTECTED_PREFIXES.some(
          (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
        );
        if (needsSession) {
          // Preserve where they were so sign-in can return them.
          const next = encodeURIComponent(currentPath + window.location.search);
          window.location.href = `/login?next=${next}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Cache invalidation on writes ────────────────────────────────────────────
// Any successful mutation drops the cached reads for the resource it touched,
// so an admin who edits a product or category sees the change immediately instead of
// waiting out a TTL. Wiring this into the interceptor rather than into each
// handler means a new mutation can never forget to invalidate.
//
// Resources that are never cached (/cart, /orders, /auth, /payments) invalidate
// a prefix that holds nothing, so this is a safe no-op for them.
const CASCADE = {
  // A product edit or deletion can change how a combo that includes it renders.
  '/products': ['/combos'],
  // A category edit can change circle navigation and product taxonomy
  '/categories': ['/products', '/combos'],
};

api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || 'get').toLowerCase();
    if (method !== 'get' && method !== 'head') {
      const url = response.config?.url || '';
      const root = '/' + url.replace(/^\//, '').split(/[/?]/)[0];
      invalidateCache(root);
      (CASCADE[root] || []).forEach(invalidateCache);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Whitelist of public read-heavy prefixes eligible for client-side memory caching.
// Transactional, private, or write-heavy endpoints (e.g. /orders, /cart, /auth, /payments, /users, /admin)
// MUST NEVER be cached.
const CACHEABLE_PREFIXES = [
  '/categories',
  '/products',
  '/combos',
  '/coupons/active',
  '/banners/active',
  '/settings/public',
];

// Default TTLs, mirroring the Cache-Control max-age the API sends for each
// resource so the two layers agree on how stale data may get.
const DEFAULT_TTL = {
  '/categories': 10 * 1000, // 10s so admin circle visibility changes propagate rapidly
  '/combos': 2 * 60 * 1000,
  '/products': 60 * 1000,
  '/coupons': 60 * 1000,
  '/banners': 2 * 60 * 1000,
  '/settings': 5 * 60 * 1000,
};

/**
 * GET with a memory cache in front of it. Drop-in for `api.get` — resolves to
 * `{ data }` with the same body shape, so call sites keep using
 * `response.data.data` unchanged.
 *
 * Use ONLY for public read-heavy catalogue reads. Anything user-specific or
 * transactional is automatically rejected by the CACHEABLE_PREFIXES whitelist
 * and routed to a direct network call.
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {object} [opts.params] - query params, also part of the cache key
 * @param {number} [opts.ttl]    - override the default lifetime, in ms
 * @param {boolean}[opts.force]  - bypass the cache and refetch (e.g. pull to refresh)
 */
export const cachedGet = (url, { params, ttl, force = false } = {}) => {
  // Strict guard: verify the endpoint is explicitly marked as cacheable.
  // Never cache transactional or private routes.
  const isCacheable = CACHEABLE_PREFIXES.some((prefix) => url.startsWith(prefix));
  if (!isCacheable || isCacheBypassed()) {
    return api.get(url, { params }).then((res) => ({ data: res.data }));
  }

  const key = buildKey(url, params);
  const root = '/' + url.replace(/^\//, '').split(/[/?]/)[0];
  const lifetime = ttl ?? DEFAULT_TTL[root] ?? 60 * 1000;

  if (!force) {
    const cached = readCache(key);
    if (cached !== undefined) return Promise.resolve({ data: cached });
  }

  return dedupe(key, () =>
    api.get(url, { params }).then((res) => {
      writeCache(key, res.data, lifetime);
      return { data: res.data };
    })
  );
};

/**
 * Walk every page of a paginated list endpoint and return the combined rows.
 *
 * For the handful of screens that legitimately need the whole collection — a
 * product picker, an export — rather than a page of it. Requesting `?limit=100`
 * did NOT achieve this: the API clamps page size, so the surplus was silently
 * dropped. This follows `totalPages` instead.
 *
 * Capped at `maxPages` so a runaway collection cannot hang the browser.
 */
export const fetchAllPages = async (url, { params = {}, limit = 50, maxPages = 40 } = {}) => {
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await api.get(url, { params: { ...params, page, limit } });
    const body = res.data || {};
    const rows = Array.isArray(body.data) ? body.data : [];
    all.push(...rows);

    totalPages = body.totalPages || 1;
    // Endpoints that are not paginated return everything in one go.
    if (!body.totalPages) break;
    page += 1;
  } while (page <= totalPages && page <= maxPages);

  return all;
};

export { invalidateCache };
export default api;
