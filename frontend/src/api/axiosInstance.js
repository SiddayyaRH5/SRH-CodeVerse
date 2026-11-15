import axios from "axios"
import {
  cachedFetch,
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

export default axiosInstance
