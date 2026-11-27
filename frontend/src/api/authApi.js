import axiosInstance from "./axiosInstance"

export const OAUTH_INITIATION_URLS = {
  google: "https://srh-codeverse-backend.onrender.com/api/auth/login/oauth2/google",
  github: "https://srh-codeverse-backend.onrender.com/api/auth/login/oauth2/github",
}

export const registerUser = (data) => axiosInstance.post("/auth/register", data)
export const loginUser = (data) => axiosInstance.post("/auth/login", data)

export const getOAuthProviders = () =>
  axiosInstance.get("/auth/oauth/providers").then((response) => response.data)

const OAUTH_CODE_EXCHANGE_URL =
  "https://srh-codeverse-backend.onrender.com/api/auth/oauth/exchange-code"

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