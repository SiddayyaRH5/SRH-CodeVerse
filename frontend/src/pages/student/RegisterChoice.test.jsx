/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import Register from "./Register"
import WorkspaceSelect from "../../features/workspace/WorkspaceSelect"
import { AuthProvider } from "../../context/AuthContext"
import { ThemeProvider } from "../../context/ThemeContext"
import { ToastProvider } from "../../context/ToastContext"
// WorkspaceProvider removed.

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container = null
let root = null

function render(element) {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root.render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {element}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )
  })
  return container
}

function clickByText(label) {
  const target = Array.from(container.querySelectorAll("button")).find((node) =>
    (node.textContent || "").replace(/\s+/g, " ").includes(label),
  )
  if (!target) throw new Error(`No button containing "${label}"`)
  act(() => {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
  })
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

describe("Register choice screen", () => {
  it("shows the Student, Professional, Trainer and Organization choices", () => {
    const c = render(<Register />)
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Build your")
    expect(text).toContain("Student")
    expect(text).toContain("Professional")
    expect(text).toContain("Trainer")
    expect(text).toContain("Organization")
    expect(text).toContain("Prototype")
  })

  it("shows the real Student registration form after choosing Student", () => {
    const c = render(<Register />)
    clickByText("Student")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Create Student Account")
    expect(text).toContain("Username")
    expect(text).toContain("Email address")
    expect(text).toContain("Password")
    expect(text).toContain("← Back to account choices")
  })

  it("shows a clearly labelled Professional prototype form", () => {
    const c = render(<Register />)
    clickByText("Professional")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Professional registration is a frontend prototype")
    expect(text).toContain("Professional category")
    expect(text).toContain("Company employee")
    expect(text).toContain("Freelancer")
    expect(text).toContain("Independent developer")
  })

  it("shows a clearly labelled Trainer prototype form", () => {
    const c = render(<Register />)
    clickByText("Trainer")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Trainer registration is a frontend prototype")
    expect(text).toContain("Organization invitation code (optional)")
  })

  it("shows the organization application flow", () => {
    const c = render(<Register />)
    clickByText("Organization")
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Organization registration is an application flow")
    expect(text).toContain("Organization name")
    expect(text).toContain("Official email")
    expect(text).toContain("Reason for joining")
  })

  it("returns to the choice screen from a prototype form", () => {
    const c = render(<Register />)
    clickByText("Professional")
    expect(c.textContent).toContain("Professional registration is a frontend prototype")
    clickByText("← Back to account choices")
    expect(c.textContent).toContain("Choose the account type")
  })

  it("shows the approval message after a valid organization application", () => {
    const c = render(<Register />)
    clickByText("Organization")
    const inputs = Array.from(c.querySelectorAll("input, select, textarea"))
    const set = (name, value) => {
      const el = inputs.find((i) => i.previousElementSibling?.textContent?.includes(name) || i.getAttribute("placeholder")?.includes(name))
      if (el) {
        const proto = Object.getPrototypeOf(el)
        const setter = Object.getOwnPropertyDescriptor(proto, "value").set
        setter.call(el, value)
        el.dispatchEvent(new Event("input", { bubbles: true }))
        el.dispatchEvent(new Event("change", { bubbles: true }))
      }
    }
    set("Organization name", "Acme Corp")
    set("Official email", "contact@acme.test")
    set("Contact person", "Jane Doe")
    set("Contact number", "+1 555 0100")
    // select organization type
    const selects = Array.from(c.querySelectorAll("select"))
    if (selects[0]) {
      const proto = Object.getPrototypeOf(selects[0])
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set
      setter.call(selects[0], "Company")
      selects[0].dispatchEvent(new Event("change", { bubbles: true }))
    }
    set("Reason for joining", "We want to train our team.")
    const form = c.querySelector("form")
    act(() => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    })
    expect(c.textContent).toContain("Your organization application has been submitted and is awaiting Super Admin approval.")
  })
})

describe("WorkspaceSelect", () => {
  it("renders available workspaces for a STUDENT account", () => {
    localStorage.setItem("srhcodeverse_token", "test-token")
    localStorage.setItem("srhcodeverse_username", "demo.student")
    localStorage.setItem("srhcodeverse_role", "STUDENT")
    const c = render(<WorkspaceSelect />)
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Choose your")
    expect(text).toContain("workspace")
    expect(text).toContain("demo.student")
    expect(text).toContain("Student workspace")
    expect(text).toContain("Return to CodeVerse")
  })

  it("shows the demo-preview workspaces only when preview is enabled", () => {
    localStorage.setItem("srhcodeverse_token", "test-token")
    localStorage.setItem("srhcodeverse_username", "demo.student")
    localStorage.setItem("srhcodeverse_role", "STUDENT")
    sessionStorage.setItem("srhcodeverse_workspace_demo_preview", "true")
    const c = render(<WorkspaceSelect />)
    const text = c.textContent.replace(/\s+/g, " ")
    expect(text).toContain("Student workspace")
    expect(text).toContain("Professional workspace")
    expect(text).toContain("Demo preview")
  })
})
