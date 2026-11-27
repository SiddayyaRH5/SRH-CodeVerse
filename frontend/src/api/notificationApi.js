import axiosInstance from "./axiosInstance"

export const NOTIFICATION_CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "ASSIGNMENT", label: "Assignments" },
  { id: "GRADE", label: "Grades" },
  { id: "ANNOUNCEMENT", label: "Announcements" },
  { id: "SYSTEM", label: "System" },
]

/** Returns only notifications persisted by the authenticated user's account. */
export async function getNotifications() {
  const response = await axiosInstance.get("/notifications")
  const payload = response?.data
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []

  return { items, source: "server" }
}

export async function markNotificationRead(notificationId) {
  return axiosInstance.post(`/notifications/${notificationId}/read`)
}

export async function markAllNotificationsRead() {
  return axiosInstance.post("/notifications/read-all")
}
