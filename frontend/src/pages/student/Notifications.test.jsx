/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Notifications from "./Notifications"

vi.mock("../../api/notificationApi", () => ({
  NOTIFICATION_CATEGORIES: [
    { id: "ALL", label: "All" },
    { id: "ASSIGNMENT", label: "Assignments" },
    { id: "GRADE", label: "Grades" },
    { id: "ANNOUNCEMENT", label: "Announcements" },
    { id: "SYSTEM", label: "System" },
  ],
  NOTIFICATION_PREVIEW: "preview",
  getNotifications: vi.fn(async () => ({
    items: [
      { id: "preview-1", category: "ASSIGNMENT", title: "Sample assignment notification", body: "body", createdAt: "2026-01-15T12:00:00Z", read: false },
      { id: "preview-2", category: "GRADE", title: "Sample grading notification", body: "body", createdAt: "2026-01-14T09:30:00Z", read: true },
      { id: "preview-3", category: "ANNOUNCEMENT", title: "Sample announcement notification", body: "body", createdAt: "2026-01-13T08:00:00Z", read: false },
    ],
    source: "preview",
  })),
  markNotificationRead: vi.fn(async () => ({ persisted: false })),
  markAllNotificationsRead: vi.fn(async () => ({ persisted: false })),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe("Notifications", () => {
  let container
  let root

  beforeEach(() => {
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

  it("renders the notification center with preview data banner", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Notifications")
    expect(container.textContent).toContain("Preview data")
    expect(container.textContent).toContain("sample records")
    expect(container.textContent).toContain("Sample assignment notification")
  })

  it("filters by category", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
    const gradeButton = Array.from(container.querySelectorAll("button")).find((b) =>
      (b.textContent || "").trim() === "Grades",
    )
    act(() => {
      gradeButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Sample grading notification")
  })

  it("marks a notification as read locally", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
    const markButton = Array.from(container.querySelectorAll("button")).find((b) =>
      (b.textContent || "").trim() === "Mark as read",
    )
    act(() => {
      markButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Read")
  })

  it("shows an empty state when no notifications match", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
    // Filter to a category with no preview items by toggling all categories
    // (preview has ASSIGNMENT, GRADE, ANNOUNCEMENT). SYSTEM has none.
    const systemButton = Array.from(container.querySelectorAll("button")).find((b) =>
      (b.textContent || "").trim() === "System",
    )
    act(() => {
      systemButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.textContent).toContain("No matching notifications")
  })
})
