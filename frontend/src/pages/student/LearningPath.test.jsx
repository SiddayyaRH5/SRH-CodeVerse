/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import LearningPath from "./LearningPath"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/problemApi", () => ({
  getProblems: vi.fn(async () => ({
    data: [
      { id: 1, title: "Java Problem 1", topic: "java", solved: true },
      { id: 2, title: "Java Problem 2", topic: "java", solved: false },
      { id: 3, title: "DSA Problem 1", topic: "dsa", solved: true },
    ],
  })),
}))
vi.mock("../../api/dashboardApi", () => ({
  getDashboard: vi.fn(async () => ({ data: { forgeStreakCurrent: 5 } })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

async function renderLearningPath() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/learning-path"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <LearningPath />
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

describe("Learning Path page", () => {
  it("renders learning path stages", async () => {
    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Java Foundations")
    expect(text).toContain("DSA & Problem Solving")
    expect(text).toContain("SQL & Databases")
    expect(text).toContain("Spring Boot Backend")
    expect(text).toContain("Full-Stack Builder")
  })

  it("shows loading skeleton while fetching", async () => {
    const { getProblems } = await import("../../api/problemApi")
    getProblems.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/learning-path"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <LearningPath />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })

  it("shows error and retry on API failure", async () => {
    const { getProblems } = await import("../../api/problemApi")
    getProblems.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Server error")
    expect(text).toContain("Try again")
  })

  it("displays progress coverage per stage", async () => {
    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("% coverage")
    expect(text).toContain("solved")
  })

  it("shows current streak from dashboard", async () => {
    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Current streak")
    expect(text).toContain("5")
  })

  it("displays explicit zero streak", async () => {
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: { forgeStreakCurrent: 0 } })

    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Current streak")
    expect(text).toContain("0")
  })

  it("displays dash for missing dashboard response", async () => {
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: {} })

    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Current streak")
    expect(text).toContain("—")
  })

  it("displays dash for null streak value", async () => {
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: { forgeStreakCurrent: null } })

    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Current streak")
    expect(text).toContain("—")
  })

  it("displays positive streak value", async () => {
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: { forgeStreakCurrent: 5 } })

    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Current streak")
    expect(text).toContain("5")
  })

  it("links to problems and certificates", async () => {
    const c = await renderLearningPath()
    const links = Array.from(c.querySelectorAll("a"))
    const hrefs = links.map((a) => a.getAttribute("href"))
    expect(hrefs).toContain("/problems")
    expect(hrefs).toContain("/certificates")
  })

  it("distinguishes completed and not started stages", async () => {
    const c = await renderLearningPath()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Stage 1")
    expect(text).toContain("Stage 2")
  })
})