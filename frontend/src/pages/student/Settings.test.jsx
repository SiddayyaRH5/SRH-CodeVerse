/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Settings from "./Settings"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/profileApi", () => ({
  getProfile: vi.fn(async () => ({ data: { username: "testuser", email: "test@example.com" } })),
  updateProfile: vi.fn(async () => ({ data: {} })),
  changePassword: vi.fn(async () => ({ data: {} })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

let container = null
let root = null

function signIn(role = "STUDENT") {
  localStorage.setItem("srhcodeverse_token", "test-token")
  localStorage.setItem("srhcodeverse_username", "testuser")
  localStorage.setItem("srhcodeverse_role", role)
}

async function renderSettings() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/settings"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Settings />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )
    await Promise.resolve()
    await Promise.resolve()
  })

  return container
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.resetAllMocks()
})

afterEach(() => {
  if (root) {
    act(() => root.unmount())
    root = null
  }
  if (container) {
    container.remove()
    container = null
  }
})

describe("Settings", () => {
  it("renders the settings page with authenticated user data", async () => {
    signIn("STUDENT")
    const c = await renderSettings()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("PREFERENCES")
    expect(text).toContain("Settings")
    expect(text).toContain("Email address")
    expect(text).toContain("Change password")
    expect(text).toContain("Appearance")
    expect(text).toContain("Editor preferences")
  })

  it("shows loading skeleton while fetching profile", async () => {
    const { getProfile } = await import("../../api/profileApi")
    getProfile.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/settings"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Settings />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })

  it("shows error and retry on API failure", async () => {
    const { getProfile } = await import("../../api/profileApi")
    getProfile.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderSettings()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Server error")
    expect(text).toContain("Try again")
  })

  it("retries profile loading on retry click", async () => {
    const { getProfile } = await import("../../api/profileApi")
    getProfile.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })
    getProfile.mockResolvedValueOnce({ data: { username: "retryuser", email: "retry@example.com" } })

    const c = await renderSettings()
    expect(c.textContent).toContain("Server error")

    const retryBtn = Array.from(c.querySelectorAll("button")).find((b) =>
      (b.textContent || "").includes("Try again"),
    )
    expect(retryBtn).not.toBeNull()

    await act(async () => {
      retryBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(getProfile).toHaveBeenCalledTimes(2)
    const emailInput = c.querySelector('input[id="settings-email"]')
    expect(emailInput.value).toBe("retry@example.com")
  })

  it("renders email update form with inputs", async () => {
    signIn("STUDENT")
    const c = await renderSettings()
    const emailInput = c.querySelector('input[id="settings-email"]')
    expect(emailInput).not.toBeNull()
    expect(emailInput.type).toBe("email")
    const saveBtn = c.querySelector('button[type="submit"]')
    expect(saveBtn).not.toBeNull()
  })

  it("renders password change form with inputs", async () => {
    signIn("STUDENT")
    const c = await renderSettings()
    const forms = c.querySelectorAll("form")
    expect(forms.length).toBe(2)
    const pwdForm = forms[1]
    const currentPasswordInput = pwdForm.querySelector('input[id="current-password"]')
    const newPasswordInput = pwdForm.querySelector('input[id="new-password"]')
    expect(currentPasswordInput).not.toBeNull()
    expect(newPasswordInput).not.toBeNull()
    expect(currentPasswordInput.type).toBe("password")
    expect(newPasswordInput.type).toBe("password")
  })

  it("shows error on password change failure without false success", async () => {
    signIn("STUDENT")
    const { changePassword } = await import("../../api/profileApi")
    changePassword.mockRejectedValueOnce({ response: { data: { message: "Wrong password" } } })

    const c = await renderSettings()
    const forms = c.querySelectorAll("form")
    const pwdForm = forms[1]
    const currentPasswordInput = pwdForm.querySelector('input[id="current-password"]')
    const newPasswordInput = pwdForm.querySelector('input[id="new-password"]')
    expect(currentPasswordInput).not.toBeNull()
    expect(newPasswordInput).not.toBeNull()

    await act(async () => {
      currentPasswordInput.value = "wrong"
      newPasswordInput.value = "newpass123"
      currentPasswordInput.dispatchEvent(new Event("input", { bubbles: true }))
      newPasswordInput.dispatchEvent(new Event("input", { bubbles: true }))
      pwdForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(c.textContent).toContain("Wrong password")
    expect(c.textContent).not.toContain("Password changed successfully.")
  })
})
