/**
 * @vitest-environment jsdom
 *
 * Demo mode: no-registration access to all five portals.
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

let container = null
let root = null

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

describe("demo mode portal selection", () => {
  it("renders all five portals on /demo without authentication", async () => {
    const c = await renderApp("/demo")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Explore the")
    expect(text).toContain("portals")
    expect(text).toContain("Student portal")
    expect(text).toContain("Professional portal")
    expect(text).toContain("Trainer portal")
    expect(text).toContain("Organization Admin portal")
    expect(text).toContain("Super Admin portal")
    expect(text).toContain("DEMO MODE")
    expect(text).toContain("No registration required")
    // Must not redirect to login
    expect(text).not.toContain("Welcome Back!")
  })

  it("does not create an account or JWT session", async () => {
    await renderApp("/demo")
    expect(localStorage.getItem("srhcodeverse_token")).toBeNull()
    expect(localStorage.getItem("srhcodeverse_username")).toBeNull()
    expect(localStorage.getItem("srhcodeverse_role")).toBeNull()
  })
})

describe("demo mode portal dashboards", () => {
  const portals = [
    { key: "student", label: "Student workspace", metric: "Active courses" },
    { key: "professional", label: "Professional workspace", metric: "My open tasks" },
    { key: "trainer", label: "Trainer workspace", metric: "Learners" },
    { key: "organization", label: "Organization admin workspace", metric: "Employees" },
    { key: "superadmin", label: "Platform control center", metric: "Pending applications" },
  ]

  for (const p of portals) {
    it(`renders the ${p.key} demo dashboard without authentication`, async () => {
      const c = await renderApp(`/demo/${p.key}/dashboard`)
      const text = c.textContent.replace(/\s+/g, " ")
      expect(text).toContain("Welcome back, Demo User")
      expect(text).toContain(p.label)
      expect(text).toContain(p.metric)
      expect(text).toContain("DEMO MODE")
      // Must not show the restricted page
      expect(text).not.toContain("portal is restricted")
      // Must not redirect to login
      expect(text).not.toContain("Welcome Back!")
    })
  }

  it("renders a nested demo route", async () => {
    const c = await renderApp("/demo/student/courses/course-1")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Java Foundations")
    expect(text).toContain("DEMO MODE")
  })

  it("shows the DEMO MODE banner with a sign-in link", async () => {
    const c = await renderApp("/demo/student/dashboard")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("DEMO MODE")
    expect(text).toContain("Sign in")
    expect(text).toContain("no account is created")
  })

  it("allows portal switching inside demo mode", async () => {
    const c = await renderApp("/demo/student/dashboard")
    // The portal selector is a <select>; change it via DOM
    const select = c.querySelector("#demo-portal")
    expect(select).not.toBeNull()
    const proto = Object.getPrototypeOf(select)
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set
    act(() => {
      setter.call(select, "superadmin")
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })
    // After switching, the URL should change to /demo/superadmin/dashboard
    // and the super admin portal should render
    await act(async () => {
      await Promise.resolve()
    })
    // The page should now show super admin content
    expect(c.textContent).toContain("Platform control center")
  })
})

describe("demo mode does not bypass production auth", () => {
  it("redirects an anonymous visitor of /dashboard to login", async () => {
    const c = await renderApp("/dashboard")
    expect(c.textContent).toContain("Welcome Back!")
  })

  it("redirects an anonymous visitor of /workspace/student/dashboard to login", async () => {
    const c = await renderApp("/workspace/student/dashboard")
    expect(c.textContent).toContain("Welcome Back!")
  })
})
