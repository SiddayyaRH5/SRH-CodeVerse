import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
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

const TOOLTIP_STYLE = {
  background: "var(--cv-surface)",
  border: "1px solid var(--cv-border)",
  borderRadius: 10,
  color: "var(--cv-text)",
  fontSize: 12,
}

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
      submissions: Number(day.count) || 0,
    })),
    [analytics]
  )

  const difficulty = useMemo(
    () => (analytics?.difficultyMastery || []).map((item) => ({
      name: String(item.name || "").toLowerCase(),
      solved: Number(item.solved) || 0,
      total: Number(item.total) || 0,
    })),
    [analytics]
  )

  const solved = Number(analytics?.problemsSolved) || 0
  const available = Number(analytics?.totalAvailableProblems) || 0
  const coverage = Number.isFinite(Number(analytics?.solveCoverage))
    ? Number(Number(analytics.solveCoverage).toFixed(1))
    : 0
  const activeDays = Number(analytics?.activeDays) || 0
  const currentStreak = Number(analytics?.currentStreak) || 0
  const longestStreak = Number(analytics?.longestStreak) || 0
  const activityTotal = last14.reduce((sum, day) => sum + day.submissions, 0)
  const donutData = [
    { name: "Solved", value: solved, color: "#06b6d4" },
    { name: "Remaining", value: Math.max(0, available - solved), color: "#7c3aed" },
  ]

  if (loading && !analytics) {
    return (
      <div className="cv-page cv-premium-page" aria-busy="true">
        <div className="cv-ad-hero"><div className="h-4 w-40 rounded bg-[var(--cv-surface-2)] animate-pulse" /><div className="mt-3 h-7 w-64 rounded bg-[var(--cv-surface-2)] animate-pulse" /></div>
        <div className="cv-ad-metrics">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] animate-pulse" />)}
        </div>
        <div className="cv-ad-main-grid">
          <div className="h-80 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] animate-pulse" />
          <div className="h-80 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] animate-pulse" />
        </div>
        <span className="sr-only">Building your developer analytics...</span>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="cv-page cv-premium-page">
        <div className="cv-ad-panel" role="alert">
          <p className="font-bold text-red-400">Analytics unavailable</p>
          <p className="mt-2 text-sm text-[var(--cv-muted)]">{error}</p>
          <button onClick={loadAnalytics} className="cv-primary-btn mt-4">Retry</button>
        </div>
      </div>
    )
  }

  const metrics = [
    { label: "Problems Solved", value: solved, icon: CircleCheck, accent: "violet" },
    { label: "Current Streak", value: `${currentStreak} days`, icon: Flame, accent: "amber" },
    { label: "Longest Streak", value: `${longestStreak} days`, icon: Trophy, accent: "cyan" },
    { label: "Solve Coverage", value: `${coverage}%`, icon: Target, accent: "blue" },
    { label: "Active Days", value: activeDays, icon: CalendarDays, accent: "emerald" },
  ]

  return (
    <div className="cv-page cv-premium-page cv-analytics-page">
      <section className="cv-ad-hero">
        <span className="cv-ad-geo" aria-hidden="true" />
        <span className="cv-ad-geo cv-ad-geo--small" aria-hidden="true" />
        <div className="relative min-w-0">
          <p className="cv-kicker">YOUR DEVELOPER TELEMETRY</p>
          <h1 className="cv-ad-hero-title mt-1 font-black">Advanced Analytics</h1>
          <p className="cv-ad-hero-lead">
            See how consistently you code, which difficulty levels you have mastered, and where your next improvement can come from.
          </p>
        </div>
        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-500">
          <Sparkles size={12} aria-hidden="true" /> Live progress
        </span>
      </section>

      {error && (
        <div role="alert" className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-500">
          {error} <button onClick={loadAnalytics} className="font-bold underline">Retry</button>
        </div>
      )}

      <div className="cv-ad-metrics">
        {metrics.map(({ label, value, icon: Icon, accent }) => (
          <article key={label} className={`cv-ad-stat cv-ad-accent--${accent}`}>
            <span className="cv-ad-stat-icon"><Icon size={16} strokeWidth={2} aria-hidden="true" /></span>
            <p className="cv-ad-stat-label">{label}</p>
            <p className="cv-ad-stat-value">{value}</p>
          </article>
        ))}
      </div>

      <div className="cv-ad-main-grid">
        <section
          className="cv-analytics-chart cv-ad-panel"
          role="img"
          aria-label={`Coding activity over the last 14 days. ${activityTotal} submissions total.`}
        >
          <div className="cv-ad-panel-head">
            <div>
              <p className="cv-ad-panel-kicker">Last 14 days</p>
              <h2 className="cv-ad-panel-title">Coding Activity</h2>
            </div>
            <div className="cv-ad-legend"><span><i style={{ background: "#7c3aed" }} aria-hidden="true" /> Submissions</span></div>
          </div>
          {last14.length === 0 ? (
            <div className="cv-ad-empty">No submissions in the last 14 days yet. Solve a problem to start your activity streak.</div>
          ) : (
            <div className="cv-ad-chart-body">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={last14} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "var(--cv-muted)", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--cv-muted)", fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "var(--cv-text)" }} />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    name="Submissions"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#activityFill)"
                    dot={{ r: 2.5, fill: "#06b6d4", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#06b6d4", stroke: "#fff", strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section
          className="cv-analytics-chart cv-ad-panel"
          role="img"
          aria-label={`Solved versus available problems. ${solved} solved out of ${available} available.`}
        >
          <div className="cv-ad-panel-head">
            <div>
              <p className="cv-ad-panel-kicker">Solved vs available</p>
              <h2 className="cv-ad-panel-title">Solution Coverage</h2>
            </div>
          </div>
          {available === 0 ? (
            <div className="cv-ad-empty">No problems are available yet.</div>
          ) : (
            <>
              <div className="cv-ad-donut-wrap">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={3}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {donutData.map((item) => <Cell key={item.name} fill={item.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="cv-ad-donut-center">
                  <strong>{solved}</strong>
                  <span>solved of {available}</span>
                </div>
              </div>
              <div className="cv-ad-legend mt-2 justify-center">
                <span><i style={{ background: "#06b6d4" }} aria-hidden="true" /> Solved</span>
                <span><i style={{ background: "#7c3aed" }} aria-hidden="true" /> Remaining</span>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="cv-ad-lower-grid">
        <section className="cv-ad-panel">
          <div className="cv-ad-panel-head">
            <div>
              <p className="cv-ad-panel-kicker">Difficulty mastery</p>
              <h2 className="cv-ad-panel-title">Progress by difficulty</h2>
            </div>
            <span className="text-xs text-[var(--cv-muted)]">Solved out of available</span>
          </div>
          {difficulty.length === 0 ? (
            <div className="cv-ad-empty">Solve a problem to start tracking difficulty mastery.</div>
          ) : (
            <div className="mt-2">
              {difficulty.map((item) => {
                const percent = item.total > 0 ? Math.min(100, Math.round((item.solved / item.total) * 100)) : 0
                return (
                  <div key={item.name} className="cv-ad-mastery-row">
                    <span className="cv-ad-mastery-name">{item.name}</span>
                    <div
                      className="cv-ad-mastery-track"
                      role="progressbar"
                      aria-label={`${item.name} mastery`}
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="cv-ad-mastery-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="cv-ad-mastery-values">{item.solved}/{item.total} · {percent}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="cv-ad-panel">
          <div className="cv-ad-panel-head">
            <div>
              <p className="cv-ad-panel-kicker">Personalized insights</p>
              <h2 className="cv-ad-panel-title">Next steps</h2>
            </div>
          </div>
          <div className="cv-ad-insights mt-3">
            <article className="cv-ad-insight">
              <span className="cv-ad-insight-icon"><Lightbulb size={15} aria-hidden="true" /></span>
              <div><h3>Build consistency</h3><p>You have {activeDays} active days. A short daily session beats occasional long ones.</p></div>
            </article>
            <article className="cv-ad-insight">
              <span className="cv-ad-insight-icon"><ShieldAlert size={15} aria-hidden="true" /></span>
              <div><h3>Difficulty signal</h3><p>Use the mastery bars to pick the next level. Increase Medium practice gradually.</p></div>
            </article>
            <article className="cv-ad-insight">
              <span className="cv-ad-insight-icon"><Flame size={15} aria-hidden="true" /></span>
              <div><h3>Protect your streak</h3><p>Current streak is {currentStreak} days. One focused problem a day keeps it alive.</p></div>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}
