import { useState } from "react"
import { Link } from "react-router-dom"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"

const ROUNDS = [
  {
    id: "java-fundamentals",
    name: "Java Fundamentals",
    icon: "☕",
    level: "Easy → Medium",
    minutes: 30,
    questions: 15,
    topics: "OOP · Collections · Exceptions",
  },
  {
    id: "dsa-sprint",
    name: "DSA Sprint",
    icon: "⚡",
    level: "Medium",
    minutes: 45,
    questions: 5,
    topics: "Arrays · Strings · Hashing",
  },
  {
    id: "sql-challenge",
    name: "SQL Challenge",
    icon: "▦",
    level: "Easy → Hard",
    minutes: 35,
    questions: 12,
    topics: "Joins · Subqueries · Aggregates",
  },
  {
    id: "backend-round",
    name: "Backend Round",
    icon: "⬡",
    level: "Medium",
    minutes: 40,
    questions: 10,
    topics: "Spring Boot · REST · JPA",
  },
]

export default function InterviewArena() {
  const [active, setActive] = useState(null)
  const [started, setStarted] = useState(false)
  const tips = [
    "Explain your approach before optimizing.",
    "Test edge cases before you submit.",
    "Keep variable names readable under pressure.",
    "Communicate your thought process out loud.",
    "Start with a brute-force solution, then improve.",
  ]

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="SRH CODEVERSE · CAREER MODE"
          title="Interview Arena"
          description="Practice realistic technical rounds without leaving your learning workspace."
        />

        <div className="grid md:grid-cols-2 gap-4 mt-9">
          {ROUNDS.map((r, i) => (
            <button
              key={r.name}
              onClick={() => setActive(i)}
              className={`cv-stat-card flex flex-col items-center gap-4 min-w-0 ${active === i ? "border-violet-500/50 shadow-violet-500/10" : ""}`}
            >
              <div className="flex justify-between">
                <span className="text-3xl">{r.icon}</span>
                <span className="text-xs text-[var(--cv-primary)]">{r.level}</span>
              </div>
              <h2 className="font-bold text-xl mt-5">{r.name}</h2>
              <p className="text-sm text-[var(--cv-muted)] mt-2">{r.topics}</p>
              <div className="flex gap-5 text-xs text-[var(--cv-muted)] mt-5">
                <span>◷ {r.minutes} min</span>
                <span>◎ {r.questions} questions</span>
              </div>
            </button>
          ))}
        </div>

        {active !== null && (
          <div className="cv-stat-card rounded-2xl p-6 mt-5 border-violet-500/30">
            <div className="flex flex-wrap justify-between gap-4 items-center">
              <div>
                <p className="text-xs text-[var(--cv-primary)]">SELECTED ROUND</p>
                <h3 className="text-xl font-bold mt-1">{ROUNDS[active].name}</h3>
              </div>
              <button
                onClick={() => {
                  setActive(active)
                  setStarted(true)
                }}
                disabled={started}
                className={`cv-primary-btn ${started ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {started ? "Round Ready ✓" : "Start Mock Round →"}
              </button>
            </div>
            {started && (
              <div className="mt-5 p-4 rounded-xl bg-[var(--cv-surface-2)] text-sm text-[var(--cv-muted)]">
                <p className="font-semibold mb-2">Practice tips for this round:</p>
                <p className="mb-2">{tips[active % tips.length]}</p>
                <div className="mt-3 flex gap-2">
                  <Link to="/problems" className="cv-secondary-btn">Practice Problems →</Link>
                  <Link to="/learning-path" className="cv-secondary-btn">Learning Path →</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </main>
  )
}