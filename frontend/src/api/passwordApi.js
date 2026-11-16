import axiosInstance from "./axiosInstance"

/**
 * FRONTEND-ONLY CONTRACT — the SRH CodeVerse backend does not currently expose
 * a password-reset endpoint.
 *
 * Proposed backend contract (to be implemented in a later backend phase):
 *   POST /api/auth/password-reset/request
 *   Request:  { "email": "user@example.com" }
 *   Response: 204 No Content (never reveals whether the account exists)
 *   Errors:   400 invalid email, 429 rate limited, 503 not configured
 *
 * Until that endpoint exists the adapter reports an explicit "unavailable"
 * state so the UI never claims that an email was sent.
 */
export const PASSWORD_RESET_UNAVAILABLE = "PASSWORD_RESET_UNAVAILABLE"

export async function requestPasswordReset(email) {
  try {
    const response = await axiosInstance.post("/auth/password-reset/request", { email })
    return { delivered: true, status: response.status }
  } catch (error) {
    const status = error.response?.status

    if (status === 404 || status === 405 || status === 501) {
      const unavailable = new Error("The password reset endpoint is not available yet.")
      unavailable.code = PASSWORD_RESET_UNAVAILABLE
      unavailable.status = status
      throw unavailable
    }

    throw error
  }
}
