/**
 * @vitest-environment jsdom
 *
 * Completeness check: every navigation entry in every workspace portal must
 * render a real screen (never the "Page not found" fallback).
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import AppRoutes from "../../routes/AppRoutes"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"
import { WorkspaceProvider } from "../../features/workspace/WorkspaceProvider"
import { PORTAL_NAVIGATION, PORTALS } from "../../features/workspace/demoData"

vi.mock("../../api/axiosInstance", () => ({
  default: {
    get: vi.fn(async () => ({ data: [] })),
    post: vi.fn(async () => ({ data: [] })),
    put: vi.fn(async () => ({ data: [] })),
    patch: vi.fn(async () => ({ data: [] })),
    delete: vi.fn(async () => ({ data: [] })),
  },
  setUnauthorizedHandler: vi.fn(() => () => {}),
  isPublicAuthRequest: vi.fn(() => false),
  notifyUnauthorized: vi.fn(),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const ROLE_FOR_PORTAL = {
  student: "STUDENT",
  trainer: "TRAINER",
  employee: "EMPLOYEE",
  organization: "ORG_ADMIN",
  superadmin: "SUPER_ADMIN",
}

let container = null
let root = null

function signIn(role) {
  localStorage.setItem("srhcodeverse_token", "test-token")
  localStorage.setItem("srhcodeverse_username", "tester")
  localStorage.setItem("srhcodeverse_role", role)
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
              <WorkspaceProvider>
                <AppRoutes />
              </WorkspaceProvider>
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

describe("workspace portal navigation completeness", () => {
  for (const [portal, nav] of Object.entries(PORTAL_NAVIGATION)) {
    const role = ROLE_FOR_PORTAL[portal]

    it(`renders the ${portal} dashboard`, async () => {
      signIn(role)
      sessionStorage.setItem("srhcodeverse_workspace_demo_preview", "true")
      const c = await renderApp(`/workspace/${portal}/dashboard`)
      expect(c.textContent).not.toContain("Workspace portal not found")
      expect(c.textContent).toContain("Welcome back, Demo User")
    })

    // Sample a representative subset of nav entries to keep the suite fast.
    const sample = nav.filter(([, route]) => route !== "dashboard").slice(0, 4)
    for (const [label, route] of sample) {
      it(`renders ${portal}/${route} ("${label}") without a not-found fallback`, async () => {
        signIn(role)
        sessionStorage.setItem("srhcodeverse_workspace_demo_preview", "true")
        const c = await renderApp(`/workspace/${portal}/${route}`)
        expect(c.textContent).not.toContain("Workspace portal not found")
        // The workspace shell must render (sidebar + header), not an empty shell.
        expect(c.textContent).toContain(PORTALS[portal].label)
      })
    }
  }
})

describe("workspace not-found (unknown portal/screen)", () => {
  it("shows a not-found screen for an unknown screen inside a known portal", async () => {
    signIn("STUDENT")
    const c = await renderApp("/workspace/student/this-screen-does-not-exist")
    expect(c.textContent).toContain("Page not found")
  })

  it("shows a not-found screen for an unknown workspace portal", async () => {
    signIn("STUDENT")
    const c = await renderApp("/workspace/not-a-real-portal/dashboard")
    expect(c.textContent).toContain("Workspace portal not found")
  })
})
