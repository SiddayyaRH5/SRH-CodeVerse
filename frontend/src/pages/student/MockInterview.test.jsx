/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import MockInterview from "./MockInterview"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

async function renderMockInterview() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/mock-interview"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <MockInterview />
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

describe("Mock Interview", () => {
  it("displays local-only practice disclosure", async () => {
    const c = await renderMockInterview()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("LOCAL PRACTICE ONLY — NOT BACKEND-SCORED")
  })

  it("renders mock interview categories", async () => {
    const c = await renderMockInterview()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Java")
    expect(text).toContain("DSA")
    expect(text).toContain("SQL")
    expect(text).toContain("Spring Boot")
    expect(text).toContain("React")
    expect(text).toContain("HR")
  })

  it("starts an interview session", async () => {
    const c = await renderMockInterview()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Start Interview →")
    expect(text).not.toContain("ROUND COMPLETE")
  })

  it("starts the interview and shows questions", async () => {
    const c = await renderMockInterview()

    const startBtn = Array.from(c.querySelectorAll("button")).find(
      (b) => (b.textContent || "").includes("Start Interview"),
    )
    expect(startBtn).not.toBeNull()

    await act(async () => {
      startBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("QUESTION 1 OF")
    expect(text).not.toContain("ROUND COMPLETE")
  })

  it("selects an answer and advances to next question", async () => {
    const c = await renderMockInterview()

    const startBtn = Array.from(c.querySelectorAll("button")).find(
      (b) => (b.textContent || "").includes("Start Interview"),
    )
    expect(startBtn).not.toBeNull()
    await act(async () => {
      startBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    // Select answer option A for question 1
    const answerBtns = Array.from(c.querySelectorAll("button")).filter(
      (b) => /^[A-D]\./.test(b.textContent || ""),
    )
    expect(answerBtns.length).toBeGreaterThan(0)
    await act(async () => {
      answerBtns[0].dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    // Advance to next question
    const nextBtn = Array.from(c.querySelectorAll("button")).find(
      (b) => (b.textContent || "").includes("Next →"),
    )
    expect(nextBtn).not.toBeNull()
    await act(async () => {
      nextBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("QUESTION 2 OF")
  })

  it("completes the interview and shows score", async () => {
    const c = await renderMockInterview()

    const startBtn = Array.from(c.querySelectorAll("button")).find(
      (b) => (b.textContent || "").includes("Start Interview"),
    )
    expect(startBtn).not.toBeNull()
    await act(async () => {
      startBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    // Answer all 3 Java questions, advancing after each
    for (let i = 0; i < 3; i++) {
      const answerBtns = Array.from(c.querySelectorAll("button")).filter(
        (b) => /^[A-D]\./.test(b.textContent || ""),
      )
      if (answerBtns.length > 0) {
        await act(async () => {
          answerBtns[0].dispatchEvent(new MouseEvent("click", { bubbles: true }))
        })
      }

      const nextBtn = Array.from(c.querySelectorAll("button")).find(
        (b) => (b.textContent || "").includes("Next →"),
      )
      if (nextBtn) {
        await act(async () => {
          nextBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
        })
      }
    }

    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("ROUND COMPLETE")
    expect(text).toContain("%")
  })
})
