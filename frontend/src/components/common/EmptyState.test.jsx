/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import EmptyState from "./EmptyState"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("EmptyState", () => {
  let container
  let root

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it("renders title and description", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <EmptyState title="No submissions yet" description="Submit a solution to see it here." />
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain("No submissions yet")
    expect(container.textContent).toContain("Submit a solution to see it here.")
  })

  it("renders an action link when actionTo and actionLabel are provided", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <EmptyState title="No courses" actionLabel="Browse courses" actionTo="/courses" />
        </MemoryRouter>,
      )
    })
    const link = container.querySelector("a")
    expect(link).not.toBeNull()
    expect(link.getAttribute("href")).toBe("/courses")
    expect(link.textContent).toContain("Browse courses")
  })

  it("renders no action when none is provided", () => {
    act(() => {
      root.render(<EmptyState title="Nothing here" />)
    })
    expect(container.querySelector("a")).toBeNull()
  })

  it("renders custom action element", () => {
    act(() => {
      root.render(
        <EmptyState title="Empty" action={<button type="button">Custom action</button>} />,
      )
    })
    expect(container.textContent).toContain("Custom action")
  })
})
