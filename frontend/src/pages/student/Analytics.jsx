import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { getAnalytics } from "../../api/analyticsApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import EmptyState from "../../components/common/EmptyState"
import { SkeletonCards } from "../../components/common/Skeleton"

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getAnalytics()
      setAnalytics(response.data)
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your analytics. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const last14 = useMemo(
    () =>
      (analytics?.activity || []).map((day) => ({
        date: String(day.date || "").slice(5),
        submissions: day.count || 0,
      })),
    [analytics]
  )
  const difficulty = analytics?.difficultyMastery || []
  const rawSolveCoverage = Number(analytics?.solveCoverage)
  const solveCoverage =
    analytics?.solveCoverage !== null &&
    analytics?.solveCoverage !== undefined &&
    Number.isFinite(rawSolveCoverage)
      ? Number(rawSolveCoverage.toFixed(1))
      : null
  const activeDays = analytics?.activeDays || null
  const longestStreak = analytics?.longestStreak || null
  const problemsSolved = analytics?.problemsSolved || null

  if (loading && !analytics) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={5} />
        </PageContainer>
      </main>
    )
  }

  if (error && !analytics) {
    return (
      <main className="cv-page">
        <PageContainer>
          <EmptyState
            icon="!"
            title={error}
            description="Please check your connection and try again."
            actionLabel="Try again"
            action={loadAnalytics}
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
          kicker="YOUR DEVELOPER TELEMETRY"
          title="Advanced Analytics"
          description="See how consistently you code, which difficulty levels you have mastered, and where your next improvement can come from."
        />

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-amber-500">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          {[
            {
              label: "Problems Solved",
              value: problemsSolved === null ? "—" : problemsSolved,
              icon: "✓",
              subtitle: "Total problems solved",
            },
            {
              label: "Current Streak",
              value: activeDays === null ? "—" : `${activeDays} days`,
              icon: "🔥",
              subtitle: "Consecutive active days",
            },
            {
              label: "Longest Streak",
              value: longestStreak === null ? "—" : `${longestStreak} days`,
              icon: "💎",
              subtitle: "Best consecutive streak",
            },
            {
              label: "Solve Coverage",
              value: solveCoverage === null ? "—" : `${solveCoverage}%`,
              icon: "◈",
              subtitle: "Problems solved vs available",
            },
          ].map((card) => (
            <div key={card.label} className="cv-stat-card rounded-2xl p-5">
              <div className="flex justify-between">
                <span className="w-10 h-10 rounded-xl grid place-items-center bg-violet-500/10 text-[var(--cv-primary)]">{card.icon}</span>
                <span className="text-xs text-emerald-500 font-bold">LIVE</span>
              </div>
              <p className="text-xs text-[var(--cv-muted)] mt-6">{card.label}</p>
              <p className="text-3xl font-black mt-1">{card.value}</p>
              <p className="mt-2 text-[11px] text-[var(--cv-muted)]">{card.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.35fr_.65fr] gap-5 mt-8">
          <section className="cv-stat-card rounded-2xl p-5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[var(--cv-primary)]">LAST 14 DAYS</p>
                <h2 className="text-xl font-black mt-1">Coding Activity</h2>
              </div>
              <span className="text-xs text-[var(--cv-muted)]">Your actual submissions</span>
            </div>
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last14}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--cv-muted)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--cv-muted)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--cv-surface)", border: "1px solid var(--cv-border)", borderRadius: 12, color: "var(--cv-text)" }} />
                  <Area type="monotone" dataKey="submissions" stroke="#7c3aed" fill="url(#activityFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="cv-stat-card rounded-2xl p-5">
            <p className="text-xs font-bold text-cyan-500">DIFFICULTY MASTERY</p>
            <h2 className="text-xl font-black mt-1">Solved vs available</h2>
            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficulty}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--cv-muted)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--cv-muted)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--cv-surface)", border: "1px solid var(--cv-border)", borderRadius: 12, color: "var(--cv-text)" }} />
                  <Bar dataKey="solved" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total" fill="#7c3aed" fillOpacity={0.22} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mt-5">
          <div className="cv-stat-card rounded-2xl p-5">
            <p className="text-xs font-bold text-[var(--cv-primary)]">NEXT FOCUS</p>
            <h3 className="text-xl font-black mt-2">Build consistency</h3>
            <p className="text-sm text-[var(--cv-muted)] mt-2">
              Your analytics show {activeDays ?? 0} active days. Aim for a short daily session instead of occasional long sessions.
            </p>
          </div>
          <div className="cv-stat-card rounded-2xl p-5">
            <p className="text-xs font-bold text-cyan-500">DIFFICULTY SIGNAL</p>
            <h3 className="text-xl font-black mt-2">Push one level higher</h3>
            <p className="text-sm text-[var(--cv-muted)] mt-2">
              Use your solved distribution to choose the next difficulty. Once Easy feels routine, increase Medium practice gradually.
            </p>
          </div>
          <div className="cv-stat-card rounded-2xl p-5">
            <p className="text-xs font-bold text-pink-500">STREAK</p>
            <h3 className="text-xl font-black mt-2">Protect your momentum</h3>
            <p className="text-sm text-[var(--cv-muted)] mt-2">
              Your current streak is {activeDays ?? 0} days. One focused problem a day is enough to keep the habit going.
            </p>
          </div>
        </div>
      </PageContainer>
    </main>
  )
}