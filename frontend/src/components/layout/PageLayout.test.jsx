/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import PageLayout from "./PageLayout"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

async function renderPageLayout() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <PageLayout>
                <p>Main content</p>
              </PageLayout>
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
  vi.clearAllMocks()
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

describe("PageLayout", () => {
  it("renders the student sidebar with navigation groups", async () => {
    signIn("STUDENT")
    const c = await renderPageLayout()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Dashboard")
    expect(text).toContain("Student Portal")
  })

  it("renders Notifications link exactly once in sidebar", async () => {
    signIn("STUDENT")
    const c = await renderPageLayout()
    // Sidebar content is rendered in both desktop sidebar and mobile drawer;
    // check only the desktop sidebar (first <nav> element)
    const navs = c.querySelectorAll("nav")
    const desktopNav = navs[0]
    const notificationLinks = desktopNav.querySelectorAll(
      'a[href="/notifications"]'
    )
    expect(notificationLinks.length).toBe(1)
  })

  it("includes Workspaces link in sidebar footer", async () => {
    signIn("STUDENT")
    const c = await renderPageLayout()
    const workspaceLink = c.querySelector('a[href="/workspace/select"]')
    expect(workspaceLink).not.toBeNull()
  })

  it("shows Navbar layout for public routes", async () => {
    signOut()
    const c = await renderPageLayout()
    const sidebar = c.querySelector('aside[aria-label="Student portal navigation"]')
    expect(sidebar).toBeNull()
    expect(c.textContent).toContain("Home")
  })

  it("does not render StudentLayout for unauthenticated user", async () => {
    signOut()
    const c = await renderPageLayout()
    const sidebar = c.querySelector('aside[aria-label="Student portal navigation"]')
    expect(sidebar).toBeNull()
  })
})

function signIn(role = "STUDENT") {
  localStorage.setItem("srhcodeverse_token", "test-token")
  localStorage.setItem("srhcodeverse_username", "testuser")
  localStorage.setItem("srhcodeverse_role", role)
}

function signOut() {
  localStorage.clear()
  sessionStorage.clear()
}
