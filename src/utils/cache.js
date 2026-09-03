/**
 * Client-side request cache
 * ─────────────────────────────────────────────────────────────────────────────
 * A small in-memory TTL cache with in-flight de-duplication, layered *above*
 * axios. It solves two problems the HTTP cache cannot:
 *
 *   1. SPA navigation. Moving Home → Shop → Product → back re-mounts each page
 *      and re-runs its useEffect, firing the same GET again. This serves those
 *      repeats from memory instantly, with no network round-trip at all.
 *
 *   2. Concurrent duplicates. HomePage and the navbar can both ask for
 *      /categories in the same tick. Callers that arrive while a request is
 *      already in flight share that one promise instead of opening a second
 *      connection.
 *
 * Deliberately in-memory only: it dies on page reload, where the browser HTTP
 * cache (driven by the Cache-Control headers the API now sends) takes over. No
 * localStorage, so there is no cross-tab staleness and no quota to blow.
 *
 * Only ever used for public, non-personalised catalogue reads. Cart, orders,
 * profile and admin data are never cached here.
 */

/** key -> { expiresAt: number, body: any } */
const store = new Map();

/** key -> Promise, for requests currently on the wire */
const inflight = new Map();

/**
 * Global bypass. Flipped on for admin sessions, who mutate the catalogue and
 * must always read their own writes. Set from AuthContext whenever the signed-in
 * user changes; turning it on also empties the store so nothing survives the
 * switch from a customer session to an admin one.
 */
let bypassed = false;
export const setCacheBypass = (value) => {
  bypassed = Boolean(value);
  if (bypassed) store.clear();
};
export const isCacheBypassed = () => bypassed;


/** Build a stable key from a URL plus its query params (key order independent). */
export const buildKey = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  const sorted = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return sorted ? `${url}?${sorted}` : url;
};

/** Read a still-fresh entry, or undefined. Expired entries are evicted on touch. */
export const readCache = (key) => {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.body;
};

export const writeCache = (key, body, ttlMs) => {
  store.set(key, { body, expiresAt: Date.now() + ttlMs });
};

/**
 * Drop cached entries.
 * @param {string} [prefix] - drop only keys starting with this path. Omit to clear everything.
 */
export const invalidateCache = (prefix) => {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

/** Share an in-flight promise between concurrent callers of the same key. */
export const dedupe = (key, run) => {
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = run().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
};

/** Exposed for tests / debugging. */
export const _stats = () => ({ entries: store.size, inflight: inflight.size });
