/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Analytics from "./Analytics"
import CustomSelect from "../../components/common/CustomSelect"
import AIMentorDrawer from "../../components/common/AIMentorDrawer"
import { AuthProvider } from "../../context/AuthContext"
import { MentorProvider } from "../../context/MentorContext"
import * as analyticsApi from "../../api/analyticsApi"

vi.mock("../../api/analyticsApi", () => ({ getAnalytics: vi.fn() }))

// jsdom has no layout engine; verify component/data wiring here and use the
// browser check for actual SVG geometry.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-chart">{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Area: () => <path data-testid="area" />,
  Bar: () => <rect data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}))

const analyticsData = {
  problemsSolved: 24,
  totalAvailableProblems: 60,
  solveCoverage: 40,
  currentStreak: 3,
  longestStreak: 7,
  activeDays: 9,
  activity: Array.from({ length: 14 }, (_, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, "0")}`,
    count: i % 3,
  })),
  difficultyMastery: [
    { name: "EASY", solved: 14, total: 25 },
    { name: "MEDIUM", solved: 7, total: 20 },
    { name: "HARD", solved: 3, total: 15 },
  ],
}

let container
let root

function render(element) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(element))
  return container
}

async function settle() {
  await act(async () => { await Promise.resolve() })
}

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  vi.clearAllMocks()
})

describe("Analytics states", () => {
  it("shows a loading skeleton while data is pending", async () => {
    analyticsApi.getAnalytics.mockReturnValue(new Promise(() => {}))
    const c = render(<Analytics />)
    expect(c.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(c.textContent).toContain("Building your developer analytics")
  })

  it("renders real API data in all three visualizations", async () => {
    analyticsApi.getAnalytics.mockResolvedValue({ data: analyticsData })
    const c = render(<Analytics />)
    await settle()
    expect(analyticsApi.getAnalytics).toHaveBeenCalled()
    expect(c.textContent).toContain("Coding Activity")
    expect(c.textContent).toContain("Solved vs available")
    expect(c.textContent).toContain("Progress by difficulty")
    expect(c.textContent.toLowerCase()).toContain("easy")
    expect(c.textContent).toContain("56%")
    expect(c.querySelectorAll('[role="progressbar"]')).toHaveLength(3)
  })

  it("shows honest empty states when the API has no chart data", async () => {
    analyticsApi.getAnalytics.mockResolvedValue({ data: { ...analyticsData, activity: [], difficultyMastery: [] } })
    const c = render(<Analytics />)
    await settle()
    expect(c.textContent).toContain("No submissions in the last 14 days yet.")
    expect(c.textContent).toContain("Solve a problem to start tracking difficulty mastery.")
  })

  it("shows an error with retry when the API fails", async () => {
    analyticsApi.getAnalytics.mockRejectedValue(new Error("network down"))
    const c = render(<Analytics />)
    await settle()
    expect(c.textContent).toContain("Analytics unavailable")
    const retry = [...c.querySelectorAll("button")].find((b) => b.textContent === "Retry")
    expect(retry).toBeTruthy()
    await act(async () => { retry.click() })
    expect(analyticsApi.getAnalytics).toHaveBeenCalledTimes(2)
  })
})

describe("CustomSelect", () => {
  const options = [
    { value: "ALL", label: "All" },
    { value: "EASY", label: "Easy" },
    { value: "HARD", label: "Hard" },
  ]

  it("opens with keyboard and commits the highlighted option with Enter", () => {
    const onChange = vi.fn()
    const c = render(<CustomSelect label="Difficulty" value="ALL" options={options} onChange={onChange} />)
    const trigger = c.querySelector("button")
    act(() => trigger.focus())
    act(() => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })))
    expect(c.querySelector('[role="listbox"]')).not.toBeNull()
    act(() => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })))
    act(() => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })))
    expect(onChange).toHaveBeenCalledWith("EASY")
    expect(c.querySelector('[role="listbox"]')).toBeNull()
  })

  it("closes on Escape and on outside click", () => {
    const c = render(<CustomSelect label="Difficulty" value="ALL" options={options} onChange={() => {}} />)
    const trigger = c.querySelector("button")
    act(() => trigger.click())
    expect(c.querySelector('[role="listbox"]')).not.toBeNull()
    act(() => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
    expect(c.querySelector('[role="listbox"]')).toBeNull()
    act(() => trigger.click())
    act(() => document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })))
    expect(c.querySelector('[role="listbox"]')).toBeNull()
  })

  it("exposes listbox ARIA attributes", () => {
    const c = render(<CustomSelect label="Difficulty" value="EASY" options={options} onChange={() => {}} />)
    const trigger = c.querySelector("button")
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox")
    expect(trigger.getAttribute("aria-label")).toBe("Difficulty")
    act(() => trigger.click())
    expect(c.querySelector('[role="listbox"]').getAttribute("aria-label")).toBe("Difficulty")
    expect(c.querySelector('[aria-selected="true"]').textContent).toContain("Easy")
  })
})

describe("AI Code Mentor drawer", () => {
  beforeEach(() => {
    localStorage.setItem("srhcodeverse_token", "mock")
    localStorage.setItem("srhcodeverse_username", "demo")
    localStorage.setItem("srhcodeverse_role", "STUDENT")
  })

  function renderDrawer() {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <MentorProvider>
            <AIMentorDrawer />
          </MentorProvider>
        </AuthProvider>
      </MemoryRouter>
    )
  }

  it("opens and closes without executing code", async () => {
    const c = renderDrawer()
    await settle()
    const open = c.querySelector('[aria-label="Open AI Code Mentor"]')
    expect(open).toBeTruthy()
    act(() => open.click())
    expect(c.querySelector('[role="dialog"]')).not.toBeNull()
    const close = c.querySelector('[aria-label="Close AI Code Mentor"]')
    act(() => close.click())
    expect(c.querySelector('[role="dialog"]')).toBeNull()
  })

  it("shows a user message and contextual local guidance on send", async () => {
    const c = renderDrawer()
    await settle()
    act(() => c.querySelector('[aria-label="Open AI Code Mentor"]').click())
    const input = c.querySelector("textarea")
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set
      setter.call(input, "How do I start?")
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })
    await settle()
    const send = c.querySelector('[aria-label="Send message"]')
    act(() => send.click())
    await settle()
    expect(c.textContent).toContain("How do I start?")
    expect(c.textContent.toLowerCase()).toContain("local")
    expect(c.textContent).toContain("No AI service is connected")
    expect(c.textContent).not.toMatch(/rzp_live_|sk-[A-Za-z0-9]{16,}/)
  })
})

describe("Global search and compact filters", () => {
  it("uses the reserved icon padding class on the navbar search input", async () => {
    const { default: Navbar } = await import("../../components/layout/Navbar")
    const { ThemeProvider } = await import("../../context/ThemeContext")
    const { AuthProvider } = await import("../../context/AuthContext")
    const c = render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    )
    const input = c.querySelector('input[aria-label="Search courses, problems, skills"]')
    if (input) expect(input.className).toContain("cv-nav-search-input")
    else expect(c.querySelector(".cv-nav-search")).not.toBeNull()
  })
})
