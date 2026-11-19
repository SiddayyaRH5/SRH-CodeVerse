import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getDashboard } from "../../api/dashboardApi"
import { getTodaysChallenge } from "../../api/dailyChallengeApi"
import { getAchievements } from "../../api/achievementApi"
import { SkeletonCards } from "../../components/common/Skeleton"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"

function hasValue(value) {
  return value !== null && value !== undefined
}

function StatCard({ label, value, icon, suffix, foot }) {
  const displayValue = hasValue(value) ? value : "—"
  return (
    <div className="cv-dashboard-stat-card">
      <div className="cv-dashboard-stat-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="cv-dashboard-stat-content">
        <p>{label}</p>
        <strong>{displayValue}{suffix}</strong>
        <span className="cv-dashboard-stat-foot">{foot}</span>
      </div>
    </div>
  )
}

function DailyChallengeCard() {
  const [challenge, setChallenge] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)

  const retry = useCallback(() => {
    setLoaded(false)
    setError("")
    setChallenge(null)
    setVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    let active = true
    setLoaded(false)
    setError("")
    setChallenge(null)

    getTodaysChallenge()
      .then((res) => {
        if (active) setChallenge(res?.data ?? null)
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Couldn't load today's challenge. Check your connection and try again.",
          )
          setChallenge(null)
        }
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [version])

  const hasReward = hasValue(challenge?.rewardPoints)

  return (
    <section className="cv-dashboard-panel" aria-label="Daily challenge">
      <div className="cv-dashboard-panel-heading">
        <div className="cv-dashboard-section-icon cv-dashboard-fire" aria-hidden="true">
          🔥
        </div>
        <div className="min-w-0">
          <p className="cv-dashboard-eyebrow">KEEP YOUR MOMENTUM</p>
          <h2>Daily Forge Challenge</h2>
          <p className="cv-dashboard-muted">One focused problem can make today count.</p>
        </div>
      </div>
      {!loaded ? (
        <div className="cv-dashboard-empty">
          <span className="cv-dashboard-spinner" aria-hidden="true" /> Loading today's challenge…
        </div>
      ) : error ? (
        <div className="cv-dashboard-empty-state">
          <span className="cv-dashboard-empty-emoji" aria-hidden="true">!</span>
          <div className="min-w-0">
            <p className="cv-dashboard-empty-title">Couldn't load today's challenge</p>
            <p className="cv-dashboard-muted">{error}</p>
          </div>
          <button type="button" onClick={retry} className="cv-dashboard-inline-link">
            Try again <span aria-hidden="true">↻</span>
          </button>
        </div>
      ) : challenge ? (
        <div className="cv-dashboard-challenge-row">
          <div className="min-w-0">
            <p className="cv-dashboard-challenge-title">{challenge.title}</p>
            <p className="cv-dashboard-muted">
              {challenge.topic}
              {hasReward ? ` · ${challenge.rewardPoints} points` : null}
            </p>
          </div>
          {challenge.solvedToday ? (
            <span className="cv-dashboard-success" aria-label="Solved today">✓ Solved today</span>
          ) : challenge.problemId ? (
            <Link
              to={`/problems/${challenge.problemId}`}
              className="cv-dashboard-button"
            >
              Solve challenge <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="cv-dashboard-empty-state">
          <span className="cv-dashboard-empty-emoji" aria-hidden="true">✦</span>
          <div className="min-w-0">
            <p className="cv-dashboard-empty-title">Your next challenge is on its way</p>
            <p className="cv-dashboard-muted">Explore the practice arena while today's challenge is being prepared.</p>
          </div>
          <Link to="/problems" className="cv-dashboard-inline-link">
            Explore practice <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </section>
  )
}

function AchievementsCard() {
  const [achievements, setAchievements] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState("")
  const [version, setVersion] = useState(0)

  const retry = useCallback(() => {
    setLoaded(false)
    setError("")
    setAchievements([])
    setVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    let active = true
    setLoaded(false)
    setError("")
    setAchievements([])

    getAchievements()
      .then((res) => {
        if (active) setAchievements(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Couldn't load achievements. Check your connection and try again.",
          )
          setAchievements([])
        }
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [version])

  return (
    <section className="cv-dashboard-panel" aria-label="Achievements">
      <div className="cv-dashboard-panel-topline">
        <div className="cv-dashboard-panel-heading">
          <div className="cv-dashboard-section-icon cv-dashboard-medal" aria-hidden="true">
            🏆
          </div>
          <div>
            <p className="cv-dashboard-eyebrow">MILESTONES & WINS</p>
            <h2>Achievements</h2>
            <p className="cv-dashboard-muted">Every milestone is proof you're moving forward.</p>
          </div>
        </div>
        <Link to="/achievements" className="cv-dashboard-outline-button">
          View all <span aria-hidden="true">→</span>
        </Link>
      </div>
      {!loaded ? (
        <div className="cv-dashboard-empty">
          <span className="cv-dashboard-spinner" aria-hidden="true" /> Loading achievements…
        </div>
      ) : error ? (
        <div className="cv-dashboard-empty-state cv-dashboard-achievement-empty">
          <span className="cv-dashboard-empty-emoji" aria-hidden="true">!</span>
          <div className="min-w-0">
            <p className="cv-dashboard-empty-title">Couldn't load achievements</p>
            <p className="cv-dashboard-muted">{error}</p>
          </div>
          <button type="button" onClick={retry} className="cv-dashboard-inline-link">
            Try again <span aria-hidden="true">↻</span>
          </button>
        </div>
      ) : achievements.length === 0 ? (
        <div className="cv-dashboard-empty-state cv-dashboard-achievement-empty">
          <span className="cv-dashboard-empty-emoji" aria-hidden="true">🏅</span>
          <div className="min-w-0">
            <p className="cv-dashboard-empty-title">Your first achievement is waiting</p>
            <p className="cv-dashboard-muted">Solve your first problem to start collecting milestones.</p>
          </div>
          <Link to="/problems" className="cv-dashboard-inline-link">
            Start solving <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="cv-dashboard-achievement-grid">
          {achievements.slice(0, 6).map((item) => (
            <div key={item.code} title={item.description} className="cv-dashboard-achievement-item">
              <span className="cv-dashboard-achievement-icon" aria-hidden="true">
                {item.icon || "🏅"}
              </span>
              <span className="min-w-0">
                <span className="cv-dashboard-achievement-name">{item.name}</span>
                <span className="cv-dashboard-muted cv-dashboard-truncate">{item.description}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  const retry = useCallback(() => {
    setLoading(true)
    setError("")
    setData(null)
    setVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    setData(null)

    getDashboard()
      .then((res) => {
        if (active) setData(res?.data ?? null)
      })
      .catch((err) => {
        if (active) {
          setError(
            err?.response?.data?.message || "Failed to load dashboard. Check your connection and try again.",
          )
          setData(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [version])

  if (loading) {
    return (
      <main className="cv-dashboard-page">
        <PageContainer>
          <SkeletonCards count={3} />
          <div className="mt-6">
            <SkeletonCards count={2} />
          </div>
        </PageContainer>
      </main>
    )
  }

  if (error) {
    return (
      <main className="cv-dashboard-page">
        <PageContainer>
          <div className="cv-dashboard-error">
            <span className="cv-dashboard-error-icon" aria-hidden="true">!</span>
            <div>
              <h2>We couldn't load your dashboard</h2>
              <p>{error}</p>
              <button className="cv-dashboard-button" onClick={retry}>
                Try again <span aria-hidden="true">↻</span>
              </button>
            </div>
          </div>
        </PageContainer>
      </main>
    )
  }

  const username = data?.username
  const problemsSolved = hasValue(data?.problemsSolved) ? data.problemsSolved : null
  const forgeStreakCurrent = hasValue(data?.forgeStreakCurrent) ? data.forgeStreakCurrent : null
  const forgeStreakLongest = hasValue(data?.forgeStreakLongest) ? data.forgeStreakLongest : null
  const rank = hasValue(data?.rank) ? data.rank : null

  return (
    <main className="cv-dashboard-page">
      <PageContainer>
        <PageHeader
          kicker="YOUR DEVELOPER SPACE"
          title={username ? `Welcome back, ${username}` : "Welcome back"}
          description="Ready to forge something great today. Keep your momentum going."
          actions={
            <>
              <Link to="/problems" className="cv-dashboard-button">
                Continue practicing <span aria-hidden="true">→</span>
              </Link>
              <Link to="/learning-path" className="cv-dashboard-quiet-link">
                View learning path <span aria-hidden="true">↗</span>
              </Link>
            </>
          }
        />

        <section className="cv-dashboard-stats" aria-label="Your coding statistics">
          <StatCard
            label="Problems solved"
            value={problemsSolved}
            icon="⌘"
            foot="Every solution counts"
          />
          <StatCard
            label="Current streak"
            value={forgeStreakCurrent}
            suffix={forgeStreakCurrent !== null ? " days" : undefined}
            icon="🔥"
            foot="Keep the streak alive"
          />
          <StatCard
            label="Longest streak"
            value={forgeStreakLongest}
            suffix={forgeStreakLongest !== null ? " days" : undefined}
            icon="♛"
            foot="Your best run"
          />
          <StatCard
            label="Community rank"
            value={rank === null ? null : `#${rank}`}
            icon="🏆"
            foot="Your place in CodeVerse"
          />
        </section>

        <div className="cv-dashboard-section-label">
          <span>YOUR NEXT MOVE</span>
          <span className="cv-dashboard-section-line" />
        </div>
        <section className="cv-dashboard-feature-grid">
          <Link to="/learning-path" className="cv-dashboard-feature cv-dashboard-feature-learning">
            <div className="cv-dashboard-feature-top">
              <span className="cv-dashboard-feature-icon" aria-hidden="true">🧠</span>
              <span className="cv-dashboard-feature-arrow" aria-hidden="true">↗</span>
            </div>
            <p className="cv-dashboard-eyebrow">PERSONALIZED FOR YOU</p>
            <h2>Learning Path</h2>
            <p className="cv-dashboard-muted">
              A focused roadmap shaped around your progress and the skills you want to build.
            </p>
            <span className="cv-dashboard-feature-link">Explore your path <span aria-hidden="true">→</span></span>
          </Link>
          <Link to="/certificates" className="cv-dashboard-feature cv-dashboard-feature-certificates">
            <div className="cv-dashboard-feature-top">
              <span className="cv-dashboard-feature-icon" aria-hidden="true">🏅</span>
              <span className="cv-dashboard-feature-arrow" aria-hidden="true">↗</span>
            </div>
            <p className="cv-dashboard-eyebrow">CELEBRATE YOUR GROWTH</p>
            <h2>Certificates</h2>
            <p className="cv-dashboard-muted">
              Turn your problem-solving milestones into certificates you can proudly share.
            </p>
            <span className="cv-dashboard-feature-link">View certificates <span aria-hidden="true">→</span></span>
          </Link>
        </section>

        <div className="cv-dashboard-section-label">
          <span>BUILD YOUR MOMENTUM</span>
          <span className="cv-dashboard-section-line" />
        </div>
        <section className="cv-dashboard-lower-grid">
          <DailyChallengeCard />
          <AchievementsCard />
        </section>
      </PageContainer>
    </main>
  )
}

export default Dashboard