/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("authApi OAuth configuration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("derives OAuth endpoints from the configured API base URL", async () => {
    vi.stubEnv("VITE_API_URL", "https://srh-codeverse-backend.onrender.com/api")
    const { OAUTH_INITIATION_URLS } = await import("./authApi")

    expect(OAUTH_INITIATION_URLS.google).toBe(
      "https://srh-codeverse-backend.onrender.com/api/auth/login/oauth2/google",
    )
    expect(OAUTH_INITIATION_URLS.github).toBe(
      "https://srh-codeverse-backend.onrender.com/api/auth/login/oauth2/github",
    )
  })

  it("uses local backend endpoints when no API base URL is configured", async () => {
    const { OAUTH_INITIATION_URLS } = await import("./authApi")

    expect(OAUTH_INITIATION_URLS.google).toBe(
      "http://localhost:8080/api/auth/login/oauth2/google",
    )
    expect(OAUTH_INITIATION_URLS.github).toBe(
      "http://localhost:8080/api/auth/login/oauth2/github",
    )
  })
})
