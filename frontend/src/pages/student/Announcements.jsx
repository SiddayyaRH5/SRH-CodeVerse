import { useCallback, useEffect, useState } from "react"
import { getAnnouncements } from "../../api/announcementApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import EmptyState from "../../components/common/EmptyState"
import { SkeletonCards } from "../../components/common/Skeleton"

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getAnnouncements()
      setAnnouncements(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load announcements. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={4} />
        </PageContainer>
      </main>
    )
  }

  if (error) {
    return (
      <main className="cv-page">
        <PageContainer>
          <EmptyState
            icon="!"
            title={error}
            description="Please check your connection and try again."
            actionLabel="Try again"
            action={loadAnnouncements}
            className="max-w-md mx-auto mt-20"
          />
        </PageContainer>
      </main>
    )
  }

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="ANNOUNCEMENTS"
          title="Announcements"
          description="Updates for your selected learning organization."
          actions={
            <>
              <span className="cv-pill">
                <span className="w-2 h-2 rounded-full bg-[var(--cv-primary)] mr-2" />
                {announcements.length} announcements
              </span>
            </>
          }
        />

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          {announcements.length === 0 ? (
            <div className="col-span-2 max-w-md mx-auto mt-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl" aria-hidden="true">
                📢
              </div>
              <h2 className="mt-4 text-lg font-bold">No announcements</h2>
              <p className="mt-2 text-sm text-[var(--cv-muted)]">
                There are no announcements for your organization at this time.
              </p>
            </div>
          ) : null}
          {announcements.length > 0 && (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="cv-stat-card rounded-2xl p-5 hover:border-violet-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📢</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold">{announcement.title}</h3>
                    <p className="text-sm text-[var(--cv-muted)] mt-1">
                      {announcement.audience} · {announcement.author}
                    </p>
                    <p className="text-xs text-[var(--cv-muted)] mt-1">
                      {announcement.date}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PageContainer>
    </main>
  )
}