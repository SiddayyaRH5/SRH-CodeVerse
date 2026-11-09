import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getTrainerDashboard, getRecentSubmissions, getProblemPerformance } from "../../api/trainerApi"
import { getTrainerProblems } from "../../api/problemApi"
import { setTodaysChallenge } from "../../api/dailyChallengeApi"

function Panel({ title, children, className = "" }) {
  return (
    <div className={`cv-panel rounded-2xl p-4 ${className}`}>
      <p className="text-violet-500 text-sm mb-3">{title}</p>
      {children}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="border border-[var(--cv-border)] rounded-lg p-4 font-mono flex-1">
      <p className="text-violet-500 text-xs mb-1">{label}</p>
      <p className="text-[var(--cv-text)] text-2xl">{value}</p>
    </div>
  )
}

function SetDailyChallengeCard() {
  const [problems, setProblems] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [rewardPoints, setRewardPoints] = useState(10)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    getTrainerProblems()
      .then((res) => setProblems(res.data))
      .catch(() => setProblems([]))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setMessage("")
    try {
      await setTodaysChallenge({ problemId: Number(selectedId), rewardPoints: Number(rewardPoints) })
      setMessage("Today's challenge updated.")
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to set challenge")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title="Set Daily Challenge" className="mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
        {message && <p className="text-violet-500">{message}</p>}

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="cv-input !py-2"
          required
        >
          <option value="">Select a problem...</option>
          {[...problems].sort((a, b) => a.id - b.id).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.difficulty})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <label className="text-[var(--cv-muted)]">Reward points</label>
          <input
            type="number"
            min={1}
            value={rewardPoints}
            onChange={(e) => setRewardPoints(e.target.value)}
            className="cv-input !py-1.5 w-24"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !selectedId}
          className="self-start bg-violet-600 text-white font-semibold text-sm px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? "Saving..." : "Set Today's Challenge"}
        </button>
      </form>
    </Panel>
  )
}

function TrainerDashboard() {
  const [data, setData] = useState(null)
  const [recent, setRecent] = useState([])
  const [performance, setPerformance] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTrainerDashboard(), getRecentSubmissions(), getProblemPerformance()])
      .then(([dashRes, recentRes, perfRes]) => {
        setData(dashRes.data)
        setRecent(recentRes.data)
        setPerformance(perfRes.data)
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[var(--color-text-secondary)] font-mono">Loading dashboard...</p>
  if (error) return <p className="text-[var(--color-danger)] font-mono">{error}</p>

  return (
    <div className="bg-[var(--cv-surface-2)] rounded-xl p-6 -m-6 min-h-[calc(100vh-80px)]">
      <p className="text-[var(--cv-text)] font-mono text-sm mb-6">Trainer Dashboard</p>

      {/* Top stat row */}
      <div className="flex gap-4 mb-6">
        <StatBox label="Problems" value={data.totalProblems} />
        <StatBox label="Students" value={data.totalStudents} />
        <StatBox label="Submissions" value={data.totalSubmissions} />
        <StatBox label="Success" value={`${data.successRate}%`} />
      </div>

      {/* Student Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Panel title="Student Activity">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-[var(--cv-muted)]">
              <span>Active today</span>
              <span className="text-[var(--cv-text)]">{data.activeToday}</span>
            </div>
            <div className="flex justify-between text-[var(--cv-muted)]">
              <span>Solved today</span>
              <span className="text-[var(--cv-text)]">{data.solvedToday}</span>
            </div>
            <div className="flex justify-between text-[var(--cv-muted)]">
              <span>Submissions</span>
              <span className="text-[var(--cv-text)]">{data.submissionsToday}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Quick Actions">
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/trainer/problems/new" className="text-violet-500 hover:underline">
              + Create Problem
            </Link>
            <Link to="/trainer/problems" className="text-[var(--cv-muted)] hover:text-[var(--cv-text)]">
              Manage Problems
            </Link>
            <Link to="/trainer/students" className="text-[var(--cv-muted)] hover:text-[var(--cv-text)]">
              View Students
            </Link>
          </div>
        </Panel>
      </div>

      {/* Set Daily Challenge */}
      <SetDailyChallengeCard />

      {/* Recent Submissions */}
      <Panel title="Recent Submissions" className="mb-6">
        <div className="text-sm">
          <div className="grid grid-cols-4 text-violet-500 pb-2 border-b border-[var(--cv-border)] mb-2">
            <span>Student</span>
            <span>Problem</span>
            <span>Status</span>
            <span>Time</span>
          </div>
          {recent.length === 0 ? (
            <p className="text-[var(--cv-muted)] py-2">No submissions yet.</p>
          ) : (
            recent.map((r, i) => (
              <div key={i} className="grid grid-cols-4 py-1.5 text-[var(--cv-muted)]">
                <span className="text-[var(--cv-text)]">{r.studentUsername}</span>
                <span className="truncate pr-2">{r.problemTitle}</span>
                <span className={r.status === "PASSED" ? "text-emerald-500" : "text-red-500"}>
                  {r.status === "PASSED" ? "✓ Passed" : "✗ Failed"}
                </span>
                <span>{timeAgo(r.submittedAt)}</span>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* Problem Performance */}
      <Panel title="Problem Performance">
        <div className="flex flex-col gap-1.5 text-sm">
          {performance.length === 0 ? (
            <p className="text-[var(--cv-muted)]">No submission data yet.</p>
          ) : (
            performance.map((p, i) => (
              <div key={i} className="flex justify-between text-[var(--cv-muted)]">
                <span className="text-[var(--cv-text)]">{p.problemTitle}</span>
                <span>{p.successRate}% success</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  )
}

function timeAgo(isoString) {
  const seconds = Math.floor((new Date() - new Date(isoString)) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default TrainerDashboard