/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Courses from "./Courses"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/courseApi", () => ({
  getCourses: vi.fn(async () => ({
    data: [
      {
        slug: "java-basics",
        title: "Java Basics",
        category: "Programming",
        level: "Beginner",
        shortDescription: "Learn core Java fundamentals.",
        lessonCount: 10,
        problemCount: 15,
        estimatedDurationMinutes: 300,
        progressPercent: 0,
        thumbnail: null,
      },
      {
        slug: "react-fundamentals",
        title: "React Fundamentals",
        category: "Frontend",
        level: "Intermediate",
        shortDescription: "Build modern UIs with React.",
        lessonCount: 12,
        problemCount: 8,
        estimatedDurationMinutes: 240,
        progressPercent: 50,
        thumbnail: null,
      },
    ],
  })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

async function renderCourses() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/courses"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Courses />
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

describe("Courses page", () => {
  it("renders course listing with cards", async () => {
    const c = await renderCourses()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Java Basics")
    expect(text).toContain("React Fundamentals")
    expect(text).toContain("Programming")
    expect(text).toContain("Frontend")
    expect(text).toContain("Learn with structure")
  })

  it("shows loading skeleton while fetching", async () => {
    const { getCourses } = await import("../../api/courseApi")
    getCourses.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/courses"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Courses />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })

  it("shows error and retry on API failure", async () => {
    const { getCourses } = await import("../../api/courseApi")
    getCourses.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderCourses()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Unable to load courses")
    expect(text).toContain("Server error")
    expect(text).toContain("Try again")
  })

  it("shows empty state when no courses match filters", async () => {
    const { getCourses } = await import("../../api/courseApi")
    getCourses.mockResolvedValueOnce({ data: [] })

    const c = await renderCourses()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("No matching courses")
  })

  it("applies search filter", async () => {
    const c = await renderCourses()
    const searchInput = container.querySelector("#course-search")
    expect(searchInput).not.toBeNull()

    searchInput.value = "Java"
    act(() => {
      searchInput.dispatchEvent(new Event("input", { bubbles: true }))
    })

    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Java Basics")
  })

  it("renders course cards that link to course detail", async () => {
    const c = await renderCourses()
    const links = Array.from(c.querySelectorAll("a"))
    const hrefs = links.map((a) => a.getAttribute("href"))
    expect(hrefs.some((h) => h === "/courses/java-basics")).toBe(true)
    expect(hrefs.some((h) => h === "/courses/react-fundamentals")).toBe(true)
  })

  it("displays progress bar and stats on course cards", async () => {
    const c = await renderCourses()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Progress")
    expect(text).toContain("Lessons")
    expect(text).toContain("Practice")
    expect(text).toContain("Learning")
  })
})