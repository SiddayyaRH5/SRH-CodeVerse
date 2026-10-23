import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { getStudentDetail, getStudentActivity } from "../../api/trainerStudentApi"
import StatCard from "../../components/common/StatCard"
import ActivityHeatmap from "../../components/common/ActivityHeatmap"

function StudentDetail() {
  const { username } = useParams()
  const [student, setStudent] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentDetail(username)
      .then((res) => setStudent(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load student"))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <p className="text-[var(--color-text-secondary)]">Loading student...</p>
  if (error) return <p className="text-[var(--color-danger)]">{error}</p>

  return (
    <div>
      <Link to="/trainer/students" className="text-sm text-[var(--color-forge-500)] hover:underline mb-4 inline-block">
        ← Back to Students
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-[var(--color-forge-500)] flex items-center justify-center text-2xl font-bold text-white">
          {student.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{student.username}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {student.email} · Joined {new Date(student.joinedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <StatCard label="Solved" value={student.problemsSolved} />
        <StatCard label="Streak" value={`${student.forgeStreakCurrent} 🔥`} accent />
        <StatCard label="Best Streak" value={student.forgeStreakLongest} />
        <StatCard label="Submissions" value={student.totalSubmissions} />
        <StatCard label="Success Rate" value={`${student.successRate}%`} />
      </div>

      <div className="mb-6">
        <ActivityHeatmap fetchFn={() => getStudentActivity(username)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">Recent Submissions</h2>
          {student.recentSubmissions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No submissions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {student.recentSubmissions.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-[var(--color-border)] last:border-0">
                  <span>{s.problemTitle}</span>
                  <span className={s.status === "PASSED" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
                    {s.status === "PASSED" ? "✓ Passed" : "✗ Failed"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">Achievements 🏆</h2>
          {student.achievements.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No achievements earned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {student.achievements.map((a) => (
                <div
                  key={a.code}
                  title={a.description}
                  className="flex items-center gap-2 bg-[var(--color-bg-tertiary)] rounded-lg px-3 py-2 text-sm"
                >
                  <span>{a.icon}</span>
                  <span>{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDetail