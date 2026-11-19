/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import CourseLessonDetail from "./CourseLessonDetail"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/courseApi", () => ({
  getCourse: vi.fn(async () => ({
    data: {
      slug: "java-basics",
      title: "Java Basics",
      lessons: [
        { id: 1, title: "Introduction", description: "First lesson", completed: true, moduleOrder: 1, moduleName: "Basics", estimatedMinutes: 20, lessonContent: "Welcome to Java.", codeExample: null, exercise: null, quiz: null, videoUrl: "" },
        { id: 2, title: "Variables", description: "Working with variables", completed: false, moduleOrder: 1, moduleName: "Basics", estimatedMinutes: 25, lessonContent: "Learn about variables.", codeExample: "int x = 5;", exercise: "Declare a variable.", quiz: null, videoUrl: "" },
      ],
    },
  })),
  updateCourseProgress: vi.fn(async () => ({ data: {} })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

async function renderLessonDetail(lessonId = "2") {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[`/courses/java-basics/lessons/${lessonId}`]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/courses/:slug/lessons/:lessonId" element={<CourseLessonDetail />} />
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

describe("Course Lesson Detail page", () => {
  it("renders lesson title and content", async () => {
    const c = await renderLessonDetail()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Variables")
    expect(text).toContain("Learn about variables.")
    expect(text).toContain("Java Basics")
  })

  it("shows loading state while fetching", async () => {
    const { getCourse } = await import("../../api/courseApi")
    getCourse.mockImplementation(() => new Promise(() => {}))

    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/courses/java-basics/lessons/2"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Routes>
                  <Route path="/courses/:slug/lessons/:lessonId" element={<CourseLessonDetail />} />
                </Routes>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MemoryRouter>,
      )
    })

    expect(container.textContent).toContain("Loading lesson")
  })

  it("shows error when lesson not found", async () => {
    const { getCourse } = await import("../../api/courseApi")
    getCourse.mockResolvedValueOnce({ data: { slug: "java-basics", title: "Java Basics", lessons: [] } })

    const c = await renderLessonDetail("999")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Lesson not found")
    expect(text).toContain("Back to course")
  })

  it("shows previous and next lesson navigation", async () => {
    const _c = await renderLessonDetail("2")
    const text = _c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Previous lesson")
    expect(text).toContain("Introduction")
    expect(text).not.toContain("Next lesson")
  })

  it("marks lesson as completed", async () => {
    const { updateCourseProgress } = await import("../../api/courseApi")
    updateCourseProgress.mockResolvedValueOnce({ data: {} })

    const _c = await renderLessonDetail("2")
    const markBtn = container.querySelector('button:not([disabled])')
    expect(markBtn).not.toBeNull()
    expect(markBtn.textContent).toContain("Mark as Completed")

    act(() => {
      markBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(updateCourseProgress).toHaveBeenCalledWith("java-basics", 2, true)
  })

  it("shows lesson as already completed when applicable", async () => {
    const c = await renderLessonDetail("1")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Completed")
  })

  it("renders code example when available", async () => {
    const _c = await renderLessonDetail("2")
    const text = _c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Code Example")
    expect(text).toContain("int x = 5;")
  })

  it("navigates back to course", async () => {
    const c = await renderLessonDetail()
    const links = Array.from(c.querySelectorAll("a"))
    const hrefs = links.map((a) => a.getAttribute("href"))
    expect(hrefs).toContain("/courses/java-basics")
  })
})