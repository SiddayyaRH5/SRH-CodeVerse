import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAllStudents } from "../../api/trainerStudentApi"

function Students() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    getAllStudents()
      .then((res) => setStudents(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load students"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[var(--color-text-secondary)]">Loading students...</p>
  if (error) return <p className="text-[var(--color-danger)]">{error}</p>

  const filtered = students.filter(
    (s) =>
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <span className="text-sm text-[var(--color-text-secondary)]">{students.length} total</span>
      </div>

      <input
        placeholder="Search by username or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm mb-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-forge-500)]"
      />

      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <th className="p-3">Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Solved</th>
              <th className="p-3">Streak</th>
              <th className="p-3">Submissions</th>
              <th className="p-3">Last Active</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.username}
                onClick={() => navigate(`/trainer/students/${s.username}`)}
                className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] cursor-pointer"
              >
                <td className="p-3 font-medium">{s.username}</td>
                <td className="p-3 text-[var(--color-text-secondary)]">{s.email}</td>
                <td className="p-3">{s.problemsSolved}</td>
                <td className="p-3">
                  {s.forgeStreakCurrent} 🔥 <span className="text-[var(--color-text-secondary)]">(best {s.forgeStreakLongest})</span>
                </td>
                <td className="p-3">{s.totalSubmissions}</td>
                <td className="p-3 text-[var(--color-text-secondary)]">
                  {s.lastActive === "Never" ? "Never" : new Date(s.lastActive).toLocaleDateString()}
                </td>
                <td className="p-3 text-[var(--color-text-secondary)]">{new Date(s.joinedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-4 text-[var(--color-text-secondary)] text-sm">No students match your search.</p>
        )}
      </div>
    </div>
  )
}

export default Students