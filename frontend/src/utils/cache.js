const store = new Map()

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Returns cached data if present and not expired, otherwise calls fetchFn,
 * caches the result, and returns it.
 */
export async function cachedFetch(key, fetchFn, ttlMs = DEFAULT_TTL_MS) {
  const entry = store.get(key)
  const now = Date.now()

  if (entry && now - entry.timestamp < ttlMs) {
    return entry.data
  }

  const data = await fetchFn()
  store.set(key, { data, timestamp: now })
  return data
}

/** Removes one cache entry (e.g. after a mutation that invalidates it). */
export function invalidate(key) {
  store.delete(key)
}

/** Clears everything — call on logout so the next user starts clean. */
export function clearCache() {
  store.clear()
}