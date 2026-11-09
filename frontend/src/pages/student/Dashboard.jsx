import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getDashboard } from "../../api/dashboardApi"
import { getTodaysChallenge } from "../../api/dailyChallengeApi"
import { getAchievements } from "../../api/achievementApi"

function DailyChallengeCard() {
  const [challenge, setChallenge] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getTodaysChallenge()
      .then((res) => setChallenge(res.data))
      .catch(() => setChallenge(null))
      .finally(() => setLoaded(true))
  }, [])

  return (
    <section className="cv-dashboard-panel">
      <div className="cv-dashboard-panel-heading">
        <div className="cv-dashboard-section-icon cv-dashboard-fire">🔥</div>
        <div className="min-w-0">
          <p className="cv-dashboard-eyebrow">KEEP YOUR MOMENTUM</p>
          <h2>Daily Forge Challenge</h2>
          <p className="cv-dashboard-muted">One focused problem can make today count.</p>
        </div>
      </div>
      {!loaded ? (
        <div className="cv-dashboard-empty"><span className="cv-dashboard-spinner" /> Loading today’s challenge…</div>
      ) : challenge ? (
        <div className="cv-dashboard-challenge-row">
          <div className="min-w-0">
            <p className="cv-dashboard-challenge-title">{challenge.title}</p>
            <p className="cv-dashboard-muted">{challenge.topic} <span className="cv-dashboard-dot-separator">·</span> {challenge.rewardPoints} points</p>
          </div>
          {challenge.solvedToday ? <span className="cv-dashboard-success">✓ Solved today</span> : <Link to={`/problems/${challenge.problemId}`} className="cv-dashboard-button">Solve challenge <span>→</span></Link>}
        </div>
      ) : (
        <div className="cv-dashboard-empty-state">
          <span className="cv-dashboard-empty-emoji">✦</span>
          <div className="min-w-0">
            <p className="cv-dashboard-empty-title">Your next challenge is on its way</p>
            <p className="cv-dashboard-muted">Explore the practice arena while today’s challenge is being prepared.</p>
          </div>
          <Link to="/practice" className="cv-dashboard-inline-link">Explore practice <span>→</span></Link>
        </div>
      )}
    </section>
  )
}

function AchievementsCard() {
  const [achievements, setAchievements] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAchievements()
      .then((res) => setAchievements(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAchievements([]))
      .finally(() => setLoaded(true))
  }, [])

  return (
    <section className="cv-dashboard-panel">
      <div className="cv-dashboard-panel-topline">
        <div className="cv-dashboard-panel-heading">
          <div className="cv-dashboard-section-icon cv-dashboard-medal">🏆</div>
          <div>
            <p className="cv-dashboard-eyebrow">MILESTONES & WINS</p>
            <h2>Achievements</h2>
            <p className="cv-dashboard-muted">Every milestone is proof you’re moving forward.</p>
          </div>
        </div>
        <Link to="/achievements" className="cv-dashboard-outline-button">View all <span>→</span></Link>
      </div>
      {!loaded ? (
        <div className="cv-dashboard-empty"><span className="cv-dashboard-spinner" /> Loading achievements…</div>
      ) : achievements.length === 0 ? (
        <div className="cv-dashboard-empty-state cv-dashboard-achievement-empty">
          <span className="cv-dashboard-empty-emoji">🏅</span>
          <div className="min-w-0">
            <p className="cv-dashboard-empty-title">Your first achievement is waiting</p>
            <p className="cv-dashboard-muted">Solve your first problem to start collecting milestones.</p>
          </div>
          <Link to="/practice" className="cv-dashboard-inline-link">Start solving <span>→</span></Link>
        </div>
      ) : (
        <div className="cv-dashboard-achievement-grid">
          {achievements.slice(0, 6).map((item) => (
            <div key={item.code} title={item.description} className="cv-dashboard-achievement-item">
              <span className="cv-dashboard-achievement-icon">{item.icon || "🏅"}</span>
              <span className="min-w-0"><span className="cv-dashboard-achievement-name">{item.name}</span><span className="cv-dashboard-muted cv-dashboard-truncate">{item.description}</span></span>
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

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load dashboard"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className="cv-dashboard-page"><div className="cv-dashboard-loading"><span className="cv-dashboard-spinner" /> Preparing your developer space…</div></main>
  if (error) return <main className="cv-dashboard-page"><div className="cv-dashboard-error"><span className="cv-dashboard-error-icon">!</span><div><h2>We couldn’t load your dashboard</h2><p>{error}</p><button className="cv-dashboard-button" onClick={() => window.location.reload()}>Try again <span>↻</span></button></div></div></main>

  const username = data?.username || "developer"

  return (
    <main className="cv-dashboard-page">
      <section className="cv-dashboard-welcome cv-reveal">
        <div className="cv-dashboard-welcome-glow" aria-hidden="true" />
        <div className="cv-dashboard-welcome-copy">
          <span className="cv-dashboard-welcome-pill"><span className="cv-dashboard-live-dot" /> YOUR DEVELOPER SPACE</span>
          <h1>Welcome back, <span className="cv-dashboard-name">{username}</span> <span role="img" aria-label="waving hand">👋</span></h1>
          <p>Ready to forge something great today? Keep your momentum going.</p>
          <div className="cv-dashboard-welcome-actions"><Link to="/practice" className="cv-dashboard-button">Continue practicing <span>→</span></Link><Link to="/learning-path" className="cv-dashboard-quiet-link">View learning path <span>↗</span></Link></div>
        </div>
        <div className="cv-dashboard-code-card" aria-hidden="true">
          <div className="cv-dashboard-code-top"><span /><span /><span /><small>your-next-level.js</small></div>
          <pre><code><span className="cv-code-purple">const</span> progress = {'{'}{ '\n' }  consistency: <span className="cv-code-cyan">true</span>,{ '\n' }  mindset: <span className="cv-code-green">"keep building"</span>{ '\n'}{'}'};{ '\n\n'}progress.<span className="cv-code-blue">levelUp</span>();</code></pre>
          <div className="cv-dashboard-code-footer"><span className="cv-dashboard-code-status" /> All systems go <span>✦</span></div>
        </div>
      </section>

      <section className="cv-dashboard-stats" aria-label="Your coding statistics">
        <div className="cv-dashboard-stat-card"><div className="cv-dashboard-stat-icon cv-stat-purple">⌘</div><div className="cv-dashboard-stat-content"><p>Problems solved</p><strong>{data?.problemsSolved ?? 0}</strong><span className="cv-dashboard-stat-foot">Every solution counts</span></div><span className="cv-dashboard-stat-mark">↗</span></div>
        <div className="cv-dashboard-stat-card"><div className="cv-dashboard-stat-icon cv-stat-orange">🔥</div><div className="cv-dashboard-stat-content"><p>Current streak</p><strong>{data?.forgeStreakCurrent ?? 0}<small> days</small></strong><span className="cv-dashboard-stat-foot">Keep the streak alive</span></div><span className="cv-dashboard-stat-mark">✦</span></div>
        <div className="cv-dashboard-stat-card"><div className="cv-dashboard-stat-icon cv-stat-cyan">♛</div><div className="cv-dashboard-stat-content"><p>Community rank</p><strong>#{data?.rank ?? "—"}</strong><span className="cv-dashboard-stat-foot">Your place in CodeVerse</span></div><span className="cv-dashboard-stat-mark">↗</span></div>
      </section>

      <div className="cv-dashboard-section-label"><span>YOUR NEXT MOVE</span><span className="cv-dashboard-section-line" /></div>
      <section className="cv-dashboard-feature-grid">
        <Link to="/learning-path" className="cv-dashboard-feature cv-dashboard-feature-learning">
          <div className="cv-dashboard-feature-top"><span className="cv-dashboard-feature-icon">🧠</span><span className="cv-dashboard-feature-arrow">↗</span></div>
          <p className="cv-dashboard-eyebrow">PERSONALIZED FOR YOU</p><h2>Learning Path</h2>
          <p className="cv-dashboard-muted">A focused roadmap shaped around your progress and the skills you want to build.</p>
          <span className="cv-dashboard-feature-link">Explore your path <span>→</span></span>
        </Link>
        <Link to="/certificates" className="cv-dashboard-feature cv-dashboard-feature-certificates">
          <div className="cv-dashboard-feature-top"><span className="cv-dashboard-feature-icon">🏅</span><span className="cv-dashboard-feature-arrow">↗</span></div>
          <p className="cv-dashboard-eyebrow">CELEBRATE YOUR GROWTH</p><h2>Certificates</h2>
          <p className="cv-dashboard-muted">Turn your problem-solving milestones into certificates you can proudly share.</p>
          <span className="cv-dashboard-feature-link">View certificates <span>→</span></span>
        </Link>
      </section>

      <div className="cv-dashboard-section-label"><span>BUILD YOUR MOMENTUM</span><span className="cv-dashboard-section-line" /></div>
      <section className="cv-dashboard-lower-grid"><DailyChallengeCard /><AchievementsCard /></section>
    </main>
  )
}

export default Dashboard
