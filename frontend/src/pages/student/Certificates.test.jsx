/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Certificates from "./Certificates"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"

vi.mock("../../api/problemApi", () => ({
  getProblems: vi.fn(async () => ({
    data: [
      { id: 1, title: "Java Problem 1", topic: "java", solved: true },
      { id: 2, title: "Java Problem 2", topic: "java", solved: true },
      { id: 3, title: "DSA Problem 1", topic: "dsa", solved: true },
    ],
  })),
}))
vi.mock("../../api/profileApi", () => ({
  getProfile: vi.fn(async () => ({ data: { username: "testuser" } })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

async function renderCertificates() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/certificates"]}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Certificates />
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

describe("Certificates page", () => {
  it("renders certificate cards", async () => {
    const c = await renderCertificates()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Java Foundations")
    expect(text).toContain("DSA Problem Solving")
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
        <MemoryRouter initialEntries={["/certificates"]}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <Certificates />
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

    const c = await renderCertificates()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Server error")
    expect(text).toContain("Try again")
  })

  it("shows progress percentage for each certificate", async () => {
    const c = await renderCertificates()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("%")
    expect(text).toContain("matching problems solved")
  })

  it("shows eligible certificates as claimable", async () => {
    const c = await renderCertificates()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Generate Local Certificate")
  })

  it("shows lock state for ineligible certificates", async () => {
    const c = await renderCertificates()
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Solve more problems to unlock")
  })

  it("claims a certificate and marks it issued", async () => {
    const c = await renderCertificates()
    const claimBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent && b.textContent.includes("Generate Local Certificate")
    )
    expect(claimBtn).not.toBeNull()

    act(() => {
      claimBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Local Certificate Preview")
    expect(text).toContain("Print / Save PDF")
  })
})