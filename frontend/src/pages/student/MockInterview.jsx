import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"

const BANK = {
  Java: [
    ["What is the difference between == and .equals() in Java?", ["== compares references for objects, while .equals() compares values.", "Both always compare values.", ".equals() only works for primitives.", "== is used only for strings."], 0],
    ["Which collection gives average O(1) key lookup?", ["ArrayList", "HashMap", "LinkedList", "TreeSet"], 1],
    ["What is method overloading?", ["Same method name with different parameters", "Same method in different classes only", "Changing a variable type", "Overriding a final method"], 0],
  ],
  DSA: [
    ["What is the average time complexity of binary search on a sorted array?", ["O(n)", "O(log n)", "O(n log n)", "O(1)"], 1],
    ["Which structure is ideal for BFS?", ["Stack", "Queue", "Heap", "Set"], 1],
    ["What is the typical complexity of HashSet membership?", ["O(1) average", "O(n²)", "O(log n) always", "O(n log n) always"], 0],
  ],
  SQL: [
    ["Which clause filters grouped rows?", ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], 2],
    ["Which JOIN keeps all rows from the left table?", ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"], 1],
    ["What does COUNT(*) count?", ["Only non-null IDs", "Rows", "Columns", "Distinct values only"], 1],
  ],
  "Spring Boot": [
    ["Which annotation marks a class as a REST controller?", ["@Entity", "@Service", "@RestController", "@Repository"], 2],
    ["What is dependency injection used for?", ["Hard-code dependencies", "Provide required collaborators to a class", "Create database tables", "Compile Java faster"], 1],
    ["Which layer commonly owns business rules?", ["Controller", "Service", "DTO", "Repository"], 1],
  ],
  React: [
    ["Which hook stores local component state?", ["useState", "useMemo", "useRef only", "useRoute"], 0],
    ["What is a controlled input?", ["An input whose value is driven by React state", "An input with no events", "A server-only input", "A CSS component"], 0],
    ["Why use a key when rendering a list?", ["Help React identify list items", "Encrypt data", "Create CSS", "Fetch API data"], 0],
  ],
  HR: [
    ["Tell me about a project you are proud of.", ["Use STAR: situation, task, action, result", "Only describe the technology names", "Give a one-word answer", "Skip the result"], 0],
    ["How do you handle a bug you cannot immediately solve?", ["Reproduce, isolate, inspect evidence, test one hypothesis at a time", "Change everything at once", "Ignore it", "Delete the feature"], 0],
    ["Why should a team hire you as a fresher?", ["Connect your skills, projects, learning ability and examples", "Say you need no training", "Only discuss salary", "Avoid project examples"], 0],
  ],
}

const CATEGORY_ICONS = {
  Java: "☕",
  DSA: "🧠",
  SQL: "🗄️",
  "Spring Boot": "🌱",
  React: "⚛",
  HR: "🎤",
}

export default function MockInterview() {
  const [category, setCategory] = useState("Java")
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [seconds, setSeconds] = useState(15 * 60)
  const questions = BANK[category]
  const finished = index >= questions.length
  const score = useMemo(() => {
    if (questions.length === 0) return 0
    const correct = questions.reduce((sum, q, i) => sum + (answers[i] === q[2] ? 1 : 0), 0)
    return Math.round((correct / questions.length) * 100)
  }, [answers, questions])

  useEffect(() => {
    if (!started || finished || seconds <= 0) return
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [started, finished, seconds])

  const begin = () => {
    setStarted(true)
    setIndex(0)
    setAnswers({})
    setSeconds(15 * 60)
  }
  const choose = (option) => setAnswers((a) => ({ ...a, [index]: option }))
  const next = () => setIndex((i) => i + 1)
  const reset = () => {
    setStarted(false)
    setIndex(0)
    setAnswers({})
    setSeconds(15 * 60)
  }
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="INTERVIEW PREP"
          title="Mock Interview Studio"
          description="Practice a focused technical round, track your score and learn where to improve."
          actions={
            <>
              <span className="cv-pill">
                <span className="w-2 h-2 rounded-full bg-[var(--cv-primary)] mr-2" />
                {started && !finished && (
                  <span className="font-mono text-xl font-black text-[var(--cv-primary)]">
                    ⏱ {time}
                  </span>
                )}
              </span>
            </>
          }
        />

        {!started ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-9">
            {Object.keys(BANK).map((name) => (
              <button
                key={name}
                onClick={() => setCategory(name)}
                className={`cv-stat-card flex flex-col items-center gap-4 min-w-0 ${category === name ? "border-violet-500/50 shadow-violet-500/10" : ""}`}
              >
                <span className="text-3xl">{CATEGORY_ICONS[name]}</span>
                <h2 className="text-xl font-black mt-5">{name}</h2>
                <p className="text-xs text-[var(--cv-muted)] mt-1">
                  {BANK[name].length} questions · 15 min
                </p>
                <div className="mt-5 text-[var(--cv-primary)] text-sm font-bold">
                  Select round →
                </div>
              </button>
            ))}
            <div className="md:col-span-2 xl:col-span-3 cv-stat-card rounded-3xl p-7 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[var(--cv-primary)] uppercase tracking-wider">
                    SELECTED
                  </p>
                  <h2 className="text-2xl font-black mt-1">{category} Mock Interview</h2>
                  <span className="text-[var(--cv-primary)] text-xs font-bold bg-violet-500/10 px-3 py-1 rounded-md inline-block mt-1">
                    LOCAL PRACTICE ONLY — NOT BACKEND-SCORED
                  </span>
                  <p className="text-sm text-[var(--cv-muted)] mt-1">
                    {BANK[category].length} questions · timed practice · instant score
                  </p>
                </div>
                <button onClick={begin} className="cv-primary-btn">
                  Start Interview →
                </button>
              </div>
            </div>
          </div>
        ) : finished || seconds === 0 ? (
          <div className="cv-stat-card rounded-3xl p-8 text-center mt-9">
            <div className="w-20 h-20 mx-auto rounded-3xl grid place-items-center bg-gradient-to-br from-violet-600 to-cyan-500 text-white text-3xl">
              ✓
            </div>
            <p className="cv-kicker mt-6">ROUND COMPLETE</p>
            <h2 className="text-4xl font-black mt-2">{score}%</h2>
            <p className="text-[var(--cv-muted)] mt-2">
              You scored {Math.round(score / 10)} / 10 readiness points in the{" "}
              {category} round.
            </p>
            <div className="max-w-xl mx-auto grid sm:grid-cols-3 gap-3 mt-8 text-left">
              <div className="rounded-2xl bg-[var(--cv-surface-2)] p-4">
                <b className="text-[var(--cv-text-primary)]">Score</b>
                <p className="text-xs text-[var(--cv-muted)] mt-1">
                  {score}% accuracy
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--cv-surface-2)] p-4">
                <b className="text-[var(--cv-text-primary)]">Time</b>
                <p className="text-xs text-[var(--cv-muted)] mt-1">{time}</p>
              </div>
              <div className="rounded-2xl bg-[var(--cv-surface-2)] p-4">
                <b className="text-[var(--cv-text-primary)]">Category</b>
                <p className="text-xs text-[var(--cv-muted)] mt-1">{category}</p>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              <button onClick={reset} className="cv-secondary-btn">
                Try Again
              </button>
              <Link to="/dashboard" className="cv-primary-btn">
                Back to Dashboard →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <aside className="cv-stat-card rounded-2xl p-5 min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold text-[var(--cv-primary)] uppercase tracking-wider">
                    QUESTION {index + 1} OF {questions.length}
                  </p>
                  <h3 className="text-xl font-black mt-2">{questions[index][0]}</h3>
                </div>
                <span
                  className={`text-xs font-bold rounded-full px-3 py-1 ${
                    answers[index] === questions[index][2]
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-violet-500/10 text-[var(--cv-primary)]"
                  }`}
                >
                  {answers[index] !== undefined
                    ? answers[index] === questions[index][2]
                      ? "Correct"
                      : "Incorrect"
                    : "Not answered"}
                </span>
              </div>
              <ul className="space-y-3">
                {questions[index][1].map((option, i) => (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition ${answers[index] === i
                      ? "border-violet-500 bg-violet-500 text-white shadow-sm shadow-violet-500/20"
                      : "border-[var(--cv-border)] bg-[var(--cv-surface-2)] text-[var(--cv-text)] hover:border-violet-500/50 hover:text-[var(--cv-text-primary)]"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {option}
                  </button>
                ))}
              </ul>
              <div className="mt-6 flex gap-2">
                {index > 0 && (
                  <button
                    onClick={() => setIndex((i) => i - 1)}
                    className="cv-secondary-btn flex-1 !py-2.5"
                  >
                    Previous
                  </button>
                )}
                <button onClick={next} className="cv-primary-btn flex-1 !py-2.5">
                  Next →
                </button>
              </div>
            </aside>

            <section className="lg:col-span-2">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="cv-kicker">PROGRESS</p>
                  <h2 className="text-2xl font-black">{Math.round(score)}%</h2>
                </div>
                <span className="text-xs font-bold text-[var(--cv-primary)]">
                  {index + 1} / {questions.length}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[var(--cv-muted)] mb-4">
                <span>Time remaining: {time}</span>
                <span>
                  {Object.values(answers).filter((a) => a !== undefined).length} /{" "}
                  {questions.length} answered
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--cv-surface-2)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                  style={{ width: `${Math.round((index + 1) / questions.length * 100)}%` }}
                />
              </div>
              <div className="mt-6">
                {answers[index] !== undefined ? (
                  <div
                    className={`rounded-lg border px-4 py-3 ${
                      answers[index] === questions[index][2]
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                    }`}
                  >
                    <p className="font-bold">
                      {answers[index] === questions[index][2]
                        ? "Correct!"
                        : "Incorrect"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--cv-muted)]">
                      The correct answer is:{questions[index][1][questions[index][2]]}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--cv-muted)]">
                    Select an answer to see if you're correct.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </PageContainer>
    </main>
  )
}