/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Achievements from "./Achievements"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/achievementApi", () => ({
  getAllAchievements: vi.fn(async () => ({
    data: [
      { code: "FIRST_SOLVE", name: "First Solution", description: "Solve your first problem.", icon: "🔥", earned: true, earnedAt: "2026-01-15", currentProgress: 1, targetProgress: 1 },
      { code: "STREAK_7", name: "Week Warrior", description: "Solve problems 7 days in a row.", icon: "🔥", earned: false, currentProgress: 3, targetProgress: 7 },
      { code: "DSA_MASTER", name: "DSA Master", description: "Solve 20 DSA problems.", icon: "🏆", earned: false, currentProgress: 5, targetProgress: 20 },
    ],
  })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

async function renderAchievements() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/achievements"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Achievements />
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

describe("Achievements page", () => {
  it("renders achievement cards with names and descriptions", async () => {
    const c = await renderAchievements()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("First Solution")
    expect(text).toContain("Solve your first problem.")
    expect(text).toContain("Week Warrior")
    expect(text).toContain("DSA Master")
  })

  it("shows loading skeleton while fetching", async () => {
    const { getAllAchievements } = await import("../../api/achievementApi")
    getAllAchievements.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/achievements"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Achievements />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })

  it("shows error and retry on API failure", async () => {
    const { getAllAchievements } = await import("../../api/achievementApi")
    getAllAchievements.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderAchievements()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Server error")
    expect(text).toContain("Try again")
  })

  it("displays earned and locked states", async () => {
    const c = await renderAchievements()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Earned")
    expect(text).toContain("3/7")
  })

  it("shows progress bar for incomplete achievements", async () => {
    const c = await renderAchievements()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("5/20")
  })

  it("shows empty state when no achievements", async () => {
    const { getAllAchievements } = await import("../../api/achievementApi")
    getAllAchievements.mockResolvedValueOnce({ data: [] })

    const c = await renderAchievements()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("No achievements available")
  })

  it("navigates back to dashboard", async () => {
    const c = await renderAchievements()
    const links = Array.from(c.querySelectorAll("a"))
    const hrefs = links.map((a) => a.getAttribute("href"))
    expect(hrefs).toContain("/dashboard")
  })
})