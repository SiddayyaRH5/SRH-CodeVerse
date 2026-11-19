/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import FadeIn from "../../components/common/FadeIn"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("PageContainer", () => {
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

  it("renders children with the standard max-width container", () => {
    act(() => {
      root.render(<PageContainer>Hello foundation</PageContainer>)
    })
    expect(container.textContent).toContain("Hello foundation")
    const wrapper = container.firstChild
    expect(wrapper.className).toContain("max-w-7xl")
    expect(wrapper.className).toContain("mx-auto")
  })

  it("supports a custom element via the `as` prop", () => {
    act(() => {
      root.render(<PageContainer as="section">Section content</PageContainer>)
    })
    expect(container.querySelector("section")).not.toBeNull()
    expect(container.textContent).toContain("Section content")
  })

  it("merges custom className", () => {
    act(() => {
      root.render(<PageContainer className="extra-class">x</PageContainer>)
    })
    expect(container.firstChild.className).toContain("extra-class")
  })
})

describe("PageHeader", () => {
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

  it("renders kicker, title and description", () => {
    act(() => {
      root.render(
        <PageHeader kicker="DASHBOARD" title="Welcome" description="Your learning overview." />,
      )
    })
    expect(container.textContent).toContain("DASHBOARD")
    expect(container.textContent).toContain("Welcome")
    expect(container.textContent).toContain("Your learning overview.")
  })

  it("renders actions slot", () => {
    act(() => {
      root.render(
        <PageHeader title="Courses" actions={<button type="button">Add course</button>} />,
      )
    })
    expect(container.textContent).toContain("Add course")
  })

  it("renders nothing extra when optional props are omitted", () => {
    act(() => {
      root.render(<PageHeader />)
    })
    expect(container.querySelector("h1")).toBeNull()
  })
})

describe("FadeIn", () => {
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

  it("renders children", () => {
    act(() => {
      root.render(<FadeIn>Animated content</FadeIn>)
    })
    expect(container.textContent).toContain("Animated content")
  })

  it("starts visible when immediate is set", () => {
    act(() => {
      root.render(<FadeIn immediate>Fade now</FadeIn>)
    })
    expect(container.firstChild.className).toContain("opacity-100")
  })

  it("respects prefers-reduced-motion by revealing immediately", () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = () => ({ matches: true, media: "", onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false } })

    act(() => {
      root.render(<FadeIn>Reduced motion content</FadeIn>)
    })
    expect(container.firstChild.className).toContain("opacity-100")

    window.matchMedia = originalMatchMedia
  })
})
