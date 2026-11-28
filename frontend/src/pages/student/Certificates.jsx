import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  claimCertificate,
  downloadCertificatePdf,
  getCertificates,
  getMyCertificates,
  saveCertificateAnswer,
  startCertificateAttempt,
  submitCertificateAttempt,
} from "../../api/certificateApi"

function formatTime(seconds) {
  const safe = Math.max(0, seconds || 0)
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`
}

function RequirementRow({ item }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-black ${
        item.met ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--cv-border)] text-[var(--cv-muted)]"
      }`}>
        {item.met ? "✓" : ""}
      </span>
      <div>
        <p className={item.met ? "font-bold text-[var(--cv-text)]" : "font-bold"}>{item.label}</p>
        <p className="text-xs text-[var(--cv-muted)]">{item.detail}</p>
      </div>
    </li>
  )
}

function CertificatePreview({ certificate, onClose }) {
  const date = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : ""
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true">
      <div className="grid min-h-full place-items-center">
        <div className="cv-cert-preview w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--cv-surface)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <p className="cv-kicker">EARNED CERTIFICATE</p>
              <p className="mt-1 text-sm text-[var(--cv-muted)]">{certificate.certificateNumber}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="cv-secondary-btn !px-3 !py-2 text-xs" onClick={() => window.print()}>
                Print / Save PDF
              </button>
              <button type="button" className="cv-icon-btn" onClick={onClose} aria-label="Close">✕</button>
            </div>
          </div>
          <div className="certificate-print p-6 sm:p-12">
            <div className="cv-cert-sheet relative overflow-hidden rounded-[24px] border-[3px] border-violet-500/60 p-6 text-center sm:p-12">
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
              <p className="text-sm font-black tracking-[.3em] text-violet-500">SRH CODEVERSE</p>
              <p className="mt-2 text-xs tracking-[.25em] text-[var(--cv-muted)]">LEARN. PRACTICE. BUILD. GROW.</p>
              <h2 className="mt-8 text-2xl font-black sm:text-4xl">Certificate of Achievement</h2>
              <p className="mt-5 text-sm text-[var(--cv-muted)]">This certifies that</p>
              <h3 className="cv-gradient-text mt-2 text-3xl font-black sm:text-4xl">{certificate.studentName}</h3>
              <p className="mt-4 text-sm text-[var(--cv-muted)]">has successfully completed the requirements for</p>
              <h4 className="mt-2 text-2xl font-black sm:text-3xl">{certificate.title}</h4>
              <p className="mx-auto mt-4 max-w-2xl text-xs leading-6 text-[var(--cv-muted)]">
                Awarded after verified learning progress, coding practice and a backend-scored certificate assessment.
              </p>
              <div className="mx-auto mt-8 grid max-w-xl gap-4 text-left sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Certificate ID</p>
                  <p className="mt-1 font-bold">{certificate.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Issued</p>
                  <p className="mt-1 font-bold">{date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Assessment score</p>
                  <p className="mt-1 font-bold">{certificate.scorePercent ?? "—"}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Verification code</p>
                  <p className="mt-1 break-all font-mono text-xs font-bold">{certificate.verificationCode}</p>
                </div>
              </div>
              <p className="mt-8 border-t border-[var(--color-border)] pt-4 text-[11px] text-[var(--cv-muted)]">
                Verify this certificate at /verify/{certificate.verificationCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttemptView({ attempt, onAnswer, onSubmit, onExit, busy, remaining, error }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const question = attempt.questions[activeIndex]
  const answered = attempt.questions.filter((item) => item.selectedOption !== null && item.selectedOption !== undefined).length

  return (
    <main className="cv-page cv-premium-page mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="cv-kicker">CERTIFICATE ASSESSMENT</p>
          <h1 className="text-2xl font-black">{attempt.certificateTitle}</h1>
          <p className="text-xs text-[var(--cv-muted)]">Attempt {attempt.attemptNumber} · {attempt.questions.length} questions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-xl px-3 py-2 font-mono text-sm font-bold ${remaining <= 60 ? "bg-red-500/10 text-red-400" : "bg-violet-500/10 text-violet-400"}`}>
            ⏱ {formatTime(remaining)}
          </span>
          <button type="button" className="cv-primary-btn !px-4 !py-2.5 text-xs" disabled={busy} onClick={onSubmit}>
            {busy ? "Submitting…" : "Submit assessment"}
          </button>
          <button type="button" className="cv-secondary-btn !px-3 !py-2.5 text-xs" onClick={onExit}>Exit</button>
        </div>
      </div>

      {error && <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="cv-panel">
          {question ? (
            <>
              <p className="text-xs font-bold text-[var(--cv-muted)]">Question {activeIndex + 1} of {attempt.questions.length}</p>
              <h2 className="mt-3 text-lg font-bold leading-7">{question.prompt}</h2>
              <div className="mt-5 grid gap-2">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAnswer(question.questionId, index)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      question.selectedOption === index
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-[var(--color-border)] hover:border-violet-500/40"
                    }`}
                  >
                    <span className="mr-2 font-mono text-xs font-black text-violet-400">{String.fromCharCode(65 + index)}</span>
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-between gap-2">
                <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((i) => i - 1)} className="cv-secondary-btn !px-4 !py-2 text-xs disabled:opacity-40">← Previous</button>
                <button type="button" disabled={activeIndex >= attempt.questions.length - 1} onClick={() => setActiveIndex((i) => i + 1)} className="cv-primary-btn !px-4 !py-2 text-xs disabled:opacity-40">Next →</button>
              </div>
            </>
          ) : <p className="text-sm text-[var(--cv-muted)]">No questions configured.</p>}
        </div>

        <aside className="cv-panel h-fit">
          <p className="text-xs font-black uppercase text-[var(--cv-muted)]">Progress</p>
          <p className="mt-1 text-sm font-bold">{answered} / {attempt.questions.length} answered</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {attempt.questions.map((item, index) => (
              <button
                key={item.questionId}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`grid h-9 place-items-center rounded-lg text-xs font-black ${
                  index === activeIndex
                    ? "bg-violet-500 text-white"
                    : item.selectedOption !== null && item.selectedOption !== undefined
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-[var(--cv-surface-2)] text-[var(--cv-muted)]"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--cv-muted)]">
            The assessment is scored on the backend when you submit. Answers cannot be changed afterwards.
          </p>
        </aside>
      </div>
    </main>
  )
}

function AttemptResult({ result, onBack, onClaim, onDownload, claiming, issued }) {
  return (
    <main className="cv-premium-page cv-page mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" className="cv-secondary-btn mb-4 !px-4 !py-2 text-xs" onClick={onBack}>← Back to certificates</button>
      <div className="cv-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="cv-kicker">{result.certificateTitle}</p>
            <h1 className="mt-1 text-3xl font-black">{result.passed ? "Assessment passed" : "Assessment not passed"}</h1>
            <p className="mt-2 text-sm text-[var(--cv-muted)]">
              {result.correctCount} correct out of {result.totalQuestions} · pass mark {result.passScore}%
              {result.timedOut ? " · submitted after the timer expired" : ""}
            </p>
          </div>
          <p className={`text-5xl font-black ${result.passed ? "text-emerald-500" : "text-amber-500"}`}>{result.scorePercent}%</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.passed && !issued && (
            <button type="button" className="cv-primary-btn !px-4 !py-2.5 text-xs" disabled={claiming} onClick={onClaim}>
              {claiming ? "Issuing…" : "Claim certificate"}
            </button>
          )}
          {issued && (
            <button type="button" className="cv-primary-btn !px-4 !py-2.5 text-xs" onClick={onDownload}>
              Download PDF
            </button>
          )}
          <button type="button" className="cv-secondary-btn !px-4 !py-2.5 text-xs" onClick={onBack}>Back to certificates</button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {result.questions.map((question, index) => (
          <div key={question.questionId} className="cv-panel">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[var(--cv-muted)]">Question {index + 1}</p>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${question.correct ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400"}`}>
                {question.correct ? "Correct" : "Incorrect"}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold">{question.prompt}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {question.options.map((option, optionIndex) => (
                <li key={option} className={`rounded-lg px-3 py-1.5 ${
                  optionIndex === question.correctOption
                    ? "bg-emerald-500/10 text-emerald-500"
                    : optionIndex === question.selectedOption
                      ? "bg-red-500/10 text-red-400"
                      : "text-[var(--cv-muted)]"
                }`}>
                  {String.fromCharCode(65 + optionIndex)}. {option}
                  {optionIndex === question.correctOption ? " ✓" : ""}
                  {optionIndex === question.selectedOption && optionIndex !== question.correctOption ? " (your answer)" : ""}
                </li>
              ))}
            </ul>
            {question.explanation && <p className="mt-2 text-xs leading-5 text-[var(--cv-muted)]">{question.explanation}</p>}
          </div>
        ))}
      </div>
    </main>
  )
}

export default function Certificates() {
  const [catalog, setCatalog] = useState({ items: [], earned: 0 })
  const [earned, setEarned] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState("catalog")
  const [attempt, setAttempt] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState(null)
  const [preview, setPreview] = useState(null)
  const [issuedForResult, setIssuedForResult] = useState(null)
  const autoSubmitted = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [catalogResponse, myResponse] = await Promise.all([getCertificates(), getMyCertificates()])
      setCatalog(catalogResponse.data)
      setEarned(myResponse.data.items || [])
    } catch (err) {
      // 401 = session expired/invalid; let axios interceptor handle unauthorized flow
      if (err?.response?.status === 401) {
        setError("")
      } else {
        setError(err?.response?.data?.message || "Unable to load certificates.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const attemptId = attempt?.id
  const attemptSeconds = attempt?.remainingSeconds

  useEffect(() => {
    if (!attemptId) return undefined
    setRemaining(attemptSeconds || 0)
    const timer = setInterval(() => setRemaining((current) => Math.max(0, current - 1)), 1000)
    return () => clearInterval(timer)
  }, [attemptId, attemptSeconds])

  useEffect(() => {
    if (!attempt || remaining > 0 || autoSubmitted.current) return
    autoSubmitted.current = true
    setBusy(true)
    submitCertificateAttempt(attempt.id)
      .then((response) => {
        setResult(response.data)
        setAttempt(null)
        setNotice("Time is up — your saved answers were submitted automatically.")
        load()
      })
      .catch((err) => setError(err?.response?.data?.message || "Unable to submit the assessment."))
      .finally(() => setBusy(false))
  }, [remaining, attempt, load])

  const start = async (slug) => {
    setBusy(true)
    setError("")
    setResult(null)
    setIssuedForResult(null)
    try {
      const response = await startCertificateAttempt(slug)
      autoSubmitted.current = false
      if (response.data.status === "IN_PROGRESS") {
        // Seed the countdown before the attempt renders so the auto-submit
        // effect never sees a fresh attempt with a stale zero timer.
        setRemaining(response.data.remainingSeconds || 0)
        setAttempt(response.data)
      } else {
        setError("This assessment attempt is no longer active.")
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to start the assessment.")
    } finally {
      setBusy(false)
    }
  }

  const answer = async (questionId, selectedOption) => {
    setAttempt((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        item.questionId === questionId ? { ...item, selectedOption } : item),
    }))
    try {
      await saveCertificateAnswer(attempt.id, questionId, selectedOption)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save this answer.")
    }
  }

  const submit = async () => {
    if (!window.confirm("Submit this assessment? You cannot change answers afterwards.")) return
    setBusy(true)
    setError("")
    try {
      const response = await submitCertificateAttempt(attempt.id)
      setResult(response.data)
      setAttempt(null)
      setNotice(response.data.passed ? "Assessment passed." : "Assessment submitted. Review your answers and try again if attempts remain.")
      load()
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to submit the assessment.")
    } finally {
      setBusy(false)
    }
  }

  const claim = async (slug) => {
    setBusy(true)
    setError("")
    try {
      const response = await claimCertificate(slug)
      setNotice("Certificate issued.")
      setIssuedForResult(response.data)
      setPreview(response.data)
      load()
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to issue the certificate.")
    } finally {
      setBusy(false)
    }
  }

  const download = async (certificateNumber) => {
    try {
      const response = await downloadCertificatePdf(certificateNumber)
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }))
      const link = document.createElement("a")
      link.href = url
      link.download = `${certificateNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to download the certificate PDF.")
    }
  }

  const activeCount = useMemo(() => earned.length, [earned])

  if (attempt) {
    return (
      <AttemptView
        attempt={attempt}
        remaining={remaining}
        busy={busy}
        error={error}
        onAnswer={answer}
        onSubmit={submit}
        onExit={() => setAttempt(null)}
      />
    )
  }

  if (result) {
    return (
      <AttemptResult
        result={result}
        issued={issuedForResult}
        claiming={busy}
        onBack={() => { setResult(null); setIssuedForResult(null) }}
        onClaim={() => claim(result.certificateSlug)}
        onDownload={() => download((issuedForResult || {}).certificateNumber)}
      />
    )
  }

  return (
    <main className="cv-cert-home cv-premium-page cv-page mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="cv-reveal">
        <p className="cv-kicker">VERIFIED CREDENTIALS</p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Certificates</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted)] sm:text-base">
              Eligibility is calculated by the backend from your lessons, solved problems and interview results.
              Pass the assessment, then claim a certificate that can be verified publicly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="cv-pill">{activeCount} earned</span>
            <span className="cv-pill">{catalog.items.length} tracks</span>
          </div>
        </div>
      </header>

      {notice && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{notice}</div>}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button type="button" className="ml-3 font-bold underline" onClick={load}>Retry</button>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => setTab("catalog")} className={tab === "catalog" ? "cv-primary-btn !px-4 !py-2 text-xs" : "cv-secondary-btn !px-4 !py-2 text-xs"}>
          Certificate tracks
        </button>
        <button type="button" onClick={() => setTab("earned")} className={tab === "earned" ? "cv-primary-btn !px-4 !py-2 text-xs" : "cv-secondary-btn !px-4 !py-2 text-xs"}>
          My certificates ({earned.length})
        </button>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="cv-panel h-80 animate-pulse rounded-2xl" />)}
        </div>
      ) : tab === "earned" ? (
        <section className="mt-6">
          {earned.length === 0 ? (
            <div className="cv-panel py-14 text-center">
              <p className="text-4xl">🏅</p>
              <h2 className="mt-3 text-xl font-black">No certificates earned yet</h2>
              <p className="mt-2 text-sm text-[var(--cv-muted)]">Complete a track, pass its assessment and claim your first certificate.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {earned.map((certificate) => (
                <div key={certificate.certificateNumber} className="cv-panel">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-emerald-500">Earned · {certificate.status}</p>
                      <h2 className="mt-1 text-xl font-black">{certificate.title}</h2>
                      <p className="mt-1 text-xs text-[var(--cv-muted)]">{certificate.certificateNumber}</p>
                    </div>
                    <span className="text-2xl">🏅</span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--cv-muted)]">
                    Issued {new Date(certificate.issuedAt).toLocaleDateString()} · Score {certificate.scorePercent ?? "—"}%
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className="cv-secondary-btn !px-3 !py-2 text-xs" onClick={() => setPreview(certificate)}>View</button>
                    <button type="button" className="cv-primary-btn !px-3 !py-2 text-xs" onClick={() => download(certificate.certificateNumber)}>Download PDF</button>
                    <Link to={`/verify/${certificate.verificationCode}`} className="cv-secondary-btn !px-3 !py-2 text-xs">Verify page</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-6 grid gap-5 md:grid-cols-2">
          {catalog.items.map((item) => {
            const status = item.issued
              ? "Earned"
              : item.eligible
                ? "Ready to claim"
                : item.preparationMet
                  ? "Assessment available"
                  : "Locked"
            const tone = item.issued
              ? "text-emerald-500 bg-emerald-500/10"
              : item.preparationMet
                ? "text-violet-400 bg-violet-500/10"
                : "text-[var(--cv-muted)] bg-[var(--cv-surface-2)]"
            return (
              <article key={item.slug} className="cv-cert-track cv-panel flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-sm font-black text-violet-400">
                      {item.icon}
                    </span>
                    <div>
                      <h2 className="text-xl font-black">{item.title}</h2>
                      <p className="text-xs text-[var(--cv-muted)]">{item.category}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${tone}`}>{status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--cv-muted)]">{item.description}</p>
                <div className="mt-4 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--cv-surface-2)]/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[var(--cv-muted)]">Requirements</p>
                  <ul className="mt-3 space-y-3">
                    {item.requirements.map((requirement) => <RequirementRow key={requirement.key} item={requirement} />)}
                  </ul>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.issued ? (
                    <>
                      <button type="button" className="cv-secondary-btn !px-3 !py-2 text-xs" onClick={() => setPreview(item.certificate)}>View</button>
                      <button type="button" className="cv-primary-btn !px-3 !py-2 text-xs" onClick={() => download(item.certificate.certificateNumber)}>Download PDF</button>
                    </>
                  ) : item.eligible ? (
                    <button type="button" className="cv-primary-btn !px-4 !py-2.5 text-xs" disabled={busy} onClick={() => claim(item.slug)}>
                      {busy ? "Issuing…" : "Claim certificate"}
                    </button>
                  ) : item.preparationMet ? (
                    <button type="button" className="cv-primary-btn !px-4 !py-2.5 text-xs" disabled={busy} onClick={() => start(item.slug)}>
                      {busy ? "Starting…" : item.usedAttempts > 0 ? "Retake assessment" : "Start assessment"}
                    </button>
                  ) : (
                    <span className="rounded-lg bg-[var(--cv-surface-2)] px-3 py-2 text-xs text-[var(--cv-muted)]">
                      Complete the requirements above to unlock the assessment
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--cv-muted)]">
                    {item.usedAttempts}/{item.attemptLimit} attempts · pass {item.assessmentPassScore}%
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {preview && <CertificatePreview certificate={preview} onClose={() => setPreview(null)} />}
    </main>
  )
}
