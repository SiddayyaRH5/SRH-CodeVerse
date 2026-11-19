/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Dashboard from "./Dashboard"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/dashboardApi", () => ({
  getDashboard: vi.fn(async () => ({ data: { username: "testuser", problemsSolved: 5, forgeStreakCurrent: 3, forgeStreakLongest: 7, rank: 42 } })),
}))
vi.mock("../../api/dailyChallengeApi", () => ({
  getTodaysChallenge: vi.fn(async () => ({ data: { title: "Two Sum", topic: "Arrays", rewardPoints: 10, problemId: 1, solvedToday: false } })),
}))
vi.mock("../../api/achievementApi", () => ({
  getAchievements: vi.fn(async () => ({ data: [{ code: "FIRST", name: "First Solution", description: "Solved first", icon: "🔥" }] })),
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

async function renderDashboard() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Dashboard />
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

describe("Student Dashboard", () => {
  it("renders correctly with authenticated student data", async () => {
    signIn("STUDENT")
    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("YOUR DEVELOPER SPACE")
    expect(text).toContain("Welcome back, testuser")
    expect(text).toContain("Problems solved")
    expect(text).toContain("5")
    expect(text).toContain("Current streak")
    expect(text).toContain("3")
    expect(text).toContain("Community rank")
    expect(text).toContain("#42")
    expect(text).toContain("Daily Forge Challenge")
    expect(text).toContain("Two Sum")
    expect(text).toContain("Achievements")
    expect(text).toContain("First Solution")
  })

  it("shows a loading skeleton while data is being fetched", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Dashboard />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })

  it("shows an error message and retry button on API failure", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("We couldn't load your dashboard")
    expect(text).toContain("Server error")
    expect(text).toContain("Try again")
  })

  it("does not fabricate metrics when data is missing", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: {} })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Problems solved")
    expect(text).toContain("Current streak")
    expect(text).toContain("Community rank")
    // Missing metrics show "—" not "0"
    expect(text).not.toContain("Problems solved 0")
    // Missing username produces neutral welcome (no fabricated name)
    expect(text).toContain("Welcome back")
    expect(text).not.toContain("Welcome back, developer")
  })

  it("displays explicit zero values as zero", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: { username: "zerouser", problemsSolved: 0, forgeStreakCurrent: 0, rank: 0 } })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Welcome back, zerouser")
    // Explicit zero should be displayed, not "—"
    expect(text).toContain("Problems solved")
    expect(text).toContain("Current streak")
    // rank 0 should show as #0 (not "—")
    expect(text).toContain("#0")
  })

  it("handles partial dashboard API response without crashing", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: { username: "partialuser" } })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Welcome back, partialuser")
    expect(text).toContain("Problems solved")
    expect(text).toContain("Current streak")
    expect(text).toContain("Community rank")
    // Missing metrics show "—"
    expect(text).toContain("—")
  })

  it("provides working navigation actions", async () => {
    signIn("STUDENT")
    const c = await renderDashboard()
    const links = Array.from(c.querySelectorAll("a"))
    const hrefs = links.map((a) => a.getAttribute("href"))
    expect(hrefs).toContain("/problems")
    expect(hrefs).toContain("/learning-path")
    expect(hrefs).toContain("/certificates")
  })

  it("shows daily challenge error and retry on API failure", async () => {
    signIn("STUDENT")
    const { getTodaysChallenge } = await import("../../api/dailyChallengeApi")
    getTodaysChallenge.mockRejectedValueOnce(new Error("Network error"))

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Couldn't load today's challenge")
    expect(text).toContain("Try again")
  })

  it("shows achievements error and retry on API failure", async () => {
    signIn("STUDENT")
    const { getAchievements } = await import("../../api/achievementApi")
    getAchievements.mockRejectedValueOnce(new Error("Network error"))

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Couldn't load achievements")
    expect(text).toContain("Try again")
  })

  it("shows empty state for daily challenge when no challenge available", async () => {
    signIn("STUDENT")
    const { getTodaysChallenge } = await import("../../api/dailyChallengeApi")
    getTodaysChallenge.mockResolvedValueOnce({ data: null })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Your next challenge is on its way")
    expect(text).toContain("Explore practice")
  })

  it("shows empty state for achievements when none exist", async () => {
    signIn("STUDENT")
    const { getAchievements } = await import("../../api/achievementApi")
    getAchievements.mockResolvedValueOnce({ data: [] })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Your first achievement is waiting")
    expect(text).toContain("Start solving")
  })

  it("retry invokes the dashboard API again", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderDashboard()
    expect(c.textContent).toContain("We couldn't load your dashboard")

    // Reset the mock to resolve on retry
    getDashboard.mockResolvedValueOnce({ data: { username: "retryuser", problemsSolved: 1, forgeStreakCurrent: 2, rank: 10 } })

    const retryBtn = Array.from(c.querySelectorAll("button")).find((b) =>
      (b.textContent || "").includes("Try again"),
    )
    await act(async () => {
      retryBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(c.textContent).toContain("Welcome back, retryuser")
    expect(getDashboard).toHaveBeenCalledTimes(2)
  })

  it("renders all four statistics cards including longest streak", async () => {
    signIn("STUDENT")
    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Problems solved")
    expect(text).toContain("Current streak")
    expect(text).toContain("Longest streak")
    expect(text).toContain("Community rank")
    expect(text).toContain("5")
    expect(text).toContain("3 days")
    expect(text).toContain("7 days")
    expect(text).toContain("#42")
  })

  it("displays longest streak as unavailable when metric is missing", async () => {
    signIn("STUDENT")
    const { getDashboard } = await import("../../api/dashboardApi")
    getDashboard.mockResolvedValueOnce({ data: { username: "nouser", problemsSolved: 0, forgeStreakCurrent: 0, rank: 0 } })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Longest streak")
    expect(text).toContain("—")
  })

  it("shows solved state for daily challenge without action link", async () => {
    signIn("STUDENT")
    const { getTodaysChallenge } = await import("../../api/dailyChallengeApi")
    getTodaysChallenge.mockResolvedValueOnce({
      data: { title: "Two Sum", topic: "Arrays", rewardPoints: 10, problemId: 1, solvedToday: true },
    })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Solved today")
    // No action link should be present when already solved
    const solveLinks = Array.from(c.querySelectorAll("a")).filter((a) =>
      (a.textContent || "").includes("Solve challenge"),
    )
    expect(solveLinks).toHaveLength(0)
  })

  it("shows daily challenge reward points only when available", async () => {
    signIn("STUDENT")
    const { getTodaysChallenge } = await import("../../api/dailyChallengeApi")
    getTodaysChallenge.mockResolvedValueOnce({
      data: { title: "Two Sum", topic: "Arrays", rewardPoints: 10, problemId: 1, solvedToday: false },
    })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Two Sum")
    expect(text).toContain("Arrays")
    expect(text).toContain("10 points")
  })

  it("shows daily challenge without reward points when unavailable", async () => {
    signIn("STUDENT")
    const { getTodaysChallenge } = await import("../../api/dailyChallengeApi")
    getTodaysChallenge.mockResolvedValueOnce({
      data: { title: "Mystery Challenge", topic: "Strings", problemId: 2, solvedToday: false },
    })

    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Mystery Challenge")
    expect(text).toContain("Strings")
    expect(text).not.toContain("points")
  })

  it("renders achievement items with names and descriptions", async () => {
    signIn("STUDENT")
    const c = await renderDashboard()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("First Solution")
    expect(text).toContain("Solved first")
    const items = c.querySelectorAll(".cv-dashboard-achievement-item")
    expect(items).toHaveLength(1)
  })
})
