import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getDashboard } from "../../api/dashboardApi"
import { getTodaysChallenge } from "../../api/dailyChallengeApi"
import { getAchievements } from "../../api/achievementApi"
import StatCard from "../../components/common/StatCard"


function DailyChallengeCard() {
  const [challenge, setChallenge] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getTodaysChallenge()
      .then((res) => setChallenge(res.data))
      .catch(() => setChallenge(null))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return null

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5">
      <h2 className="text-lg font-semibold mb-2">Daily Forge Challenge 🔥</h2>
      {challenge ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{challenge.title}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {challenge.topic} · {challenge.rewardPoints} pts
            </p>
          </div>
          {challenge.solvedToday ? (
            <span className="text-sm text-[var(--color-success)]">✓ Solved today</span>
          ) : (
            <Link
              to={`/problems/${challenge.problemId}`}
              className="bg-[var(--color-forge-500)] hover:bg-[var(--color-forge-600)] text-white text-sm px-4 py-2 rounded"
            >
              Solve Now
            </Link>
          )}
        </div>
      ) : (
        <p className="text-[var(--color-text-secondary)] text-sm">No challenge set for today.</p>
      )}
    </div>
  )
}

function AchievementsCard() {
  const [achievements, setAchievements] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAchievements()
      .then((res) => setAchievements(res.data))
      .catch(() => setAchievements([]))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) return null

  return (
   <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5 mt-6 shadow-sm">
  {/* Header */}
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        Achievements
        <span className="text-lg">🏆</span>
      </h2>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
        Milestones you've unlocked
      </p>
    </div>

    <Link
            to="/achievements"
            className="
              inline-flex items-center gap-1.5
              px-3 py-1.5
              rounded-lg
              text-xs font-semibold
              text-[var(--color-forge-500)]
              bg-[var(--color-forge-500)]/10
              border border-[var(--color-forge-500)]/20
              hover:bg-[var(--color-forge-500)]/20
              hover:border-[var(--color-forge-500)]/40
              hover:shadow-sm
              transition-all duration-200
              group
            "
          >
            View all
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
            </div>

            {/* Achievements */}
            {achievements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-3 opacity-80">🏆</div>

                <p className="text-sm font-medium">
                  No achievements yet
                </p>

                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Solve a problem to start earning achievements!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <div
                    key={a.code}
                    title={a.description}
                    className="
                      group
                      flex items-center gap-3
                      bg-[var(--color-bg-tertiary)]
                      border border-[var(--color-border)]
                      rounded-lg
                      px-4 py-3
                      transition-all duration-200
                      hover:-translate-y-0.5
                      hover:shadow-md
                    "
                  >
                    {/* Icon */}
                    <div
                      className="
                        w-10 h-10
                        flex items-center justify-center
                        rounded-lg
                        bg-[var(--color-bg-secondary)]
                        text-xl
                        shrink-0
                        transition-transform duration-200
                        group-hover:scale-110
                      "
                    >
                      {a.icon}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.name}
                      </p>

                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {a.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            )
          }

function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-[var(--color-text-secondary)]">Loading dashboard...</p>
  }

  if (error) {
    return <p className="text-[var(--color-danger)]">{error}</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back, {data.username} 👋</h1>
      <p className="text-[var(--color-text-secondary)] mb-6">Ready to forge something today?</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Problems Solved" value={data.problemsSolved} />
        <StatCard label="Current Streak" value={`${data.forgeStreakCurrent} 🔥`} accent />
        <StatCard label="Rank" value={data.rank ?? "—"} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Link to="/learning-path" className="cv-feature-card group">
          <div className="flex items-start justify-between gap-4"><span className="cv-feature-icon">🧠</span><span className="text-violet-500 text-sm font-black group-hover:translate-x-1 transition-transform">Open →</span></div>
          <h2 className="text-xl font-black mt-5">Personalized Learning Path</h2>
          <p className="text-sm text-[var(--cv-muted)] mt-2">See what to learn next based on your real problem-solving progress.</p>
        </Link>
        <Link to="/certificates" className="cv-feature-card group">
          <div className="flex items-start justify-between gap-4"><span className="cv-feature-icon">🏅</span><span className="text-violet-500 text-sm font-black group-hover:translate-x-1 transition-transform">View →</span></div>
          <h2 className="text-xl font-black mt-5">Certificates</h2>
          <p className="text-sm text-[var(--cv-muted)] mt-2">Turn your solved-problem milestones into professional CodeVerse certificates.</p>
        </Link>
      </div>

      <DailyChallengeCard />
      <AchievementsCard />
    </div>
  )
}

export default Dashboard