import { useState, useEffect } from "react"
import { getLeaderboard } from "../../api/leaderboardApi"

function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard()
      .then((res) => setEntries(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load leaderboard"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[var(--color-text-secondary)]">Loading leaderboard...</p>
  if (error) return <p className="text-[var(--color-danger)]">{error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
      {entries.length === 0 ? (
        <p className="text-[var(--color-text-secondary)]">No one has solved a problem yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div
              key={e.username}
              className="flex items-center justify-between bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 text-center font-bold text-[var(--color-forge-500)]">#{e.rank}</span>
                <span className="font-medium">{e.username}</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
                <span>{e.problemsSolved} solved</span>
                <span>{e.forgeStreakCurrent} 🔥</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Leaderboard