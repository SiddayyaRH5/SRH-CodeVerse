import { useEffect, useState } from "react"
import { getAnnouncements } from "../../api/announcementApi"

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnnouncements()
      .then((res) => setAnnouncements(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="cv-panel animate-pulse h-64" />

  return (
    <div className="cv-page">
      <div className="flex flex-col lg:flex-row justify-between gap-5 items-start lg:items-end">
        <div>
          <p className="cv-kicker">ANNOUNCEMENTS</p>
          <h1 className="text-4xl sm:text-5xl font-black mt-2">Announcements</h1>
          <p className="text-[var(--cv-muted)] mt-3 max-w-2xl">
            Updates for your selected learning organization.
          </p>
        </div>
        <div className="cv-pill">📢 {announcements.length} new</div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-8">
        {announcements.map((announcement, _index) => (
          <div
            key={announcement.id}
            className="cv-panel overflow-hidden rounded-lg border border-[var(--cv-border)] p-4 hover:border-violet-500/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">📢</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mt-1">{announcement.title}</h3>
                <p className="text-sm text-[var(--cv-muted)] mt-1">
                  {announcement.audience} · {announcement.author}
                </p>
                <p className="text-xs text-[var(--cv-muted)] mt-1">{announcement.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!announcements.length && (
        <div className="mt-8 text-center">
          <p className="text-[var(--cv-muted)]">No announcements for your organization.</p>
        </div>
      )}
    </div>
  )
}