/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import CourseDetail from "./CourseDetail"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/courseApi", () => ({
  getCourse: vi.fn(async () => ({
    data: {
      slug: "java-basics",
      title: "Java Basics",
      category: "Programming",
      level: "Beginner",
      detailedDescription: "Learn core Java fundamentals step by step.",
      progressPercent: 30,
      lessonCount: 10,
      problemCount: 15,
      lessons: [
        { id: 1, title: "Introduction", description: "First lesson", completed: true, moduleOrder: 1, moduleName: "Basics", estimatedMinutes: 20 },
        { id: 2, title: "Variables", description: "Working with variables", completed: false, moduleOrder: 1, moduleName: "Basics", estimatedMinutes: 25 },
      ],
      skillsGained: ["Java", "OOP"],
      projects: [],
      resources: [],
    },
  })),
  getCourseProblems: vi.fn(async () => ({ data: [] })),
  updateCourseProgress: vi.fn(async () => ({ data: {} })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

function signIn(role = "STUDENT") {
  localStorage.setItem("srhcodeverse_token", "test-token")
  localStorage.setItem("srhcodeverse_username", "testuser")
  localStorage.setItem("srhcodeverse_role", role)
}

async function renderCourseDetail(slug = "java-basics") {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[`/courses/${slug}`]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/courses/:slug" element={<CourseDetail />} />
                <Route path="/login" element={<div />} />
              </Routes>
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

describe("Course Detail page", () => {
  it("renders course overview with title and description", async () => {
    const c = await renderCourseDetail()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Java Basics")
    expect(text).toContain("Programming")
    expect(text).toContain("Beginner")
    expect(text).toContain("Learn core Java fundamentals step by step")
  })

  it("shows loading skeleton while fetching", async () => {
    const { getCourse } = await import("../../api/courseApi")
    getCourse.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/courses/java-basics"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Routes>
                  <Route path="/courses/:slug" element={<CourseDetail />} />
                </Routes>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.querySelector(".animate-pulse")).not.toBeNull()
  })

  it("shows error state when course not found", async () => {
    const { getCourse } = await import("../../api/courseApi")
    getCourse.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })

    const c = await renderCourseDetail("nonexistent")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Server error")
    expect(text).toContain("Back to courses")
  })

  it("renders lessons with module grouping", async () => {
    const c = await renderCourseDetail()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Introduction")
    expect(text).toContain("Variables")
    expect(text).toContain("Module 1")
  })

  it("retries course loading on Retry button click", async () => {
    const { getCourse } = await import("../../api/courseApi")
    getCourse.mockRejectedValueOnce({ response: { data: { message: "Server error" } } })
    getCourse.mockResolvedValueOnce({ data: { slug: "java-basics", title: "Java Basics", category: "Programming", level: "Beginner", detailedDescription: "Learn Java.", progressPercent: 0, lessonCount: 0, problemCount: 0, lessons: [], skillsGained: [], projects: [], resources: [] } })

    const c = await renderCourseDetail("java-basics")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Server error")

    const retryBtn = container.querySelector('button[type="button"]')
    expect(retryBtn).not.toBeNull()
    expect(retryBtn.textContent).toContain("Retry")

    await act(async () => {
      retryBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(getCourse).toHaveBeenCalledTimes(2)
    const text2 = container.textContent.replace(/\s+/g, " ")
    expect(text2).toContain("Java Basics")
  })

  it("toggles lesson completion", async () => {
    signIn("STUDENT")
    const { updateCourseProgress } = await import("../../api/courseApi")
    updateCourseProgress.mockResolvedValueOnce({ data: {} })

    const _c = await renderCourseDetail()
    const completeBtn = container.querySelector('button[aria-label*="Mark Variables complete"]')
    expect(completeBtn).not.toBeNull()

    act(() => {
      completeBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(updateCourseProgress).toHaveBeenCalledWith("java-basics", 2, true)
  })

  it("shows back navigation to courses", async () => {
    const c = await renderCourseDetail()
    const links = Array.from(c.querySelectorAll("a"))
    const hrefs = links.map((a) => a.getAttribute("href"))
    expect(hrefs).toContain("/courses")
  })

  it("navigates to lesson detail from lesson link", async () => {
    const c = await renderCourseDetail()
    const links = Array.from(c.querySelectorAll("a"))
    const lessonLink = links.find((a) => a.getAttribute("href") === "/courses/java-basics/lessons/2")
    expect(lessonLink).not.toBeNull()
    expect(lessonLink.textContent).toContain("Variables")
  })
})