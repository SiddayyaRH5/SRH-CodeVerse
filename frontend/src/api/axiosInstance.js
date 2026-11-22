import axios from "axios"
import {
  cachedFetch,
  clearCache,
  invalidateAllCache,
  syncCacheUser,
} from "../utils/cache"

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  // Render Free may need time to wake. Never auto-retry auth or other POST requests.
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 90000),
})

const CACHE_TTL_MS = 2 * 60 * 1000
const RUN_ENDPOINT = /\/run(?:[/?#]|$)/i
const originalGet = axiosInstance.get.bind(axiosInstance)

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function makeCacheKey(url, config, token) {
  const baseURL = config.baseURL || axiosInstance.defaults.baseURL || ""
  const params = stableSerialize(config.params || {})
  const headers = config.headers?.toJSON?.() || config.headers || {}
  const cacheHeaders = Object.fromEntries(
    Object.entries(headers)
      .filter(([name]) => name.toLowerCase() !== "authorization")
      .sort(([left], [right]) => left.localeCompare(right)),
  )

  return JSON.stringify([
    token || "anonymous",
    baseURL,
    url,
    params,
    stableSerialize(cacheHeaders),
    config.responseType || "",
  ])
}

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("srhcodeverse_token")
  syncCacheUser(token)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.get = (url, config = {}) => {
  const token = localStorage.getItem("srhcodeverse_token")
  syncCacheUser(token)

  const cacheDisabled =
    config.skipCache
    || config.signal
    || config.cancelToken
    || /\/auth(?:\/|$)/i.test(url)
    || /\/my-code(?:[/?#]|$)/i.test(url)

  if (cacheDisabled) return originalGet(url, config)

  const key = makeCacheKey(url, config, token)
  return cachedFetch(key, () => originalGet(url, config), CACHE_TTL_MS)
}

axiosInstance.interceptors.response.use((response) => {
  const method = (response.config?.method || "get").toLowerCase()
  const url = response.config?.url || ""
  if (
    ["post", "put", "patch", "delete"].includes(method)
    && !RUN_ENDPOINT.test(url)
  ) {
    invalidateAllCache()
  }
  return response
})

// ---------------------------------------------------------------------------
// Unauthorized (401) handling
// ---------------------------------------------------------------------------
// Endpoints that legitimately answer 401 for a *failed attempt* rather than an
// expired session. Redirecting on these would log a user out while they are
// simply typing the wrong password.
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/oauth/exchange-code",
  "/auth/login/oauth2/",
]

let unauthorizedHandler = null
let handlingUnauthorized = false

export function isPublicAuthRequest(url = "") {
  return PUBLIC_AUTH_PATHS.some((path) => String(url).includes(path))
}

/**
 * Registers the React-side cleanup (clearing auth state and navigating to the
 * login screen). Returns an unregister function.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null
  }
}

/**
 * Clears the invalid session exactly once, even when several requests fail
 * with 401 at the same time.
 *
 * - Removes the JWT token from localStorage so subsequent requests fail cleanly.
 * - Clears the response cache to prevent stale data.
 * - Calls the registered unauthorized handler, which should sign the user out
 *   and redirect to the login page.
 */
export function notifyUnauthorized() {
  if (handlingUnauthorized) return
  handlingUnauthorized = true
  // Release the guard so a later, genuinely separate 401 can still be handled.
  setTimeout(() => {
    handlingUnauthorized = false
  }, 1000)

  try {
    window.localStorage.removeItem("srhcodeverse_token")
    window.localStorage.removeItem("srhcodeverse_username")
    window.localStorage.removeItem("srhcodeverse_role")
  } catch {
    // Storage can be unavailable; the cache clear below still applies.
  }

  clearCache()

  if (unauthorizedHandler) unauthorizedHandler()
}

/**
 * Handles a 401 response from the API. This is called from the axios response
 * interceptor. It ensures the session is invalidated and the user is redirected
 * to the login page.
 *
 * @param {Object} error - The axios error object.
 * @param {string} pageName - The name of the page making the request, for logging.
 */
export function handleUnauthorizedResponse(error, pageName) {
  const status = error.response?.status
  const url = error.config?.url ?? ""

  // 401 and not a public auth path → session expired/invalid
  if (status === 401 && !isPublicAuthRequest(url)) {
    notifyUnauthorized()
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ""

    // 403 means "authenticated but not allowed" — never an expired session.
    if (status === 401 && !isPublicAuthRequest(url)) {
      handleUnauthorizedResponse(error, error.config?.pageName ?? "unknown")
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
