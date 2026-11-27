import axiosInstance from "./axiosInstance"

// Derive OAuth endpoints from the configured API base URL so the same bundle
// targets the local backend during development and the production backend when
// VITE_API_URL is set at build time.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "")

export const OAUTH_INITIATION_URLS = {
  google: `${API_BASE_URL}/auth/login/oauth2/google`,
  github: `${API_BASE_URL}/auth/login/oauth2/github`,
}

export const registerUser = (data) => axiosInstance.post("/auth/register", data)
export const loginUser = (data) => axiosInstance.post("/auth/login", data)

export const getOAuthProviders = () =>
  axiosInstance.get("/auth/oauth/providers").then((response) => response.data)

const OAUTH_CODE_EXCHANGE_URL = `${API_BASE_URL}/auth/oauth/exchange-code`

export const exchangeOAuthCode = (code) =>
  fetch(OAUTH_CODE_EXCHANGE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "omit",
    cache: "no-store",
    body: JSON.stringify({ code }),
  })