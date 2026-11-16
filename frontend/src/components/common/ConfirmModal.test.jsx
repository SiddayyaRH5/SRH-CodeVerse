/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import ConfirmModal from "./ConfirmModal"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("ConfirmModal", () => {
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

  it("renders nothing when closed", () => {
    act(() => {
      root.render(<ConfirmModal open={false} title="Delete" message="Sure?" onConfirm={() => {}} onCancel={() => {}} />)
    })
    expect(container.textContent).toBe("")
  })

  it("renders title, message and buttons when open", () => {
    act(() => {
      root.render(<ConfirmModal open title="Delete problem" message="This cannot be undone." onConfirm={() => {}} onCancel={() => {}} />)
    })
    expect(container.textContent).toContain("Delete problem")
    expect(container.textContent).toContain("This cannot be undone.")
    expect(container.textContent).toContain("Cancel")
    expect(container.textContent).toContain("Confirm")
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect(container.querySelector('[aria-modal="true"]')).not.toBeNull()
  })

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn()
    act(() => {
      root.render(<ConfirmModal open title="Delete" message="Sure?" onConfirm={() => {}} onCancel={onCancel} />)
    })
    const cancel = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Cancel")
    act(() => {
      cancel.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("calls onConfirm when Confirm is clicked", () => {
    const onConfirm = vi.fn()
    act(() => {
      root.render(<ConfirmModal open title="Delete" message="Sure?" onConfirm={onConfirm} onCancel={() => {}} />)
    })
    const confirm = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Confirm")
    act(() => {
      confirm.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("disables buttons and shows a spinner while loading", () => {
    const onConfirm = vi.fn()
    act(() => {
      root.render(<ConfirmModal open title="Delete" message="Sure?" loading onConfirm={onConfirm} onCancel={() => {}} />)
    })
    const buttons = Array.from(container.querySelectorAll("button"))
    buttons.forEach((button) => expect(button.disabled).toBe(true))
    expect(container.textContent).toContain("Working...")
    // Confirm should not fire while loading.
    const confirm = buttons.find((b) => b.textContent.includes("Working..."))
    act(() => {
      confirm.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("closes on Escape", () => {
    const onCancel = vi.fn()
    act(() => {
      root.render(<ConfirmModal open title="Delete" message="Sure?" onConfirm={() => {}} onCancel={onCancel} />)
    })
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    })
    expect(onCancel).toHaveBeenCalled()
  })
})
