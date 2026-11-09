import axios from "axios"

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  // Render Free may need time to wake. Never auto-retry auth or other POST requests.
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 90000),
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("srhcodeverse_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Coalesce identical concurrent GETs. Requests with caller-owned AbortSignals
// remain independent so one component cannot cancel another component's request.
const inFlightGets = new Map()
const originalGet = axiosInstance.get.bind(axiosInstance)

axiosInstance.get = (url, config = {}) => {
  if (config.signal || config.cancelToken) return originalGet(url, config)
  const token = localStorage.getItem("srhcodeverse_token") || ""
  const params = config.params ? JSON.stringify(config.params) : ""
  const key = `${token}|${url}|${params}`
  const existing = inFlightGets.get(key)
  if (existing) return existing

  const request = originalGet(url, config)
  inFlightGets.set(key, request)
  request.finally(() => {
    if (inFlightGets.get(key) === request) inFlightGets.delete(key)
  }).catch(() => {})
  return request
}

export default axiosInstance
