import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getProblems } from "../../api/problemApi"
import { getDashboard } from "../../api/dashboardApi"

const PATH = [
  { id: "java", title: "Java Foundations", icon: "☕", topics: ["java", "oop", "strings", "arrays", "collections", "exception"], description: "Build confidence with core Java, OOP and everyday problem-solving." },
  { id: "dsa", title: "DSA & Problem Solving", icon: "🧠", topics: ["dsa", "array", "arrays", "string", "strings", "linked", "stack", "queue", "tree", "sorting", "search"], description: "Strengthen algorithms and data structures through progressively harder problems." },
  { id: "sql", title: "SQL & Databases", icon: "🗄️", topics: ["sql", "database", "jdbc", "mysql"], description: "Practice the database skills expected in real full-stack development." },
  { id: "spring", title: "Spring Boot Backend", icon: "🌱", topics: ["spring", "spring boot", "springboot", "rest", "api", "hibernate", "jpa"], description: "Move from Java fundamentals into REST APIs, persistence and backend architecture." },
  { id: "fullstack", title: "Full-Stack Builder", icon: "🚀", topics: ["react", "javascript", "frontend", "web", "html", "css", "full stack"], description: "Connect frontend skills with backend knowledge and ship complete applications." },
]

function normalize(value) { return String(value || "").toLowerCase().trim() }
function matchesTopic(problem, topics) {
  const topic = normalize(problem.topic)
  return topics.some((item) => topic.includes(item))
}

export default function LearningPath() {
  const [problems, setProblems] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProblems(), getDashboard()])
      .then(([p, d]) => { setProblems(p.data || []); setDashboard(d.data || null) })
      .catch(() => { setProblems([]); setDashboard(null) })
      .finally(() => setLoading(false))
  }, [])

  const stages = useMemo(() => PATH.map((stage, index) => {
    const relevant = problems.filter((problem) => matchesTopic(problem, stage.topics))
    const solved = relevant.filter((problem) => problem.solved).length
    const coverage = relevant.length ? Math.round((solved / relevant.length) * 100) : 0
    const target = relevant.length ? Math.max(3, Math.ceil(relevant.length * 0.7)) : 0
    const completed = relevant.length > 0 && solved >= target
    return { ...stage, index, relevant, solved, coverage, target, completed }
  }), [problems])

  const next = stages.find((stage) => !stage.completed) || stages[stages.length - 1]
  const overall = stages.length ? Math.round(stages.reduce((sum, stage) => sum + stage.coverage, 0) / stages.length) : 0
  const streak = dashboard?.forgeStreakCurrent ?? 0

  if (loading) return <div className="cv-page"><div className="cv-panel animate-pulse h-64" /></div>

  return (
    <div className="cv-page">
      <div className="cv-reveal">
        <p className="cv-kicker">PERSONALIZED LEARNING PATH</p>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mt-2">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black">Your Developer Journey</h1>
            <p className="text-[var(--cv-muted)] mt-3 max-w-2xl">A learning path that reacts to the problems you actually solve. Finish each stage to unlock the next level of your CodeVerse journey.</p>
          </div>
          <div className="cv-pill">⚡ {overall}% journey coverage</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="cv-stat-card rounded-2xl p-5"><p className="text-xs text-[var(--cv-muted)]">NEXT RECOMMENDATION</p><p className="font-black text-xl mt-2">{next?.title}</p><p className="text-xs text-[var(--cv-muted)] mt-2">{next?.solved || 0} solved · {next?.coverage || 0}% coverage</p></div>
        <div className="cv-stat-card rounded-2xl p-5"><p className="text-xs text-[var(--cv-muted)]">CURRENT STREAK</p><p className="font-black text-3xl mt-2">{streak} 🔥</p><p className="text-xs text-[var(--cv-muted)] mt-1">Keep one focused session going each day.</p></div>
        <div className="cv-stat-card rounded-2xl p-5"><p className="text-xs text-[var(--cv-muted)]">CERTIFICATE TRACK</p><p className="font-black text-xl mt-2">{stages.filter((stage) => stage.completed).length} / {stages.length} ready</p><Link to="/certificates" className="text-xs text-violet-500 font-bold inline-block mt-2">View certificates →</Link></div>
      </div>

      <div className="mt-10 relative">
        <div className="absolute left-6 top-7 bottom-7 w-px bg-gradient-to-b from-violet-500 via-blue-500 to-cyan-400 opacity-40 hidden sm:block" />
        <div className="space-y-5">
          {stages.map((stage) => (
            <div key={stage.id} className="cv-panel relative sm:pl-20 cv-reveal" style={{ animationDelay: `${stage.index * 70}ms` }}>
              <div className={`absolute left-4 top-6 w-12 h-12 rounded-2xl grid place-items-center text-xl border hidden sm:grid ${stage.completed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-violet-500/10 border-violet-500/25"}`}>{stage.completed ? "✓" : stage.icon}</div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex gap-4">
                  <div className="sm:hidden w-12 h-12 rounded-2xl bg-violet-500/10 grid place-items-center shrink-0">{stage.completed ? "✓" : stage.icon}</div>
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">{stage.title}</h2><span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${stage.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-violet-500"}`}>{stage.completed ? "Completed" : `Stage ${stage.index + 1}`}</span></div><p className="text-sm text-[var(--cv-muted)] mt-2 max-w-xl">{stage.description}</p></div>
                </div>
                <div className="w-full lg:w-72">
                  <div className="flex justify-between text-xs mb-2"><span className="text-[var(--cv-muted)]">Problem mastery</span><strong>{stage.coverage}%</strong></div>
                  <div className="h-2 rounded-full bg-[var(--cv-surface-2)] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all" style={{ width: `${stage.coverage}%` }} /></div>
                  <p className="text-[10px] text-[var(--cv-muted)] mt-2">{stage.solved} solved{stage.relevant.length ? ` · ${stage.target} target` : " · No matching problems yet"}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/problems" className="cv-secondary-btn !py-2.5 !px-4 text-xs">Practice this stage →</Link>
                {stage.completed && <Link to="/certificates" className="cv-primary-btn !py-2.5 !px-4 text-xs">Claim certificate</Link>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
