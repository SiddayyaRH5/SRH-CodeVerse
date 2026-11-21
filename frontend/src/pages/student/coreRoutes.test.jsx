/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import AppRoutes from "../../routes/AppRoutes"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"
// WorkspaceProvider removed.

vi.mock("../../api/submissionApi", () => ({
  getMySubmissions: vi.fn(async () => ({ data: [] })),
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
  localStorage.setItem("srhcodeverse_username", "tester")
  localStorage.setItem("srhcodeverse_role", role)
}

function signOut() {
  localStorage.removeItem("srhcodeverse_token")
  localStorage.removeItem("srhcodeverse_username")
  localStorage.removeItem("srhcodeverse_role")
}

async function renderApp(path) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )
    await Promise.resolve()
  })

  return container
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
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

describe("core routes (Phase 1E)", () => {
  it("renders the NotFound page for an unknown URL", async () => {
    signOut()
    const c = await renderApp("/this-route-does-not-exist")
    expect(c.textContent).toContain("We couldn't find that page")
    expect(c.textContent).toContain("Return to home")
  })

  it("renders My Submissions for an authorized user", async () => {
    signIn("STUDENT")
    const c = await renderApp("/my-submissions")
    expect(c.textContent).toContain("My Submissions")
    expect(c.textContent).toContain("No submissions yet")
  })

  it("renders the Notifications page for an authorized user", async () => {
    signIn("STUDENT")
    const c = await renderApp("/notifications")
    expect(c.textContent).toContain("Notifications")
  })

  it("renders the ForgotPassword page for anonymous visitors", async () => {
    signOut()
    const c = await renderApp("/forgot-password")
    expect(c.textContent).toContain("Reset your")
    expect(c.textContent).toContain("Send reset link")
  })

  it("renders the NotFound page at the root catch-all for a deeply unknown path", async () => {
    signIn("STUDENT")
    const c = await renderApp("/a/b/c/d/e")
    expect(c.textContent).toContain("We couldn't find that page")
  })
})

describe("Navbar navigation", () => {
  it("renders the Navbar for authenticated users", async () => {
    signIn("STUDENT")
    const c = await renderApp("/dashboard")
    expect(c.textContent).toContain("SRH CodeVerse")
    expect(c.textContent).toContain("Courses")
    expect(c.textContent).toContain("Practice")
  })
})
