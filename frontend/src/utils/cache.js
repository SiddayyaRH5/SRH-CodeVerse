const store = new Map()
const inFlight = new Map()
const DEFAULT_TTL_MS = 2 * 60 * 1000
const MAX_CACHE_ENTRIES = 200
let activeUserToken = null
let cacheVersion = 0

function readEntry(key) {
  const entry = store.get(key)
  if (!entry) return { found: false }
  if (Date.now() >= entry.expiresAt) {
    store.delete(key)
    return { found: false }
  }
  return { found: true, value: entry.value }
}

function removeExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.expiresAt) store.delete(key)
  }
}

export function syncCacheUser(token) {
  const nextToken = token || null
  if (activeUserToken !== nextToken) {
    cacheVersion += 1
    store.clear()
    inFlight.clear()
    activeUserToken = nextToken
  }
}

export function getCachedResponse(key) {
  const entry = readEntry(key)
  return entry.found ? entry.value : null
}

export function getCacheVersion() {
  return cacheVersion
}

export function setCachedResponse(
  key,
  value,
  ttlMs = DEFAULT_TTL_MS,
  requestVersion = cacheVersion,
) {
  if (requestVersion !== cacheVersion || ttlMs <= 0) return

  removeExpiredEntries()
  store.delete(key)
  store.set(key, { value, expiresAt: Date.now() + ttlMs })

  while (store.size > MAX_CACHE_ENTRIES) {
    store.delete(store.keys().next().value)
  }
}

export function getInFlight(key) {
  return inFlight.get(key)
}

export function setInFlight(key, promise) {
  inFlight.set(key, promise)
}

export function clearInFlight(key, promise) {
  if (!promise || inFlight.get(key) === promise) {
    inFlight.delete(key)
  }
}

export function cachedFetch(key, fetchFn, ttlMs = DEFAULT_TTL_MS) {
  const cached = readEntry(key)
  if (cached.found) return Promise.resolve(cached.value)

  const pending = inFlight.get(key)
  if (pending) return pending

  const requestVersion = cacheVersion
  let request
  request = Promise.resolve()
    .then(fetchFn)
    .then((value) => {
      setCachedResponse(key, value, ttlMs, requestVersion)
      return value
    })
    .finally(() => clearInFlight(key, request))
  inFlight.set(key, request)
  return request
}

export function invalidateAllCache() {
  cacheVersion += 1
  store.clear()
  inFlight.clear()
}

export function invalidate(key) {
  if (!key) {
    invalidateAllCache()
    return
  }

  const matchesKey = key.startsWith("problems:")
    ? (cacheKey) => cacheKey.includes("/problems")
    : (cacheKey) => cacheKey === key || cacheKey.startsWith(`${key}::`)
  const keys = new Set([...store.keys(), ...inFlight.keys()])
  const matchingKeys = [...keys].filter(matchesKey)

  if (matchingKeys.length === 0) return

  cacheVersion += 1
  matchingKeys.forEach((cacheKey) => {
    store.delete(cacheKey)
    inFlight.delete(cacheKey)
  })
}

export function invalidateCache(key) {
  invalidate(key)
}

export function clearCache() {
  invalidateAllCache()
  activeUserToken = null
}
