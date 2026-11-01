import axios from "axios"
import {
  clearInFlight,
  getCachedResponse,
  getInFlight,
  getCacheVersion,
  invalidateAllCache,
  setCachedResponse,
  setInFlight,
  syncCacheUser,
} from "../utils/cache"

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 30000,
})

const CACHE_TTL_MS = 2 * 60 * 1000
const RUN_ENDPOINT = /\/run(?:\?|$)/i

function makeCacheKey(config, token) {
  const baseURL = config.baseURL || axiosInstance.defaults.baseURL || ""
  const url = config.url || ""
  const params = config.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : ""
  return `${token || "anonymous"}::${baseURL}${url}::${params}`
}

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("srhcodeverse_token")
  syncCacheUser(token)
  if (token) config.headers.Authorization = `Bearer ${token}`

  const method = (config.method || "get").toLowerCase()
  if (method !== "get" || config.skipCache) return config

  // Do not cache authentication or personal code responses.
  if (/\/auth\//i.test(config.url || "") || /\/my-code(?:\?|$)/i.test(config.url || "")) return config

  const key = makeCacheKey(config, token)
  const requestCacheVersion = getCacheVersion()
  const cached = getCachedResponse(key)
  if (cached) {
    config.adapter = async () => ({ ...cached, config, request: undefined, headers: { ...cached.headers } })
    return config
  }

  const pending = getInFlight(key)
  if (pending) {
    config.adapter = async () => {
      const response = await pending
      return { ...response, config, request: undefined, headers: { ...response.headers } }
    }
    return config
  }

  const adapter = config.adapter || axios.getAdapter(axiosInstance.defaults.adapter)
  config.adapter = async (requestConfig) => {
    const requestPromise = adapter(requestConfig)
      .then((response) => {
        setCachedResponse(key, response, CACHE_TTL_MS, requestCacheVersion)
        return response
      })
      .finally(() => clearInFlight(key))
    setInFlight(key, requestPromise)
    return requestPromise
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || "get").toLowerCase()
    const url = response.config?.url || ""
    // Running code is read-only; submitting code or any other successful
    // mutation invalidates snapshots so updated progress/results are fetched.
    if (["post", "put", "patch", "delete"].includes(method) && !RUN_ENDPOINT.test(url)) {
      invalidateAllCache()
    }
    return response
  },
  (error) => Promise.reject(error),
)

export default axiosInstance
