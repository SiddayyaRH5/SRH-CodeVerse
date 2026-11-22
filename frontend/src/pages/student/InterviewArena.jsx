import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  getInterviewAnalytics,
  getInterviewCategories,
  getInterviewHistory,
  getInterviewResult,
  getInterviewSession,
  saveInterviewAnswer,
  startInterviewSession,
  submitInterviewSession,
} from "../../api/interviewApi"

const DIFFICULTIES = ["MIXED", "EASY", "MEDIUM", "HARD"]
const MODES = ["TIMED", "PRACTICE"]

function formatTime(seconds) {
  const safe = Math.max(0, seconds || 0)
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

function ScoreRing({ value }) {
  const score = Math.max(0, Math.min(100, value || 0))
  return (
    <div className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(#7c3aed ${score * 3.6}deg, var(--cv-surface-2) 0deg)` }}>
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--cv-surface)]">
        <span className="text-2xl font-black">{score}%</span>
      </div>
    </div>
  )
}

export default function InterviewArena() {
  const [searchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [history, setHistory] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState("setup")
  const [session, setSession] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [result, setResult] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const autoSubmitted = useRef(false)

  const [form, setForm] = useState({
    category: searchParams.get("category") || "JAVA",
    difficulty: "MIXED",
    questionCount: 10,
    durationMinutes: 20,
    mode: "TIMED",
  })

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [categoryResponse, historyResponse, analyticsResponse] = await Promise.all([
        getInterviewCategories(),
        getInterviewHistory({ size: 10 }),
        getInterviewAnalytics(),
      ])
      setCategories(categoryResponse.data || [])
      setHistory(historyResponse.data.items || [])
      setAnalytics(analyticsResponse.data)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load the interview arena.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOverview() }, [loadOverview])

  const sessionId = session?.id
  const sessionSeconds = session?.remainingSeconds

  useEffect(() => {
    if (view !== "session" || !sessionId) return undefined
    setRemaining(sessionSeconds || 0)
    const timer = setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [view, sessionId, sessionSeconds])

  useEffect(() => {
    if (view !== "session" || !session || remaining > 0 || autoSubmitted.current) return
    autoSubmitted.current = true
    setBusy(true)
    submitInterviewSession(session.id)
      .then((response) => {
        setResult(response.data)
        setView("result")
        setNotice("Time is up — your saved answers were submitted automatically.")
        loadOverview()
      })
      .catch((err) => setError(err?.response?.data?.message || "Unable to submit the interview."))
      .finally(() => setBusy(false))
  }, [remaining, view, session, loadOverview])

  const start = async () => {
    setBusy(true)
    setError("")
    try {
      const response = await startInterviewSession({
        category: form.category,
        difficulty: form.difficulty,
        questionCount: Number(form.questionCount),
        durationMinutes: Number(form.durationMinutes),
        mode: form.mode,
      })
      autoSubmitted.current = false
      setRemaining(response.data.remainingSeconds || 0)
      setSession(response.data)
      setActiveIndex(0)
      setResult(null)
      setView("session")
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to start the interview.")
    } finally {
      setBusy(false)
    }
  }

  const updateQuestion = (sessionQuestionId, patch) => {
    setSession((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.sessionQuestionId === sessionQuestionId ? { ...question, ...patch } : question),
    }))
  }

  const save = async (question, patch, showSaved = false) => {
    const payload = {
      selectedOption: patch.selectedOption !== undefined ? patch.selectedOption : question.selectedOption,
      answerText: patch.answerText !== undefined ? patch.answerText : question.answerText,
      flagged: patch.flagged !== undefined ? patch.flagged : question.flagged,
    }
    updateQuestion(question.sessionQuestionId, { ...patch, answered: true })
    try {
      await saveInterviewAnswer(session.id, question.sessionQuestionId, payload)
      if (showSaved) {
        setNotice("Answer saved")
        setTimeout(() => setNotice(""), 1500)
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save this answer.")
    }
  }

  const submit = async () => {
    if (!window.confirm("Submit this interview? You will not be able to change your answers afterwards.")) return
    setBusy(true)
    setError("")
    try {
      const response = await submitInterviewSession(session.id)
      setResult(response.data)
      setView("result")
      setNotice(response.data.timedOut ? "Submitted after the timer expired." : "Interview submitted.")
      loadOverview()
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to submit the interview.")
    } finally {
      setBusy(false)
    }
  }

  const openHistory = async (item) => {
    setBusy(true)
    setError("")
    try {
      if (item.status === "IN_PROGRESS") {
        const response = await getInterviewSession(item.id)
        autoSubmitted.current = false
        // Seed the countdown before the session renders so the auto-submit
        // effect never sees a resumed session with a stale zero timer.
        setRemaining(response.data.remainingSeconds || 0)
        setSession(response.data)
        setActiveIndex(0)
        setView("session")
      } else {
        const response = await getInterviewResult(item.id)
        setResult(response.data)
        setView("result")
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to open this session.")
    } finally {
      setBusy(false)
    }
  }

  const activeQuestion = session?.questions?.[activeIndex]
  const answeredCount = useMemo(
    () => (session?.questions || []).filter((question) => question.answered).length,
    [session],
  )

  if (view === "session" && session) {
    return (
      <main className="cv-page mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="cv-kicker">{session.category} · {session.difficulty}</p>
            <h1 className="text-2xl font-black">Interview in progress</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-xl px-3 py-2 font-mono text-sm font-bold ${remaining <= 60 ? "bg-red-500/10 text-red-400" : "bg-violet-500/10 text-violet-400"}`}>
              ⏱ {formatTime(remaining)}
            </span>
            <button type="button" className="cv-primary-btn !px-4 !py-2.5 text-xs" disabled={busy} onClick={submit}>
              {busy ? "Submitting…" : "Submit interview"}
            </button>
          </div>
        </div>

        {notice && <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">{notice}</div>}
        {error && <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="cv-panel">
            {activeQuestion ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--cv-muted)]">
                    Question {activeIndex + 1} of {session.questions.length} · {activeQuestion.topic} · {activeQuestion.difficulty}
                  </span>
                  <button
                    type="button"
                    onClick={() => save(activeQuestion, { flagged: !activeQuestion.flagged })}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${activeQuestion.flagged ? "bg-amber-500/15 text-amber-500" : "bg-[var(--cv-surface-2)] text-[var(--cv-muted)]"}`}
                  >
                    {activeQuestion.flagged ? "⚑ Flagged" : "⚐ Flag"}
                  </button>
                </div>
                <h2 className="mt-4 text-lg font-bold leading-7">{activeQuestion.prompt}</h2>

                {activeQuestion.options?.length > 0 ? (
                  <div className="mt-5 grid gap-2">
                    {activeQuestion.options.map((option, index) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => save(activeQuestion, { selectedOption: index })}
                        className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                          activeQuestion.selectedOption === index
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-[var(--color-border)] hover:border-violet-500/40"
                        }`}
                      >
                        <span className="mr-2 font-mono text-xs font-black text-violet-400">{String.fromCharCode(65 + index)}</span>
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5">
                    <textarea
                      className={`cv-input min-h-48 w-full resize-y ${activeQuestion.type === "CODING" ? "font-mono text-xs" : ""}`}
                      placeholder={activeQuestion.type === "HR"
                        ? "Use the STAR structure: situation, task, action, result…"
                        : "Write your answer…"}
                      value={activeQuestion.answerText || ""}
                      onChange={(event) => updateQuestion(activeQuestion.sessionQuestionId, { answerText: event.target.value })}
                      onBlur={() => save(activeQuestion, {})}
                    />
                    <button type="button" className="cv-secondary-btn mt-2 !px-3 !py-2 text-xs" onClick={() => save(activeQuestion, {}, true)}>
                      Save answer
                    </button>
                    {activeQuestion.type === "HR" && (
                      <p className="mt-2 text-xs text-[var(--cv-muted)]">
                        Behavioural answers are not auto-scored. A reference answer and rubric are shown in the review.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-between gap-2">
                  <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((i) => i - 1)} className="cv-secondary-btn !px-4 !py-2 text-xs disabled:opacity-40">
                    ← Previous
                  </button>
                  <button
                    type="button"
                    disabled={activeIndex >= session.questions.length - 1}
                    onClick={() => setActiveIndex((i) => i + 1)}
                    className="cv-primary-btn !px-4 !py-2 text-xs disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--cv-muted)]">No questions in this session.</p>
            )}
          </div>

          <aside className="cv-panel h-fit">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--cv-muted)]">Progress</p>
            <p className="mt-1 text-sm font-bold">{answeredCount} / {session.questions.length} answered</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {session.questions.map((question, index) => (
                <button
                  key={question.sessionQuestionId}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`grid h-9 place-items-center rounded-lg text-xs font-black ${
                    index === activeIndex
                      ? "bg-violet-500 text-white"
                      : question.flagged
                        ? "bg-amber-500/20 text-amber-500"
                        : question.answered
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-[var(--cv-surface-2)] text-[var(--cv-muted)]"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-xs text-[var(--cv-muted)]">
              <p>Mode: {session.mode}</p>
              <p>Duration: {session.durationMinutes} minutes</p>
              <p>Answers autosave as you move through the round.</p>
            </div>
          </aside>
        </div>
      </main>
    )
  }

  if (view === "result" && result) {
    return (
      <main className="cv-page mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button type="button" className="cv-secondary-btn mb-4 !px-4 !py-2 text-xs" onClick={() => { setView("setup"); setResult(null); loadOverview() }}>
          ← Back to interview arena
        </button>
        <div className="cv-panel">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="cv-kicker">{result.category} · {result.difficulty}</p>
              <h1 className="mt-1 text-3xl font-black">{result.passed === false ? "Interview review" : "Interview result"}</h1>
              <p className="mt-2 text-sm text-[var(--cv-muted)]">
                {result.maxPoints === 0
                  ? "This behavioural round is marked for self review. Use the reference answers and rubric below."
                  : `${result.correctCount} correct out of ${result.scoredQuestions} auto-scored questions.`}
                {result.timedOut ? " The session was submitted after the timer expired." : ""}
              </p>
            </div>
            {result.maxPoints === 0 ? (
              <span className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm font-black text-amber-500">
                Self review
              </span>
            ) : (
              <ScoreRing value={result.scorePercent} />
            )}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--cv-surface-2)]/50 p-3">
              <p className="text-[10px] font-black uppercase text-[var(--cv-muted)]">Earned points</p>
              <p className="mt-1 text-lg font-black">{result.earnedPoints}/{result.maxPoints}</p>
            </div>
            <div className="rounded-xl bg-[var(--cv-surface-2)]/50 p-3">
              <p className="text-[10px] font-black uppercase text-[var(--cv-muted)]">Questions</p>
              <p className="mt-1 text-lg font-black">{result.totalQuestions}</p>
            </div>
            <div className="rounded-xl bg-[var(--cv-surface-2)]/50 p-3">
              <p className="text-[10px] font-black uppercase text-[var(--cv-muted)]">Submitted</p>
              <p className="mt-1 text-sm font-bold">{result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "—"}</p>
            </div>
          </div>

          {result.strengths.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-emerald-500">Strengths</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {result.strengths.map((item) => <li key={item.topic}>{item.topic}: {item.correct}/{item.total} ({item.percent}%)</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-amber-500">Areas to improve</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {result.weaknesses.length === 0 ? <li>No weak topics in this round.</li> : result.weaknesses.map((item) => (
                    <li key={item.topic}>{item.topic}: {item.correct}/{item.total} ({item.percent}%)</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-[10px] font-black uppercase text-violet-400">Recommended next practice</p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--cv-muted)]">
                {result.recommendations.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {result.questions.map((question) => (
            <div key={question.sessionQuestionId} className="cv-panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--cv-muted)]">Question {question.order} · {question.topic} · {question.type}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                  question.correct ? "bg-emerald-500/10 text-emerald-500" : question.reviewStatus === "SELF_REVIEW" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-400"
                }`}>
                  {question.reviewStatus}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold">{question.prompt}</p>
              {question.options?.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {question.options.map((option, index) => (
                    <li key={option} className={`rounded-lg px-3 py-1.5 ${
                      index === question.correctOption
                        ? "bg-emerald-500/10 text-emerald-500"
                        : index === question.selectedOption
                          ? "bg-red-500/10 text-red-400"
                          : "text-[var(--cv-muted)]"
                    }`}>
                      {String.fromCharCode(65 + index)}. {option}
                      {index === question.correctOption ? " ✓" : ""}
                      {index === question.selectedOption && index !== question.correctOption ? " (your answer)" : ""}
                    </li>
                  ))}
                </ul>
              )}
              {question.answerText && (
                <div className="mt-3 rounded-lg bg-[var(--cv-surface-2)] p-3 text-sm">
                  <p className="text-[10px] font-black uppercase text-[var(--cv-muted)]">Your answer</p>
                  <p className="mt-1 whitespace-pre-line">{question.answerText}</p>
                </div>
              )}
              {question.referenceAnswer && (
                <div className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm">
                  <p className="text-[10px] font-black uppercase text-cyan-400">Reference answer</p>
                  <p className="mt-1 whitespace-pre-line text-[var(--cv-muted)]">{question.referenceAnswer}</p>
                </div>
              )}
              {question.explanation && <p className="mt-2 text-xs leading-5 text-[var(--cv-muted)]">{question.explanation}</p>}
            </div>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="cv-page mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="cv-reveal">
        <p className="cv-kicker">INTERVIEW PREPARATION</p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Interview Arena</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted)] sm:text-base">
              Start a timed or practice interview, answer from a real backend question bank, and get
              deterministic scoring plus a full review. Every session is saved to your history.
            </p>
          </div>
          <span className="cv-pill w-fit">{categories.reduce((sum, item) => sum + item.questionCount, 0)} questions</span>
        </div>
      </header>

      {notice && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{notice}</div>}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button type="button" className="ml-3 font-bold underline" onClick={loadOverview}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="cv-panel h-40 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(analytics?.categories || []).slice(0, 4).map((item) => (
              <div key={item.category} className="cv-stat-card rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-[var(--cv-muted)]">{item.category}</p>
                <p className="mt-2 text-2xl font-black">{item.bestScore}%</p>
                <p className="text-xs text-[var(--cv-muted)]">{item.attempts} attempts · avg {item.averageScore}%</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <h2 className="text-xl font-black">Choose a round</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                  <button
                    key={category.code}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, category: category.code }))}
                    className={`cv-panel text-left transition ${
                      form.category === category.code ? "border-violet-500/60 ring-1 ring-violet-500/30" : "hover:border-violet-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black">{category.name}</h3>
                      <span className="rounded-full bg-[var(--cv-surface-2)] px-2 py-1 text-[10px] font-bold text-[var(--cv-muted)]">
                        {category.questionCount} Q
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--cv-muted)]">
                      Easy {category.easy} · Medium {category.medium} · Hard {category.hard}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <aside className="cv-panel h-fit">
              <h2 className="text-lg font-black">Session setup</h2>
              <p className="mt-1 text-xs text-[var(--cv-muted)]">Selected: {form.category}</p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[var(--cv-muted)]">Difficulty</span>
                  <select className="cv-input w-full" value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}>
                    {DIFFICULTIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[var(--cv-muted)]">Questions</span>
                  <input type="number" min="5" max="30" className="cv-input w-full" value={form.questionCount} onChange={(event) => setForm((current) => ({ ...current, questionCount: event.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[var(--cv-muted)]">Duration (minutes)</span>
                  <input type="number" min="5" max="120" className="cv-input w-full" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-[var(--cv-muted)]">Mode</span>
                  <select className="cv-input w-full" value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}>
                    {MODES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <button type="button" className="cv-primary-btn w-full !py-3 text-sm" disabled={busy} onClick={start}>
                  {busy ? "Starting…" : "Start interview"}
                </button>
                <p className="text-[11px] leading-5 text-[var(--cv-muted)]">
                  Timed mode counts down and auto-submits when time expires. Answers are saved to the backend as you go.
                </p>
              </div>
            </aside>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">Previous attempts</h2>
            {history.length === 0 ? (
              <div className="cv-panel mt-3 py-10 text-center">
                <p className="text-3xl">🎤</p>
                <p className="mt-2 text-sm text-[var(--cv-muted)]">No interview sessions yet. Start a round above.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openHistory(item)}
                    className="cv-panel flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold">{item.category} · {item.difficulty} · {item.questionCount} questions</p>
                      <p className="text-xs text-[var(--cv-muted)]">
                        {new Date(item.startedAt).toLocaleString()} · {item.durationMinutes} min · {item.mode}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                        item.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {item.status === "IN_PROGRESS" ? "Resume" : "Review"}
                      </span>
                      {item.scorePercent !== null && item.scorePercent !== undefined && (
                        <span className="text-sm font-black">{item.scorePercent}%</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
