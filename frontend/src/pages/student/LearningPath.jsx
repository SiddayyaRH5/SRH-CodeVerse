import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getProblems } from "../../api/problemApi"
import { getDashboard } from "../../api/dashboardApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import { SkeletonCards } from "../../components/common/Skeleton"

const PATH = [
  {
    id: "java",
    title: "Java Foundations",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" />
      </svg>
    ),
    topics: ["java", "oop", "strings", "arrays", "collections", "exception"],
    description: "Build confidence with core Java, OOP and everyday problem-solving.",
  },
  {
    id: "dsa",
    title: "DSA & Problem Solving",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="14" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    topics: ["dsa", "array", "arrays", "string", "strings", "linked", "stack", "queue", "tree", "sorting", "search"],
    description: "Strengthen algorithms and data structures through progressively harder problems.",
  },
  {
    id: "sql",
    title: "SQL & Databases",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 0-4 1l1.5 7.5L12 21" />
      </svg>
    ),
    topics: ["sql", "database", "jdbc", "mysql"],
    description: "Practice the database skills expected in real full-stack development.",
  },
  {
    id: "spring",
    title: "Spring Boot Backend",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    topics: ["spring", "spring boot", "springboot", "rest", "api", "hibernate", "jpa"],
    description: "Move from Java fundamentals into REST APIs, persistence and backend architecture.",
  },
  {
    id: "fullstack",
    title: "Full-Stack Builder",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    topics: ["react", "javascript", "frontend", "web", "html", "css", "full stack"],
    description: "Connect frontend skills with backend knowledge and ship complete applications.",
  },
]

function normalize(value) {
  return String(value || "").toLowerCase().trim()
}

function matchesTopic(problem, topics) {
  const topic = normalize(problem.topic)
  return topics.some((item) => topic.includes(item))
}

export default function LearningPath() {
  const [problems, setProblems] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [problemResponse, dashboardResponse] = await Promise.all([
        getProblems(),
        getDashboard(),
      ])
      setProblems(problemResponse.data || [])
      setDashboard(dashboardResponse.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load learning path.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stages = useMemo(
    () =>
      PATH.map((stage, index) => {
        const relevant = problems.filter((problem) => matchesTopic(problem, stage.topics))
        const solved = relevant.filter((problem) => problem.solved).length
        const coverage = relevant.length ? Math.round((solved / relevant.length) * 100) : 0
        const target = relevant.length ? Math.max(3, Math.ceil(relevant.length * 0.7)) : 0
        const completed = relevant.length > 0 && solved >= target
        return { ...stage, index, relevant, solved, coverage, target, completed }
      }),
    [problems]
  )

  const next = stages.find((stage) => !stage.completed) || stages[stages.length - 1]
  const overall = stages.length ? Math.round(stages.reduce((sum, stage) => sum + stage.coverage, 0) / stages.length) : 0
  const streakValue = dashboard?.forgeStreakCurrent

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={5} />
        </PageContainer>
      </main>
    )
  }

  if (error) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl" aria-hidden="true">!</div>
            <h2 className="mt-5 text-lg font-bold">{error}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">Please check your connection and try again.</p>
            <button type="button" onClick={loadData} className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Try again</button>
          </div>
        </PageContainer>
      </main>
    )
  }

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="PERSONALIZED LEARNING PATH"
          title="Your Developer Journey"
          description="A learning path that reacts to the problems you actually solve. Finish each stage to progress through your CodeVerse journey."
          actions={
            <>
              <div className="cv-pill">
                <span className="w-2 h-2 rounded-full bg-[var(--cv-primary)] mr-2" /> {overall}% journey coverage
              </div>
            </>
          }
        />

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Learning path overview">
          <div className="cv-section-panel min-w-0 rounded-2xl p-5">
            <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)] uppercase">Next recommendation</p>
            <p className="mt-2 text-xl font-black">{next?.title || "All stages"}</p>
            <p className="mt-2 text-xs text-[var(--cv-muted)]">{next?.solved ?? 0} solved · {next?.coverage ?? 0}% coverage</p>
          </div>
          <div className="cv-section-panel min-w-0 rounded-2xl p-5">
            <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)] uppercase">Current streak</p>
            <p className="mt-2 text-3xl font-black">{streakValue === undefined || streakValue === null ? "—" : streakValue}</p>
            <p className="mt-1 text-xs text-[var(--cv-muted)]">Keep one focused practice session going each day.</p>
          </div>
          <div className="cv-section-panel min-w-0 rounded-2xl p-5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)] uppercase">Certificate track</p>
            <p className="mt-2 text-xl font-black">{stages.filter((stage) => stage.completed).length} / {stages.length} ready</p>
            <Link to="/certificates" className="mt-2 inline-block text-xs font-bold text-[var(--cv-primary)] underline hover:text-violet-300">View certificates →</Link>
          </div>
        </section>

        <section className="relative mt-10" aria-label="Learning stages">
          <div className="space-y-5">
            {stages.map((stage) => (
              <article key={stage.id} className="cv-section-panel min-w-0 overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-7" style={{ animationDelay: `${stage.index * 70}ms` }}>
                <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
                  <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl ${
                      stage.completed ? "border-emerald-500/30 bg-emerald-500/10" : "border-violet-500/25 bg-violet-500/10"
                    }`} aria-hidden="true">
                      {stage.completed ? <span className="text-emerald-600 font-bold">✓</span> : stage.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h2 className="break-words text-lg font-black leading-snug sm:text-xl">{stage.title}</h2>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                          stage.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-violet-500/10 text-[var(--cv-primary)]"
                        }`}>
                          {stage.completed ? "Completed" : `Stage ${stage.index + 1}`}
                        </span>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cv-muted)]">{stage.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link to="/problems" className="text-xs font-bold text-[var(--cv-primary)] underline hover:text-violet-300">
                          Practice this stage →
                        </Link>
                        {stage.completed && (
                          <Link to="/certificates" className="ml-2 text-xs font-bold text-[var(--cv-primary)] underline hover:text-violet-300">
                            View certificates
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)]/40 p-4 lg:border-0 lg:bg-transparent lg:p-0">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[var(--cv-muted)]">Problem mastery</span>
                      <strong className="shrink-0">{stage.coverage}%</strong>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-surface-2)]" role="progressbar" aria-label={`${stage.title} problem mastery`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage.coverage}>
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${stage.coverage}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-[var(--cv-muted)]">
                      {stage.solved} solved
                      {stage.relevant.length ? ` · ${stage.target} target` : " · No matching problems yet"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  )
}