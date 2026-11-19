/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import StudyHub from "./StudyHub"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/dashboardApi", () => ({
  getDashboard: vi.fn(async () => ({ data: { problemsSolved: 5 } })),
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

async function renderStudyHub() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/study-hub"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <StudyHub />
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

describe("StudyHub", () => {
  it("renders the study hub with student data", async () => {
    signIn("STUDENT")
    const c = await renderStudyHub()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Study Hub")
    expect(text).toContain("Weekly Forge Goal")
    expect(text).toContain("Saved Problems")
    expect(text).toContain("Problem Notes")
    expect(text).toContain("Java Quick Snippets")
  })

  it("shows loading skeleton while fetching", async () => {
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/study-hub"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <StudyHub />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })

  it("shows error and retry on API failure", async () => {
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderStudyHub()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Unable to load dashboard")
    expect(text).toContain("Try again")
  })

  it("displays explicit zero values as zero", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: { problemsSolved: 0 } })

    const c = await renderStudyHub()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("0 / 5 target")
  })

  it("displays unavailable state when metric is missing", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: {} })

    const c = await renderStudyHub()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("— / 5 target")
  })

  it("retries dashboard API on retry click", async () => {
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })
    getDashboard.mockResolvedValueOnce({ data: { problemsSolved: 10 } })

    const c = await renderStudyHub()
    expect(c.textContent).toContain("Unable to load dashboard")

    const retryBtn = Array.from(c.querySelectorAll("button")).find((b) =>
      (b.textContent || "").includes("Try again"),
    )
    expect(retryBtn).not.toBeNull()

    await act(async () => {
      retryBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(getDashboard).toHaveBeenCalledTimes(2)
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("10 / 5 target")
  })

  it("renders saved problems bookmarks", async () => {
    signIn("STUDENT")
    const c = await renderStudyHub()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Saved Problems")
  })

  it("renders problem notes section", async () => {
    signIn("STUDENT")
    const c = await renderStudyHub()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Problem Notes")
  })
})