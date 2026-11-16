/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import ErrorBoundary from "../../components/common/ErrorBoundary"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let bombActive = true

function Bomb() {
  if (bombActive) throw new Error("boom")
  return <span>recovered</span>
}

describe("ErrorBoundary", () => {
  let container
  let root

  beforeEach(() => {
    bombActive = true
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it("renders children when nothing throws", () => {
    act(() => {
      root.render(
        <ErrorBoundary>
          <span>healthy</span>
        </ErrorBoundary>,
      )
    })
    expect(container.textContent).toContain("healthy")
  })

  it("shows a branded fallback when a child throws", () => {
    act(() => {
      root.render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      )
    })
    expect(container.textContent).toContain("Something went wrong")
    expect(container.textContent).toContain("Try again")
    expect(container.textContent).toContain("Return to home")
    expect(container.textContent).toContain("boom")
  })

  it("recovers when retry is clicked", () => {
    act(() => {
      root.render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      )
    })
    // Disarm the bomb so the retry re-render succeeds.
    bombActive = false

    const retry = Array.from(container.querySelectorAll("button")).find((node) =>
      (node.textContent || "").includes("Try again"),
    )
    act(() => {
      retry.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })

    expect(container.textContent).toContain("recovered")
  })

  it("logs diagnostics without leaking tokens", () => {
    act(() => {
      root.render(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      )
    })
    const spy = console.error
    expect(spy).toHaveBeenCalled()
    const payload = spy.mock.calls.find((call) => call[1] && typeof call[1] === "object")?.[1]
    expect(payload).toBeTruthy()
    expect(payload).not.toHaveProperty("token")
    expect(payload).not.toHaveProperty("password")
  })
})
