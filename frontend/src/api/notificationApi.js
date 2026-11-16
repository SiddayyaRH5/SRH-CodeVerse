import axiosInstance from "./axiosInstance"

/**
 * FRONTEND-ONLY ADAPTER — the SRH CodeVerse backend does not expose a
 * notifications endpoint yet.
 *
 * Proposed backend contract (to be implemented in a later backend phase):
 *   GET    /api/notifications            -> { "items": Notification[] }
 *   POST   /api/notifications/{id}/read  -> 204 No Content
 *   POST   /api/notifications/read-all   -> 204 No Content
 *
 * Notification shape:
 *   { "id": "notification-1", "category": "ASSIGNMENT|GRADE|ANNOUNCEMENT|SYSTEM",
 *     "title": "...", "body": "...", "createdAt": "2026-01-15T12:00:00Z",
 *     "read": false, "link": "/assignments/1" }
 *
 * Until the endpoint exists the adapter falls back to an explicitly labelled
 * local preview. Preview data is never persisted to the server and the UI
 * always states that it is sample content.
 */
export const NOTIFICATION_PREVIEW = "preview"

export const NOTIFICATION_CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "ASSIGNMENT", label: "Assignments" },
  { id: "GRADE", label: "Grades" },
  { id: "ANNOUNCEMENT", label: "Announcements" },
  { id: "SYSTEM", label: "System" },
]

const PREVIEW_ITEMS = [
  {
    id: "preview-1",
    category: "ASSIGNMENT",
    title: "Sample assignment notification",
    body: "This is sample content shown because the notifications endpoint is not implemented yet.",
    createdAt: "2026-01-15T12:00:00Z",
    read: false,
    link: null,
  },
  {
    id: "preview-2",
    category: "GRADE",
    title: "Sample grading notification",
    body: "This is sample content shown because the notifications endpoint is not implemented yet.",
    createdAt: "2026-01-14T09:30:00Z",
    read: true,
    link: null,
  },
  {
    id: "preview-3",
    category: "ANNOUNCEMENT",
    title: "Sample announcement notification",
    body: "This is sample content shown because the notifications endpoint is not implemented yet.",
    createdAt: "2026-01-13T08:00:00Z",
    read: false,
    link: null,
  },
]

export async function getNotifications() {
  try {
    const response = await axiosInstance.get("/notifications")
    const payload = response?.data
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : []

    return { items, source: "server" }
  } catch (error) {
    const status = error?.response?.status
    if (status === 404 || status === 405 || status === 501) {
      return { items: PREVIEW_ITEMS.map((item) => ({ ...item })), source: NOTIFICATION_PREVIEW }
    }
    throw error
  }
}

/**
 * Marks a notification as read. With no backend endpoint this only updates the
 * in-memory list — it is never persisted to the server.
 */
export async function markNotificationRead(notificationId) {
  return { id: notificationId, persisted: false }
}

export async function markAllNotificationsRead() {
  return { persisted: false }
}
