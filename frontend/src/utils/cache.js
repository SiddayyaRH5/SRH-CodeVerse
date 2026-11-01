// Central in-memory API response cache.
// Only successful GET responses are cached. Cache keys include the active
// authentication token so data is never shared between signed-in accounts.

const cache = new Map()
const inFlight = new Map()
const legacyStore = new Map()

export const DEFAULT_CACHE_TTL_MS = 2 * 60 * 1000
const MAX_CACHE_ENTRIES = 200

function getAuthScope() {
  return localStorage.getItem("srhcodeverse_token") || "anonymous"
}

function makeKey(url, config = {}) {
  const params = config.params ? JSON.stringify(config.params) : ""
  return `${getAuthScope()}::GET::${url}::${params}`
}

function trimCache() {
  const now = Date.now()

  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) cache.delete(key)
  }

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (!oldestKey) break
    cache.delete(oldestKey)
  }
}

/**
 * Axios-compatible GET helper. Returns the same response shape as
 * axiosInstance.get(), allowing existing pages to remain unchanged.
 */
export async function cachedGet(axiosInstance, url, config = {}, ttlMs = DEFAULT_CACHE_TTL_MS) {
  const key = makeKey(url, config)
  const now = Date.now()

  trimCache()

  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) {
    // Refresh insertion order for simple least-recently-used eviction.
    cache.delete(key)
    cache.set(key, cached)
    return cached.response
  }

  if (inFlight.has(key)) return inFlight.get(key)

  const request = axiosInstance.get(url, config)
    .then((response) => {
      // Never cache errors; this branch only runs for successful responses.
      cache.set(key, {
        url,
        response,
        expiresAt: Date.now() + ttlMs,
      })
      trimCache()
      return response
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, request)
  return request
}

/**
 * Invalidate all cached GET requests, or only requests whose URL starts
 * with one of the supplied endpoint prefixes.
 */
export function invalidateApiCache(urlPrefixes) {
  if (!urlPrefixes) {
    cache.clear()
    return
  }

  const prefixes = Array.isArray(urlPrefixes) ? urlPrefixes : [urlPrefixes]
  for (const [key, entry] of cache.entries()) {
    if (prefixes.some((prefix) => entry.url?.startsWith(prefix))) {
      cache.delete(key)
    }
  }
}

// Backwards-compatible clear function used by AuthContext on logout.
export function clearCache() {
  cache.clear()
  inFlight.clear()
  legacyStore.clear()
}

// Backwards-compatible helper used by the existing Problems page.
export async function cachedFetch(key, fetchFn, ttlMs = DEFAULT_CACHE_TTL_MS) {
  const now = Date.now()
  const entry = legacyStore.get(key)
  if (entry && entry.expiresAt > now) return entry.data

  const data = await fetchFn()
  legacyStore.set(key, { data, expiresAt: Date.now() + ttlMs })
  return data
}

// Backwards-compatible invalidation used by existing page components.
export function invalidate(key) {
  if (typeof key === "string") {
    legacyStore.delete(key)
    // Existing problem mutations should also clear the central API cache.
    if (key.startsWith("problems:")) invalidateApiCache("/problems")
    for (const [cacheKey, entry] of cache.entries()) {
      if (cacheKey.includes(key) || entry.url?.startsWith(key)) cache.delete(cacheKey)
    }
  } else {
    clearCache()
  }
}
