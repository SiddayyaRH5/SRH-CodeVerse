/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import ForgotPassword from "./ForgotPassword"

vi.mock("../../api/passwordApi", () => ({
  PASSWORD_RESET_UNAVAILABLE: "PASSWORD_RESET_UNAVAILABLE",
  requestPasswordReset: vi.fn(async () => {
    const err = new Error("The password reset endpoint is not available yet.")
    err.code = "PASSWORD_RESET_UNAVAILABLE"
    throw err
  }),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("ForgotPassword", () => {
  let container
  let root

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it("renders the form with email input and submit button", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain("Reset your")
    expect(container.textContent).toContain("Email address")
    expect(container.textContent).toContain("Send reset link")
    expect(container.textContent).toContain("Return to login")
  })

  it("shows a validation error for an empty email", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      )
    })
    const form = container.querySelector("form")
    act(() => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
    expect(container.textContent).toContain("Enter the email address")
  })

  it("shows a validation error for an invalid email", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      )
    })
    const input = container.querySelector('input[type="email"]')
    const proto = Object.getPrototypeOf(input)
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set
    act(() => {
      setter.call(input, "not-an-email")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })
    const form = container.querySelector("form")
    act(() => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
    expect(container.textContent).toContain("Enter a valid email address")
  })

  it("shows the honest unavailable state (no fake success) since the backend has no endpoint", async () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>,
      )
    })
    const input = container.querySelector('input[type="email"]')
    const proto = Object.getPrototypeOf(input)
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set
    act(() => {
      setter.call(input, "user@example.com")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })
    const form = container.querySelector("form")
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Password reset is not available yet")
    expect(container.textContent).not.toContain("Reset requested")
  })
})
