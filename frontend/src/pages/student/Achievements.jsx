import { useState, useEffect } from "react"
import { getAllAchievements } from "../../api/achievementApi"

function Achievements() {
  const [achievements, setAchievements] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllAchievements()
      .then((res) => setAchievements(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load achievements"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[var(--color-text-secondary)]">Loading achievements...</p>
  if (error) return <p className="text-[var(--color-danger)]">{error}</p>

  const earnedCount = achievements.filter((a) => a.earned).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Achievements 🏆</h1>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {earnedCount}/{achievements.length} earned
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((a) => {
          const pct = a.targetProgress > 0 ? Math.min(100, (a.currentProgress / a.targetProgress) * 100) : 0
          return (
            <div
              key={a.code}
              className={`border rounded-lg p-4 ${
                a.earned
                  ? "bg-[var(--color-bg-secondary)] border-[var(--color-forge-500)]"
                  : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{a.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{a.description}</p>
                </div>
              </div>

              {a.earned ? (
                <p className="text-xs text-[var(--color-success)] mt-2">
                  ✓ Earned {new Date(a.earnedAt).toLocaleDateString()}
                </p>
              ) : (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-forge-500)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {a.currentProgress}/{a.targetProgress}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Achievements