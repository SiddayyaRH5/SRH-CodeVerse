/**
 * @vitest-environment jsdom
 *
 * Route-rendering regression tests for the SRH CodeVerse workspace integration.
 *
 * These tests assert that the real React components render for every portal
 * route (not merely that a URL resolves), that the production student/trainer
 * routes keep working, and that the workspace access policy keeps privileged
 * portals away from ordinary accounts.
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import AppRoutes from "../../routes/AppRoutes"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"
import { WorkspaceProvider } from "./WorkspaceProvider"
import { WORKSPACE_PREVIEW_STORAGE_KEY } from "./workspacePolicy"

// The production pages talk to the Spring Boot API. The workspace itself never
// does, so stubbing the axios instance keeps these tests focused on routing.
// GET resolves with an empty array, which satisfies both list and summary
// usages in the production pages (they read optional fields off it).
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

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    },
  })
}

let container = null
let root = null
let navigate = null
let currentPath = null

function RouterProbe() {
  navigate = useNavigate()
  currentPath = useLocation().pathname
  return null
}

function signIn(role, username = "tester") {
  localStorage.setItem("srhcodeverse_token", "test-token")
  localStorage.setItem("srhcodeverse_username", username)
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
        <RouterProbe />
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
  })

  // Let the stubbed API promises settle so pages render their final state.
  await act(async () => {
    await Promise.resolve()
  })

  return {
    text: () => container.textContent.replace(/\s+/g, " "),
    path: () => currentPath,
  }
}

function clickByText(label, selector = "a, button") {
  const nodes = Array.from(container.querySelectorAll(selector))
  const target = nodes.find((node) => (node.textContent || "").replace(/\s+/g, " ").trim().includes(label))
  if (!target) {
    throw new Error(`No ${selector} containing "${label}" was rendered.`)
  }
  act(() => {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
  })
  return target
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  navigate = null
  currentPath = null
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

const PORTAL_ENTRY_CASES = [
  {
    portal: "student",
    role: "STUDENT",
    shell: "Student workspace",
    metric: "Active courses",
  },
  {
    portal: "trainer",
    role: "TRAINER",
    shell: "Trainer workspace",
    metric: "Learners",
  },
  {
    portal: "employee",
    role: "EMPLOYEE",
    shell: "Professional workspace",
    metric: "My open tasks",
  },
  {
    portal: "organization",
    role: "ORG_ADMIN",
    shell: "Organization admin workspace",
    metric: "Employees",
  },
  {
    portal: "superadmin",
    role: "SUPER_ADMIN",
    shell: "Platform control center",
    metric: "Pending applications",
  },
]

describe("workspace portal entry routes", () => {
  for (const testCase of PORTAL_ENTRY_CASES) {
    it(`renders the ${testCase.portal} portal dashboard for a ${testCase.role} account`, async () => {
      signIn(testCase.role)
      const app = await renderApp(`/workspace/${testCase.portal}/dashboard`)

      expect(app.text()).toContain("Welcome back, Demo User")
      expect(app.text()).toContain(testCase.shell)
      expect(app.text()).toContain(testCase.metric)
      expect(app.text()).toContain("DEMO")
      expect(app.text()).not.toContain("Page not found")
    })
  }
})

describe("Professional portal naming and employee URL compatibility", () => {
  it("renders the Professional portal at the canonical employee URL", async () => {
    signIn("EMPLOYEE")
    const app = await renderApp("/workspace/employee/dashboard")

    expect(app.text()).toContain("Professional workspace")
    expect(app.text()).toContain("My open tasks")
    expect(app.text()).toContain("Professional portal")
    expect(app.text()).not.toContain("Page not found")
  })

  it("renders the Professional portal through the /workspace/professional alias", async () => {
    signIn("EMPLOYEE")
    const app = await renderApp("/workspace/professional/dashboard")

    expect(app.text()).toContain("Professional workspace")
    expect(app.text()).toContain("My open tasks")
    expect(app.text()).not.toContain("Workspace portal not found")
  })

  it("keeps the Professional portal reachable as a labelled demo preview", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/professional/dashboard")

    expect(app.text()).toContain("Professional portal is restricted")
    expect(app.text()).toContain("Preview this portal with sample data")

    clickByText("Preview this portal with sample data")

    expect(app.text()).toContain("Professional workspace")
    expect(app.text()).toContain("DEMO PREVIEW")
    expect(localStorage.getItem("srhcodeverse_role")).toBe("STUDENT")
  })
})

const NESTED_ROUTE_CASES = [
  {
    portal: "student",
    role: "STUDENT",
    path: "/workspace/student/courses/course-1",
    expected: ["Java Foundations", "My courses"],
  },
  {
    portal: "trainer",
    role: "TRAINER",
    path: "/workspace/trainer/evaluation/submission-1",
    expected: ["Grading and feedback", "Collections practice"],
  },
  {
    portal: "employee",
    role: "EMPLOYEE",
    path: "/workspace/employee/task-list/task-4",
    expected: ["Task list", "Publish Java cohort rubric"],
  },
  {
    portal: "organization",
    role: "ORG_ADMIN",
    path: "/workspace/organization/employees/emp-1",
    expected: ["Employee directory", "Avery Morgan"],
  },
  {
    portal: "superadmin",
    role: "SUPER_ADMIN",
    path: "/workspace/superadmin/applications/app-1",
    expected: ["ORGANIZATION APPLICATION", "Cedar & Co."],
  },
]

describe("workspace nested routes", () => {
  for (const testCase of NESTED_ROUTE_CASES) {
    it(`renders the ${testCase.portal} detail screen at ${testCase.path}`, async () => {
      signIn(testCase.role)
      const app = await renderApp(testCase.path)

      for (const fragment of testCase.expected) {
        expect(app.text()).toContain(fragment)
      }
      expect(app.text()).not.toContain("Record not found")
      expect(app.text()).not.toContain("Page not found")
    })
  }
})

describe("production routes keep working alongside the workspace", () => {
  it("still renders the production student dashboard for a STUDENT account", async () => {
    signIn("STUDENT")
    const app = await renderApp("/dashboard")

    expect(app.text()).toContain("YOUR DEVELOPER SPACE")
    expect(app.text()).toContain("Problems solved")
    expect(app.text()).not.toContain("Workspace portal")
  })

  it("still renders the production trainer dashboard for a TRAINER account", async () => {
    signIn("TRAINER")
    const app = await renderApp("/trainer/dashboard")

    expect(app.text()).toContain("Trainer Dashboard")
    expect(app.text()).not.toContain("Workspace portal")
  })

  it("keeps the production role guard on trainer-only routes", async () => {
    signIn("STUDENT")
    const app = await renderApp("/trainer/dashboard")

    expect(app.text()).not.toContain("Trainer Dashboard")
    expect(app.text()).not.toContain("Set Daily Challenge")
  })

  it("keeps the public login route reachable", async () => {
    signOut()
    const app = await renderApp("/login")

    expect(app.text()).toContain("Welcome")
    expect(app.path()).toBe("/login")
  })
})

describe("workspace authentication and portal access policy", () => {
  it("redirects an anonymous visitor to the production login page", async () => {
    signOut()
    const app = await renderApp("/workspace/student/dashboard")

    expect(app.path()).toBe("/login")
    expect(app.text()).toContain("Welcome")
    expect(app.text()).not.toContain("Welcome back, Demo User")
  })

  it("keeps the super admin portal away from an ordinary student account", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/superadmin/dashboard")

    expect(app.text()).toContain("Super admin portal is restricted")
    expect(app.text()).not.toContain("Pending applications")
    expect(app.text()).not.toContain("Platform control center")
  })

  it("keeps the organization admin portal away from an ordinary student account", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/organization/dashboard")

    expect(app.text()).toContain("Organization admin portal is restricted")
    expect(app.text()).not.toContain("Organization admin workspace")
  })

  it("keeps the trainer portal away from an ordinary student account", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/trainer/dashboard")

    expect(app.text()).toContain("Trainer portal is restricted")
    expect(app.text()).not.toContain("Trainer workspace")
  })

  it("opens a privileged portal in an explicitly labelled demo preview", async () => {
    signIn("STUDENT")
    sessionStorage.setItem(WORKSPACE_PREVIEW_STORAGE_KEY, "true")
    const app = await renderApp("/workspace/superadmin/dashboard")

    expect(app.text()).toContain("Platform control center")
    expect(app.text()).toContain("Pending applications")
    expect(app.text()).toContain("DEMO PREVIEW")
    expect(app.text()).toContain("no backend permission")
  })

  it("starts the demo preview from the restricted page and can stop it again", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/superadmin/dashboard")

    expect(app.text()).toContain("Super admin portal is restricted")

    clickByText("Preview this portal with sample data")

    expect(app.path()).toBe("/workspace/superadmin/dashboard")
    expect(app.text()).toContain("Platform control center")
    expect(app.text()).toContain("DEMO PREVIEW")

    clickByText("Stop preview")

    expect(app.text()).toContain("Super admin portal is restricted")
    expect(app.text()).not.toContain("Platform control center")
  })

  it("does not treat the demo portal selector as real authorization", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/student/dashboard")

    // The selector is a preview control: it never changes the account role.
    expect(app.text()).toContain("Student workspace")
    expect(app.text()).not.toContain("DEMO PREVIEW")
    expect(localStorage.getItem("srhcodeverse_role")).toBe("STUDENT")
  })
})

describe("workspace navigation", () => {
  it("moves between workspace screens with the sidebar navigation", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/student/dashboard")

    expect(app.text()).toContain("Active courses")

    clickByText("My courses")

    expect(app.path()).toBe("/workspace/student/courses")
    expect(app.text()).toContain("My courses")
    expect(app.text()).toContain("Java Foundations")
  })

  it("supports browser back and forward inside the workspace", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/student/dashboard")

    clickByText("My courses")
    expect(app.path()).toBe("/workspace/student/courses")

    act(() => navigate(-1))
    expect(app.path()).toBe("/workspace/student/dashboard")
    expect(app.text()).toContain("Active courses")

    act(() => navigate(1))
    expect(app.path()).toBe("/workspace/student/courses")
    expect(app.text()).toContain("Java Foundations")
  })
})

describe("workspace not-found handling", () => {
  it("shows a not-found screen for an unknown screen inside a known portal", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/student/this-screen-does-not-exist")

    expect(app.text()).toContain("Page not found")
    expect(app.text()).toContain("Return to dashboard")
    expect(app.text()).not.toContain("Welcome back, Demo User")
  })

  it("shows a not-found screen for an unknown workspace portal", async () => {
    signIn("STUDENT")
    const app = await renderApp("/workspace/not-a-real-portal/dashboard")

    expect(app.text()).toContain("Workspace portal not found")
    expect(app.text()).toContain("Return to CodeVerse")
  })
})
