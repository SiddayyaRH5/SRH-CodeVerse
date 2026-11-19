import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import EmptyState from "../../components/common/EmptyState"
import { SkeletonCards } from "../../components/common/Skeleton"
import { getProblems } from "../../api/problemApi"

const ROADMAP_STAGES = [
  {
    id: "java-fundamentals",
    title: "Java Fundamentals",
    description: "Core Java syntax, OOP, collections, and exception handling.",
    icon: "☕",
    topics: ["java", "oop", "strings", "arrays", "collections", "exception"],
  },
  {
    id: "dsa",
    title: "DSA & Problem Solving",
    description: "Algorithms and data structures through progressively harder problems.",
    icon: "🧠",
    topics: ["dsa", "array", "arrays", "string", "strings", "linked", "stack", "queue", "tree", "sorting", "search"],
  },
  {
    id: "sql",
    title: "SQL & Databases",
    description: "Database skills expected in real full-stack development.",
    icon: "🗄️",
    topics: ["sql", "database", "jdbc", "mysql"],
  },
  {
    id: "spring-boot",
    title: "Spring Boot Backend",
    description: "REST APIs, persistence, and production backend architecture.",
    icon: "🌱",
    topics: ["spring", "spring boot", "springboot", "rest", "api", "hibernate", "jpa"],
  },
  {
    id: "full-stack",
    title: "Full-Stack Builder",
    description: "Connect frontend skills with backend knowledge and ship complete applications.",
    icon: "🚀",
    topics: ["react", "javascript", "frontend", "web", "html", "css", "full stack"],
  },
]

function normalize(value) {
  return String(value || "").toLowerCase().trim()
}

function matchesTopic(problem, topics) {
  const topic = normalize(problem.topic)
  return topics.some((item) => topic.includes(item))
}

export default function Roadmap() {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const problemResponse = await getProblems()
      setProblems(problemResponse.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load roadmap data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stages = useMemo(
    () =>
      ROADMAP_STAGES.map((stage, index) => {
        const relevant = problems.filter((problem) => matchesTopic(problem, stage.topics))
        const solved = relevant.filter((problem) => problem.solved).length
        const coverage = relevant.length ? Math.round((solved / relevant.length) * 100) : 0
        return { ...stage, index, relevant, solved, coverage }
      }),
    [problems]
  )

  const overallStages = stages.length
  const completedStages = stages.filter((stage) => stage.coverage >= 70).length
  const overall = overallStages ? Math.round((completedStages / overallStages) * 100) : 0

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
          <EmptyState
            icon="!"
            title={error}
            description="Please check your connection and try again."
            actionLabel="Try again"
            action={loadData}
            className="max-w-md mx-auto mt-20"
          />
        </PageContainer>
      </main>
    )
  }

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="PERSONAL LEARNING PATH"
          title="Developer Roadmap"
          description="A practical Java full-stack path from fundamentals to production-ready backend development."
          actions={
            <>
              <span className="cv-pill">
                <span className="w-2 h-2 rounded-full bg-[var(--cv-primary)] mr-2" /> {overall}% complete
              </span>
            </>
          }
        />

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Roadmap stages">
          {stages.map((stage) => {
            const completed = stage.coverage >= 70
            return (
              <article
                key={stage.id}
                className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-7 border border-[var(--cv-border)] bg-[var(--cv-surface)] transition-all hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/10`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl ${
                      completed
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-violet-500/25 bg-violet-500/10"
                    }`} aria-hidden="true">
                      {completed ? <span className="text-emerald-600 font-bold">✓</span> : stage.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h2 className="break-words text-lg font-black leading-snug sm:text-xl">{stage.title}</h2>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                          completed
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-violet-500/10 text-[var(--cv-primary)]"
                        }`}>
                          {completed ? "Completed" : `Stage ${stage.index + 1}`}
                        </span>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cv-muted)]">{stage.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                          to="/problems"
                          className="text-xs font-bold text-[var(--cv-primary)] underline hover:text-violet-300"
                        >
                          Practice this stage →
                        </Link>
                        {completed && (
                          <Link
                            to="/certificates"
                            className="ml-2 text-xs font-bold text-[var(--cv-primary)] underline hover:text-violet-300"
                          >
                            View certificates
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)]/40 p-4">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[var(--cv-muted)]">Stage coverage</span>
                      <strong className="shrink-0">{stage.coverage}%</strong>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-surface-2)]" role="progressbar" aria-label={`${stage.title} coverage`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stage.coverage}>
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${stage.coverage}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-[var(--cv-muted)]">
                      {stage.solved} solved
                      {stage.relevant.length ? ` · ${Math.max(3, Math.ceil(stage.relevant.length * 0.7))} target` : " · No matching problems yet"}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <div className="mt-10">
          <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6">
            <h3 className="text-lg font-bold mb-4">Your Progress</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <span className="text-[var(--cv-primary)] font-bold text-2xl">{completedStages}</span>
                <p className="mt-1 text-xs text-[var(--cv-muted)]">Stages Completed</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[var(--cv-primary)] font-bold text-2xl">{overallStages}</span>
                <p className="mt-1 text-xs text-[var(--cv-muted)]">Total Stages</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[var(--cv-primary)] font-bold text-2xl">{overall}%</span>
                <p className="mt-1 text-xs text-[var(--cv-muted)]">Overall Progress</p>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </main>
  )
}