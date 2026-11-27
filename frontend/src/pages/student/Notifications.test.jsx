/**
 * @vitest-environment jsdom
 */
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Notifications from "./Notifications"
import * as notificationApi from "../../api/notificationApi"

vi.mock("../../api/notificationApi", () => ({
  NOTIFICATION_CATEGORIES: [
    { id: "ALL", label: "All" },
    { id: "ASSIGNMENT", label: "Assignments" },
    { id: "GRADE", label: "Grades" },
    { id: "ANNOUNCEMENT", label: "Announcements" },
    { id: "SYSTEM", label: "System" },
  ],
  getNotifications: vi.fn(async () => ({
    items: [
      { id: "1", category: "ASSIGNMENT", title: "Assignment reminder", body: "body", createdAt: "2026-01-15T12:00:00Z", read: false },
      { id: "2", category: "GRADE", title: "Grade posted", body: "body", createdAt: "2026-01-14T09:30:00Z", read: true },
      { id: "3", category: "ANNOUNCEMENT", title: "Semester update", body: "body", createdAt: "2026-01-13T08:00:00Z", read: false },
    ],
    source: "server",
  })),
  markNotificationRead: vi.fn(async () => ({})),
  markAllNotificationsRead: vi.fn(async () => ({})),
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

  it("renders persisted notifications without a preview banner", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Notifications")
    expect(container.textContent).not.toContain("Preview data")
    expect(container.textContent).toContain("Assignment reminder")
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
    expect(container.textContent).toContain("Grade posted")
  })

  it("calls the backend to mark a notification as read", async () => {
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
    await act(async () => {
      markButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }))
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(notificationApi.markNotificationRead).toHaveBeenCalledWith("1")
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
