import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  NOTIFICATION_CATEGORIES,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notificationApi"
import EmptyState from "../../components/common/EmptyState"
import { SkeletonList } from "../../components/common/Skeleton"

const CATEGORY_STYLES = {
  ASSIGNMENT: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  GRADE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  ANNOUNCEMENT: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600",
  SYSTEM: "border-slate-500/30 bg-slate-500/10 text-slate-500",
}

function formatDate(value) {
  if (!value) return "Date unavailable"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [category, setCategory] = useState("ALL")

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const result = await getNotifications()
      setItems(Array.isArray(result.items) ? result.items : [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't load your notifications. Check that the backend is running and try again.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = items.filter((item) => !item.read).length

  const filtered = useMemo(() => {
    if (category === "ALL") return items
    return items.filter((item) => item.category === category)
  }, [items, category])

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId)
      await loadNotifications()
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark this notification as read.")
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      await loadNotifications()
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark all notifications as read.")
    }
  }

  return (
    <main className="cv-premium-page mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 flex flex-col gap-5 rounded-3xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-500">
            Stay on top of your work
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Notifications</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted)]">
            Assignments, grades, announcements and system updates in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)] px-4 py-2.5 text-sm font-semibold">
            {unreadCount} unread
          </span>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={loading || unreadCount === 0}
            className="rounded-xl border border-[var(--cv-border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter notifications by category">
        {NOTIFICATION_CATEGORIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setCategory(entry.id)}
            aria-pressed={category === entry.id}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              category === entry.id
                ? "border-violet-500 bg-violet-500/10 text-violet-600"
                : "border-[var(--cv-border)] text-[var(--cv-muted)] hover:bg-black/5"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadNotifications}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)]">
          <EmptyState
            icon="🔔"
            title={items.length === 0 ? "No notifications yet" : "No matching notifications"}
            description={
              items.length === 0
                ? "Assignment reminders, grades and announcements will appear here."
                : "Try a different category to see more notifications."
            }
            actionLabel={items.length === 0 ? "Browse courses" : undefined}
            actionTo={items.length === 0 ? "/courses" : undefined}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl border bg-[var(--cv-surface)] p-5 transition ${
                item.read ? "border-[var(--cv-border)]" : "border-violet-500/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                        CATEGORY_STYLES[item.category] || CATEGORY_STYLES.SYSTEM
                      }`}
                    >
                      {String(item.category || "SYSTEM").toUpperCase()}
                    </span>
                    {!item.read && (
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                        New
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--cv-muted)]">{item.body}</p>
                  <p className="mt-2 text-xs text-[var(--cv-subtle)]">{formatDate(item.createdAt)}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {item.link && (
                    <Link
                      to={item.link}
                      className="rounded-xl border border-[var(--cv-border)] px-3 py-2 text-xs font-semibold transition hover:bg-black/5"
                    >
                      Open
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item.id)}
                    disabled={item.read}
                    className="rounded-xl border border-[var(--cv-border)] px-3 py-2 text-xs font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.read ? "Read" : "Mark as read"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default Notifications
