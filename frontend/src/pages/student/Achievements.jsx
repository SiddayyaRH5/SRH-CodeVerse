import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAllAchievements } from "../../api/achievementApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import { SkeletonCards } from "../../components/common/Skeleton"

const NAV_ICONS = {
  default: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12.01" y2="8" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  first: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-4l3 3 9-9-9-9-3 3H2l-3 3 9 9 9-9z" />
    </svg>
  ),
  streak: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
}

function getAchievementIcon(code = "") {
  const lower = code.toLowerCase()
  if (lower.includes("first") || lower.includes("begin")) return NAV_ICONS.first
  if (lower.includes("streak") || lower.includes("consecutive") || lower.includes("daily")) return NAV_ICONS.streak
  return NAV_ICONS.default
}

export default function Achievements() {
  const [achievements, setAchievements] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const loadAchievements = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await getAllAchievements()
      setAchievements(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load achievements")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  const earnedCount = achievements.filter((a) => a.earned).length

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={5} />
        </PageContainer>
      </main>
    )
  }

  if (error) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl" aria-hidden="true">!</div>
            <h2 className="mt-5 text-lg font-bold">{error}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">Please check your connection and try again.</p>
            <button type="button" onClick={loadAchievements} className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Try again</button>
          </div>
        </PageContainer>
      </main>
    )
  }

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="MILESTONES & WINS"
          title="Achievements"
          description={`You've earned ${earnedCount} of ${achievements.length} achievements.`}
          actions={
            <Link to="/dashboard" className="text-xs font-bold text-[var(--cv-primary)] hover:underline">← Back to dashboard</Link>
          }
        />

        {achievements.length === 0 ? (
          <div className="max-w-md mx-auto mt-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl" aria-hidden="true">🏅</div>
            <h2 className="mt-4 text-lg font-bold">No achievements available</h2>
            <p className="mt-2 text-sm text-[var(--cv-muted)]">There are no achievements defined yet. Keep solving problems to unlock future milestones.</p>
            <Link to="/problems" className="mt-5 cv-primary-btn !px-5 !py-3 text-sm">Start solving</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {achievements.map((a) => {
              const pct = a.targetProgress > 0 ? Math.min(100, (a.currentProgress / a.targetProgress) * 100) : 0
              return (
                <div key={a.code} className={`cv-section-panel rounded-2xl p-4 ${
                  a.earned ? "border-emerald-500/30 bg-emerald-500/10" : "border-[var(--cv-border)] opacity-100"
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 grid place-items-center text-2xl">
                      {getAchievementIcon(a.code)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{a.name}</p>
                      <p className="text-xs text-[var(--cv-muted)]">{a.description}</p>
                    </div>
                  </div>
                  {a.earned ? (
                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                      ✓ Earned {new Date(a.earnedAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-[var(--cv-surface-2)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-[var(--cv-muted)] mt-1 text-right">{a.currentProgress}/{a.targetProgress}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PageContainer>
    </main>
  )
}