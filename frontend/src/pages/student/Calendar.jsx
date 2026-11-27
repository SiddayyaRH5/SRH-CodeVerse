import { useEffect, useState } from "react"

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch calendar events from the API
    // For demo purposes, we'll use pre-existing data or mock data
    setLoading(false)
  }, [])

  if (loading) return <div className="cv-panel animate-pulse h-64" />

  return (
    <div className="cv-page cv-premium-page">
      <div className="flex flex-col lg:flex-row justify-between gap-5 items-start lg:items-end">
        <div>
          <p className="cv-kicker">CALENDAR</p>
          <h1 className="text-4xl sm:text-5xl font-black mt-2">Calendar</h1>
          <p className="text-[var(--cv-muted)] mt-3 max-w-2xl">
            View upcoming events and meetings for your learning organization.
          </p>
        </div>
        <div className="cv-pill">📅 {events.length} events</div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-8">
        {events.map((event) => (
          <div
            key={event.id}
            className="cv-panel overflow-hidden rounded-lg border border-[var(--cv-border)] p-4 hover:border-violet-500/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">📅</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mt-1">{event.title}</h3>
                <p className="text-sm text-[var(--cv-muted)] mt-1">
                  {event.date} · {event.time}
                </p>
                <p className="text-xs text-[var(--cv-muted)] mt-1">{event.location || "Online"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!events.length && (
        <div className="mt-8 text-center">
          <p className="text-[var(--cv-muted)]">No upcoming events.</p>
        </div>
      )}
    </div>
  )
}