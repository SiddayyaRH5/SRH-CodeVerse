
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getProblems } from "../../api/problemApi"
import { getDashboard } from "../../api/dashboardApi"

const PATH = [
  {
    id: "java",
    title: "Java Foundations",
    icon: "☕",
    topics: ["java", "oop", "strings", "arrays", "collections", "exception"],
    description:
      "Build confidence with core Java, OOP and everyday problem-solving.",
  },
  {
    id: "dsa",
    title: "DSA & Problem Solving",
    icon: "🧠",
    topics: [
      "dsa",
      "array",
      "arrays",
      "string",
      "strings",
      "linked",
      "stack",
      "queue",
      "tree",
      "sorting",
      "search",
    ],
    description:
      "Strengthen algorithms and data structures through progressively harder problems.",
  },
  {
    id: "sql",
    title: "SQL & Databases",
    icon: "🗄️",
    topics: ["sql", "database", "jdbc", "mysql"],
    description:
      "Practice the database skills expected in real full-stack development.",
  },
  {
    id: "spring",
    title: "Spring Boot Backend",
    icon: "🌱",
    topics: ["spring", "spring boot", "springboot", "rest", "api", "hibernate", "jpa"],
    description:
      "Move from Java fundamentals into REST APIs, persistence and backend architecture.",
  },
  {
    id: "fullstack",
    title: "Full-Stack Builder",
    icon: "🚀",
    topics: ["react", "javascript", "frontend", "web", "html", "css", "full stack"],
    description:
      "Connect frontend skills with backend knowledge and ship complete applications.",
  },
]

function normalize(value) {
  return String(value || "").toLowerCase().trim()
}

function matchesTopic(problem, topics) {
  const topic = normalize(problem.topic)
  return topics.some((item) => topic.includes(item))
}

function LearningPath() {
  const [problems, setProblems] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProblems(), getDashboard()])
      .then(([problemResponse, dashboardResponse]) => {
        setProblems(problemResponse.data || [])
        setDashboard(dashboardResponse.data || null)
      })
      .catch((error) => {
        console.error("Failed to load learning path:", error)
        setProblems([])
        setDashboard(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const stages = useMemo(
    () =>
      PATH.map((stage, index) => {
        const relevant = problems.filter((problem) =>
          matchesTopic(problem, stage.topics)
        )

        const solved = relevant.filter((problem) => problem.solved).length
        const coverage = relevant.length
          ? Math.round((solved / relevant.length) * 100)
          : 0

        const target = relevant.length
          ? Math.max(3, Math.ceil(relevant.length * 0.7))
          : 0

        const completed = relevant.length > 0 && solved >= target

        return {
          ...stage,
          index,
          relevant,
          solved,
          coverage,
          target,
          completed,
        }
      }),
    [problems]
  )

  const next = stages.find((stage) => !stage.completed) || stages[stages.length - 1]

  const overall = stages.length
    ? Math.round(
        stages.reduce((sum, stage) => sum + stage.coverage, 0) / stages.length
      )
    : 0

  const streak = dashboard?.forgeStreakCurrent ?? 0

  if (loading) {
    return (
      <main className="cv-page">
        <div className="cv-panel h-64 animate-pulse rounded-2xl" />
      </main>
    )
  }

  return (
    <main className="cv-page mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page heading */}
      <header className="cv-reveal">
        <p className="cv-kicker">PERSONALIZED LEARNING PATH</p>

        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Your Developer Journey
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted)] sm:text-base">
              A learning path that reacts to the problems you actually solve.
              Finish each stage to progress through your CodeVerse journey.
            </p>
          </div>

          <div className="cv-pill w-fit shrink-0">
            ⚡ {overall}% journey coverage
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <section
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Learning path overview"
      >
        <div className="cv-stat-card min-w-0 rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)]">
            NEXT RECOMMENDATION
          </p>
          <p className="mt-2 text-xl font-black">
            {next?.title || "All stages"}
          </p>
          <p className="mt-2 text-xs text-[var(--cv-muted)]">
            {next?.solved || 0} solved · {next?.coverage || 0}% coverage
          </p>
        </div>

        <div className="cv-stat-card min-w-0 rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)]">
            CURRENT STREAK
          </p>
          <p className="mt-2 text-3xl font-black">{streak} 🔥</p>
          <p className="mt-1 text-xs text-[var(--cv-muted)]">
            Keep one focused practice session going each day.
          </p>
        </div>

        <div className="cv-stat-card min-w-0 rounded-2xl p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)]">
            CERTIFICATE TRACK
          </p>
          <p className="mt-2 text-xl font-black">
            {stages.filter((stage) => stage.completed).length} / {stages.length} ready
          </p>
          <Link
            to="/certificates"
            className="mt-2 inline-block text-xs font-bold text-violet-500 hover:text-violet-400"
          >
            View certificates →
          </Link>
        </div>
      </section>

      {/* Stage cards */}
      <section className="relative mt-10" aria-label="Learning stages">
        <div className="space-y-5">
          {stages.map((stage) => (
            <article
              key={stage.id}
              className="cv-panel cv-reveal min-w-0 overflow-hidden rounded-2xl p-5 sm:p-6 lg:p-7"
              style={{ animationDelay: `${stage.index * 70}ms` }}
            >
              <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
                {/* Icon and text are in normal document flow.
                    This prevents the icon from covering the heading. */}
                <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl ${
                      stage.completed
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-violet-500/25 bg-violet-500/10"
                    }`}
                    aria-hidden="true"
                  >
                    {stage.completed ? "✓" : stage.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h2 className="break-words text-lg font-black leading-snug sm:text-xl">
                        {stage.title}
                      </h2>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                          stage.completed
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-violet-500/10 text-violet-500"
                        }`}
                      >
                        {stage.completed ? "Completed" : `Stage ${stage.index + 1}`}
                      </span>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cv-muted)]">
                      {stage.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        to="/problems"
                        className="cv-secondary-btn !rounded-xl !px-4 !py-2.5 text-xs"
                      >
                        Practice this stage →
                      </Link>

                      {stage.completed && (
                        <Link
                          to="/certificates"
                          className="cv-primary-btn !rounded-xl !px-4 !py-2.5 text-xs"
                        >
                          View certificates
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress panel */}
                <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--cv-surface-2)]/40 p-4 lg:border-0 lg:bg-transparent lg:p-0">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[var(--cv-muted)]">
                      Problem mastery
                    </span>
                    <strong className="shrink-0">{stage.coverage}%</strong>
                  </div>

                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-surface-2)]"
                    role="progressbar"
                    aria-label={`${stage.title} problem mastery`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={stage.coverage}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${stage.coverage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-[var(--cv-muted)]">
                    {stage.solved} solved
                    {stage.relevant.length
                      ? ` · ${stage.target} target`
                      : " · No matching problems yet"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default LearningPath
