import { useCallback, useEffect, useMemo, useState } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import {
  CalendarDays,
  CircleCheck,
  Flame,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react"
import { getAnalytics } from "../../api/analyticsApi"

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
    window.addEventListener("focus", loadAnalytics)
    return () => window.removeEventListener("focus", loadAnalytics)
  }, [loadAnalytics])

  const last14 = useMemo(
    () => (analytics?.activity || []).map((day) => ({
      date: String(day.date || "").slice(5),
      submissions: day.count || 0,
    })),
    [analytics]
  )
  const difficulty = analytics?.difficultyMastery || []
  const rawSolveCoverage = Number(analytics?.solveCoverage)
  const solveCoverage = analytics?.solveCoverage !== null &&
    analytics?.solveCoverage !== undefined &&
    Number.isFinite(rawSolveCoverage)
    ? Number(rawSolveCoverage.toFixed(1))
    : 0
  const activeDays = analytics?.activeDays || 0
  const longestStreak = analytics?.longestStreak || 0

  if (loading && !analytics) {
    return (
      <div className="cv-page cv-premium-page" aria-busy="true">
        <div className="cv-analytics-hero"><div className="h-5 w-48 rounded bg-[var(--cv-surface-2)] animate-pulse" /><div className="mt-4 h-9 w-72 rounded bg-[var(--cv-surface-2)] animate-pulse" /></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] animate-pulse" />)}
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <div className="h-96 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] animate-pulse" />
          <div className="h-96 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] animate-pulse" />
        </div>
        <span className="sr-only">Building your developer analytics...</span>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="cv-page cv-premium-page">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6" role="alert">
          <p className="font-bold text-red-400">Analytics unavailable</p>
          <p className="mt-2 text-sm text-[var(--cv-muted)]">{error}</p>
          <button onClick={loadAnalytics} className="cv-primary-btn mt-4">Retry</button>
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Problems Solved", value: analytics?.problemsSolved ?? 0, icon: CircleCheck, accent: "violet" },
    { label: "Current Streak", value: `${analytics?.currentStreak ?? 0} days`, icon: Flame, accent: "amber" },
    { label: "Longest Streak", value: `${longestStreak} days`, icon: Trophy, accent: "cyan" },
    { label: "Solve Coverage", value: `${solveCoverage}%`, icon: Target, accent: "blue" },
    { label: "Active Days", value: activeDays, icon: CalendarDays, accent: "emerald" },
  ]

  return (
    <div className="cv-page cv-analytics-page cv-premium-page">
      <section className="cv-analytics-hero">
        <span className="cv-analytics-geo" aria-hidden="true" />
        <span className="cv-analytics-geo cv-analytics-geo--small" aria-hidden="true" />
        <p className="cv-kicker">YOUR DEVELOPER TELEMETRY</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Advanced Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cv-muted)]">
          See how consistently you code, which difficulty levels you have mastered, and where your next improvement can come from.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-500">
          <Sparkles size={12} aria-hidden="true" /> Live progress
        </span>
      </section>

      {error && <div role="alert" className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-500">{error}</div>}

      <div className="grid gap-4 mt-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <article key={label} className={`cv-analytics-stat cv-stat-card rounded-2xl border p-5 cv-analytics-accent--${accent}`}>
            <div className="flex items-start justify-between gap-3">
              <span className="cv-analytics-icon grid h-10 w-10 place-items-center rounded-xl">
                <Icon size={19} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">LIVE</span>
            </div>
            <p className="mt-5 text-xs text-[var(--cv-muted)]">{label}</p>
            <p className="cv-analytics-stat-number mt-1 font-black">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 mt-5 xl:grid-cols-[1.35fr_.65fr]">
        <section
          className="cv-analytics-chart cv-panel"
          role="img"
          aria-label={`Coding activity over the last 14 days. ${last14.reduce((sum, day) => sum + day.submissions, 0)} submissions total.`}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-500">Last 14 days</p>
              <h2 className="mt-1 text-xl font-black">Coding Activity</h2>
            </div>
            <div className="cv-analytics-legend">
              <span><i style={{ background: "#7c3aed" }} aria-hidden="true" /> Submissions</span>
            </div>
          </div>
          {last14.length === 0 ? (
            <div className="cv-analytics-empty">No submissions in the last 14 days yet.</div>
          ) : (
            <div className="h-72 mt-5">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={last14} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#7c3aed" fill="url(#activityFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section
          className="cv-analytics-chart cv-panel"
          role="img"
          aria-label={`Solved versus available problems by difficulty. ${difficulty.map((item) => `${item.name}: ${item.solved} of ${item.total}`).join(", ")}.`}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-500">Difficulty mastery</p>
          <h2 className="mt-1 text-xl font-black">Solved vs available</h2>
          <div className="cv-analytics-legend mt-3">
            <span><i style={{ background: "#06b6d4" }} aria-hidden="true" /> Solved</span>
            <span><i style={{ background: "rgba(124,58,237,0.35)" }} aria-hidden="true" /> Available</span>
          </div>
          {difficulty.length === 0 ? (
            <div className="cv-analytics-empty">Difficulty data is not available yet.</div>
          ) : (
            <div className="h-72 mt-3">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={difficulty} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--cv-muted)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--cv-muted)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--cv-surface)", border: "1px solid var(--cv-border)", borderRadius: 12, color: "var(--cv-text)" }} />
                  <Bar dataKey="solved" name="Solved" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total" name="Available" fill="#7c3aed" fillOpacity={0.22} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="cv-panel mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">Difficulty mastery</p>
            <h2 className="mt-1 text-xl font-black">Progress by difficulty</h2>
          </div>
          <span className="text-xs text-[var(--cv-muted)]">Solved out of available problems</span>
        </div>
        {difficulty.length === 0 ? (
          <div className="cv-analytics-empty">Solve a problem to start tracking difficulty mastery.</div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {difficulty.map((item) => {
              const total = Number(item.total) || 0
              const solved = Number(item.solved) || 0
              const percent = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0
              return (
                <div key={item.name} className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold capitalize">{String(item.name).toLowerCase()}</span>
                    <span className="text-xs font-bold text-[var(--cv-muted)]">{solved}/{total} · {percent}%</span>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-border)]"
                    role="progressbar"
                    aria-label={`${item.name} mastery`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid gap-5 mt-5 lg:grid-cols-3">
        <article className="cv-panel cv-analytics-insight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Lightbulb size={17} aria-hidden="true" /></span>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-500">Next focus</p>
          <h3 className="text-lg font-black">Build consistency</h3>
          <p className="text-sm text-[var(--cv-muted)]">Your analytics show {activeDays} active days. Aim for a short daily session instead of occasional long sessions.</p>
        </article>
        <article className="cv-panel cv-analytics-insight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500"><ShieldAlert size={17} aria-hidden="true" /></span>
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-500">Difficulty signal</p>
          <h3 className="text-lg font-black">Push one level higher</h3>
          <p className="text-sm text-[var(--cv-muted)]">Use your solved distribution to choose the next difficulty. Once Easy feels routine, increase Medium practice gradually.</p>
        </article>
        <article className="cv-panel cv-analytics-insight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500"><Flame size={17} aria-hidden="true" /></span>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Streak</p>
          <h3 className="text-lg font-black">Protect your momentum</h3>
          <p className="text-sm text-[var(--cv-muted)]">Your current streak is {analytics?.currentStreak ?? 0} days. One focused problem a day is enough to keep the habit going.</p>
        </article>
      </div>
    </div>
  )
}
