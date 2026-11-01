// Application-wide in-memory API cache. Data stays in this browser tab and is
// automatically discarded on reload or when the authenticated user changes.
const cache = new Map()
const inFlight = new Map()
const DEFAULT_TTL_MS = 2 * 60 * 1000 // 2 minutes
let activeUserToken = null
let cacheVersion = 0

export function syncCacheUser(token) {
  const nextToken = token || null
  if (activeUserToken !== nextToken) {
    cache.clear()
    inFlight.clear()
    activeUserToken = nextToken
  }
}

export function getCachedResponse(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.response
}

export function getCacheVersion() { return cacheVersion }

export function setCachedResponse(key, response, ttlMs = DEFAULT_TTL_MS, requestVersion = cacheVersion) {
  // Ignore responses that started before a mutation or account switch.
  if (requestVersion === cacheVersion) {
    cache.set(key, { response, expiresAt: Date.now() + ttlMs })
  }
}

export function getInFlight(key) { return inFlight.get(key) }
export function setInFlight(key, promise) { inFlight.set(key, promise) }
export function clearInFlight(key) { inFlight.delete(key) }

// Mutations can change data shown on many screens (dashboard, activity,
// achievements, analytics, profile, courses, etc.), so clear GET snapshots.
export function invalidateAllCache() {
  cacheVersion += 1
  cache.clear()
  inFlight.clear()
}
export function invalidateCache(key) { cache.delete(key) }
export function clearCache() {
  cacheVersion += 1
  cache.clear()
  inFlight.clear()
  activeUserToken = null
}

// Fetch data using cache and prevent duplicate requests.
export async function cachedFetch(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const cached = getCachedResponse(key)

  if (cached !== null) {
    return cached
  }

  const existingRequest = getInFlight(key)

  if (existingRequest) {
    return existingRequest
  }

  const requestVersion = getCacheVersion()

  const request = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      setCachedResponse(key, data, ttlMs, requestVersion)
      return data
    })
    .finally(() => {
      clearInFlight(key)
    })

  setInFlight(key, request)
  return request
}

// Compatibility alias used by ProblemDetail.jsx.
export function invalidate(key) {
  invalidateCache(key)
}