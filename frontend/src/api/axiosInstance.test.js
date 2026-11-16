/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  isPublicAuthRequest,
  notifyUnauthorized,
  setUnauthorizedHandler,
} from "./axiosInstance"
import { clearCache } from "../utils/cache"

describe("axiosInstance 401 handling", () => {
  let handler

  beforeEach(async () => {
    localStorage.clear()
    clearCache()
    handler = vi.fn()
    setUnauthorizedHandler(handler)
    // The module-level guard releases after ~1s; wait it out so tests are independent.
    await new Promise((resolve) => setTimeout(resolve, 1100))
  })

  afterEach(() => {
    setUnauthorizedHandler(null)
    vi.useRealTimers()
  })

  it("treats login/register/oauth endpoints as public auth requests", () => {
    expect(isPublicAuthRequest("/auth/login")).toBe(true)
    expect(isPublicAuthRequest("/auth/register")).toBe(true)
    expect(isPublicAuthRequest("/auth/oauth/exchange-code")).toBe(true)
    expect(isPublicAuthRequest("/auth/login/oauth2/google")).toBe(true)
    expect(isPublicAuthRequest("/student/dashboard")).toBe(false)
    expect(isPublicAuthRequest("/problems")).toBe(false)
  })

  it("clears stored credentials and calls the registered handler", () => {
    localStorage.setItem("srhcodeverse_token", "t")
    localStorage.setItem("srhcodeverse_username", "u")
    localStorage.setItem("srhcodeverse_role", "STUDENT")

    notifyUnauthorized()

    expect(localStorage.getItem("srhcodeverse_token")).toBeNull()
    expect(localStorage.getItem("srhcodeverse_username")).toBeNull()
    expect(localStorage.getItem("srhcodeverse_role")).toBeNull()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("handles concurrent 401s with a single logout/redirect", () => {
    notifyUnauthorized()
    notifyUnauthorized()
    notifyUnauthorized()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("releases the guard after the short window", async () => {
    vi.useFakeTimers()
    notifyUnauthorized()
    expect(handler).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1100)
    notifyUnauthorized()
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it("does nothing when no handler is registered", () => {
    setUnauthorizedHandler(null)
    expect(() => notifyUnauthorized()).not.toThrow()
  })
})
