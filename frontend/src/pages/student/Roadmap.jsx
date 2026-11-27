import { useCallback, useEffect, useState } from "react"
import {
  enrollRoadmap,
  getRoadmap,
  getRoadmaps,
  unenrollRoadmap,
  updateRoadmapTopic,
} from "../../api/roadmapApi"

const DIFFICULTIES = ["ALL", "Beginner", "Intermediate", "Advanced"]

function ProgressBar({ value, className = "" }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-[var(--cv-surface-2)] ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
      />
    </div>
  )
}

function StatusPill({ status }) {
  const styles = {
    COMPLETED: "bg-emerald-500/10 text-emerald-500",
    IN_PROGRESS: "bg-violet-500/10 text-violet-500",
    AVAILABLE: "bg-cyan-500/10 text-cyan-500",
    LOCKED: "bg-slate-500/10 text-[var(--cv-muted)]",
  }
  const labels = {
    COMPLETED: "Completed",
    IN_PROGRESS: "In progress",
    AVAILABLE: "Available",
    LOCKED: "Locked",
  }
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles[status] || styles.LOCKED}`}>
      {labels[status] || status}
    </span>
  )
}

function RoadmapCard({ roadmap, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(roadmap.slug)}
      className="cv-roadmap-card cv-panel group flex h-full flex-col text-left transition hover:-translate-y-0.5 hover:border-violet-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-sm font-black text-violet-400">
          {roadmap.icon || "CV"}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[var(--cv-surface-2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-muted)]">
            {roadmap.difficulty}
          </span>
          {roadmap.enrolled && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
              {roadmap.status === "COMPLETED" ? "Completed" : "Enrolled"}
            </span>
          )}
        </div>
      </div>
      <h2 className="mt-5 text-xl font-black leading-tight">{roadmap.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--cv-muted)]">{roadmap.shortDescription}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {roadmap.skills.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-lg bg-[var(--cv-surface-2)] px-2 py-1 text-[11px] text-[var(--cv-muted)]">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-[var(--cv-muted)]">{roadmap.completedTopics} / {roadmap.topicCount} topics</span>
          <strong>{roadmap.progressPercent}%</strong>
        </div>
        <ProgressBar value={roadmap.progressPercent} />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-[var(--cv-muted)]">
        <span>{roadmap.stageCount} stages · {roadmap.estimatedHours}h</span>
        <span className="font-bold text-violet-400 group-hover:text-violet-300">
          {roadmap.enrolled ? "Continue →" : "View roadmap →"}
        </span>
      </div>
    </button>
  )
}

function RoadmapDetail({ roadmap, busy, onBack, onEnroll, onUnenroll, onToggleTopic }) {
  const [openStages, setOpenStages] = useState(() => {
    const first = roadmap.stages.find((s) => s.status === "IN_PROGRESS" || s.status === "AVAILABLE")
    return first ? { [first.id]: true } : {}
  })

  const toggleStage = (id) => setOpenStages((current) => ({ ...current, [id]: !current[id] }))

  return (
    <div className="cv-roadmap-detail">
      <button type="button" onClick={onBack} className="cv-secondary-btn mb-5 !px-4 !py-2 text-xs">
        ← Back to roadmap library
      </button>

      <div className="cv-panel overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="cv-kicker">{roadmap.category} ROADMAP</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{roadmap.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--cv-muted)]">{roadmap.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roadmap.skills.map((skill) => (
                <span key={skill} className="rounded-lg bg-[var(--cv-surface-2)] px-2.5 py-1 text-xs text-[var(--cv-muted)]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--cv-surface-2)]/50 p-4 lg:w-72">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--cv-muted)]">Overall progress</span>
              <strong>{roadmap.progressPercent}%</strong>
            </div>
            <ProgressBar value={roadmap.progressPercent} className="mt-3" />
            <p className="mt-2 text-xs text-[var(--cv-muted)]">
              {roadmap.completedTopics} of {roadmap.totalTopics} topics completed
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!roadmap.enrolled ? (
                <button type="button" disabled={busy} onClick={onEnroll} className="cv-primary-btn !px-4 !py-2.5 text-xs">
                  {busy ? "Starting…" : "Start roadmap"}
                </button>
              ) : roadmap.status === "COMPLETED" ? (
                <span className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-500">
                  Roadmap completed
                </span>
              ) : (
                <span className="rounded-xl bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-400">
                  In progress
                </span>
              )}
              {roadmap.enrolled && roadmap.completedTopics === 0 && (
                <button type="button" disabled={busy} onClick={onUnenroll} className="cv-secondary-btn !px-3 !py-2.5 text-xs">
                  Leave roadmap
                </button>
              )}
            </div>
            {roadmap.nextTopic && (
              <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-violet-400">Next recommended</p>
                <p className="mt-1 text-sm font-bold">{roadmap.nextTopic.title}</p>
                <p className="mt-1 text-xs text-[var(--cv-muted)]">{roadmap.nextTopic.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cv-roadmap-timeline mt-6 space-y-4">
        {roadmap.stages.map((stage) => {
          const open = !!openStages[stage.id]
          return (
            <section key={stage.id} className="cv-roadmap-stage cv-panel">
              <button
                type="button"
                onClick={() => toggleStage(stage.id)}
                className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
                aria-expanded={open}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--cv-surface-2)] font-mono text-sm font-bold">
                    {String(stage.order).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{stage.title}</h2>
                      <StatusPill status={stage.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--cv-muted)]">{stage.description}</p>
                    {stage.status === "LOCKED" && (
                      <p className="mt-1 text-xs text-amber-500">
                        Complete stage {stage.prerequisites.join(", ")} first.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="w-28">
                    <div className="mb-1 flex justify-between text-[11px] text-[var(--cv-muted)]">
                      <span>{stage.completedTopics}/{stage.totalTopics}</span>
                      <span>{stage.progressPercent}%</span>
                    </div>
                    <ProgressBar value={stage.progressPercent} />
                  </div>
                  <span className="text-[var(--cv-muted)]">{open ? "▲" : "▼"}</span>
                </div>
              </button>

              {open && (
                <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                  <div className="mb-4 grid gap-3 text-xs text-[var(--cv-muted)] sm:grid-cols-3">
                    <p><span className="font-bold text-[var(--cv-text)]">Skills:</span> {stage.skills.join(", ") || "—"}</p>
                    <p><span className="font-bold text-[var(--cv-text)]">Time:</span> {stage.estimatedHours}h</p>
                    <p><span className="font-bold text-[var(--cv-text)]">Done when:</span> {stage.completionCriteria}</p>
                  </div>
                  <ul className="space-y-2">
                    {stage.topics.map((topic) => (
                      <li key={topic.id} className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--cv-surface-2)]/30 p-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <button
                            type="button"
                            disabled={busy || !roadmap.enrolled || stage.status === "LOCKED"}
                            onClick={() => onToggleTopic(topic)}
                            aria-label={topic.completed ? `Mark ${topic.title} incomplete` : `Mark ${topic.title} complete`}
                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-black ${
                              topic.completed
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-[var(--cv-border)] bg-[var(--cv-surface)]"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {topic.completed ? "✓" : ""}
                          </button>
                          <div className="min-w-0">
                            <p className={`text-sm font-bold ${topic.completed ? "text-[var(--cv-muted)] line-through" : ""}`}>
                              {topic.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[var(--cv-muted)]">{topic.description}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 pl-8 sm:pl-0">
                          <span className="text-[11px] text-[var(--cv-muted)]">{topic.estimatedMinutes} min</span>
                          {topic.resourceUrl && (
                            <a
                              href={topic.resourceUrl}
                              target={topic.resourceUrl.startsWith("http") ? "_blank" : undefined}
                              rel="noreferrer"
                              className="text-[11px] font-bold text-violet-400 hover:text-violet-300"
                            >
                              {topic.resourceTitle || "Open resource"} ↗
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default function Roadmap() {
  const [catalog, setCatalog] = useState({ items: [], categories: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("ALL")
  const [difficulty, setDifficulty] = useState("ALL")
  const [selectedSlug, setSelectedSlug] = useState("")
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")

  const loadCatalog = useCallback(async (term) => {
    setLoading(true)
    setError("")
    try {
      const response = await getRoadmaps({
        search: term || undefined,
        category: category === "ALL" ? undefined : category,
        difficulty: difficulty === "ALL" ? undefined : difficulty,
      })
      setCatalog(response.data)
    } catch (err) {
      // 401 = session expired/invalid; clear auth and redirect to login
      if (err?.response?.status === 401) {
        setError("")
        // Let the axios interceptor handle the unauthorized flow
        // The AuthProvider will redirect to /login?reason=session-expired
      } else {
        setError(err?.response?.data?.message || "Unable to load roadmaps.")
      }
    } finally {
      setLoading(false)
    }
  }, [category, difficulty])

  useEffect(() => {
    const timer = setTimeout(() => loadCatalog(search), 250)
    return () => clearTimeout(timer)
  }, [search, loadCatalog])

  const openRoadmap = async (slug) => {
    setSelectedSlug(slug)
    setDetail(null)
    setDetailLoading(true)
    setError("")
    try {
      const response = await getRoadmap(slug)
      setDetail(response.data)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load this roadmap.")
      setSelectedSlug("")
    } finally {
      setDetailLoading(false)
    }
  }

  const refreshDetail = async () => {
    if (!selectedSlug) return
    const response = await getRoadmap(selectedSlug)
    setDetail(response.data)
    loadCatalog(search)
  }

  const runAction = async (action, successMessage) => {
    setBusy(true)
    setError("")
    try {
      await action()
      await refreshDetail()
      if (successMessage) {
        setNotice(successMessage)
        setTimeout(() => setNotice(""), 2500)
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (selectedSlug) {
    return (
      <main className="cv-page cv-premium-page mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {detailLoading && <div className="cv-panel h-64 animate-pulse rounded-2xl" />}
        {!detailLoading && detail && (
          <RoadmapDetail
            roadmap={detail}
            busy={busy}
            onBack={() => { setSelectedSlug(""); setDetail(null) }}
            onEnroll={() => runAction(() => enrollRoadmap(detail.slug), "Roadmap started")}
            onUnenroll={() => runAction(async () => {
              await unenrollRoadmap(detail.slug)
              setSelectedSlug("")
              setDetail(null)
            }, "Roadmap removed")}
            onToggleTopic={(topic) => runAction(
              () => updateRoadmapTopic(detail.slug, topic.id, !topic.completed),
              topic.completed ? "Topic reopened" : "Topic completed",
            )}
          />
        )}
        {!detailLoading && !detail && error && (
          <div className="cv-panel">
            <p className="text-sm text-red-400">{error}</p>
            <button type="button" className="cv-secondary-btn mt-4 !px-4 !py-2 text-xs" onClick={() => openRoadmap(selectedSlug)}>
              Retry
            </button>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="cv-roadmap-home cv-premium-page cv-page mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="cv-reveal">
        <p className="cv-kicker">CAREER ROADMAPS</p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Choose your path</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted)] sm:text-base">
              Structured career roadmaps with ordered stages, prerequisites and progress saved to your account.
              Every completion is recorded on the server so you can resume on any device.
            </p>
          </div>
          <span className="cv-pill w-fit">{catalog.total} roadmaps</span>
        </div>
      </header>

      <div className="cv-panel mt-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[var(--cv-muted)]">Search</span>
            <input
              className="cv-input w-full"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search roadmaps or skills…"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[var(--cv-muted)]">Category</span>
            <select className="cv-input w-full" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="ALL">All categories</option>
              {catalog.categories.map((item) => (
                <option key={item.name} value={item.name}>{item.name} ({item.count})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[var(--cv-muted)]">Difficulty</span>
            <select className="cv-input w-full" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              {DIFFICULTIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      {notice && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{notice}</div>}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button type="button" className="ml-3 font-bold underline" onClick={() => loadCatalog(search)}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="cv-panel h-72 animate-pulse rounded-2xl" />)}
        </div>
      ) : catalog.items.length === 0 ? (
        <div className="cv-panel mt-6 py-16 text-center">
          <p className="text-4xl">🗺️</p>
          <h2 className="mt-4 text-xl font-black">No roadmaps match your filters</h2>
          <p className="mt-2 text-sm text-[var(--cv-muted)]">Try a different search term or clear the filters.</p>
          <button
            type="button"
            className="cv-secondary-btn mt-5 !px-4 !py-2 text-xs"
            onClick={() => { setSearch(""); setCategory("ALL"); setDifficulty("ALL") }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {catalog.items.map((roadmap) => (
            <RoadmapCard key={roadmap.slug} roadmap={roadmap} onOpen={openRoadmap} />
          ))}
        </div>
      )}
    </main>
  )
}
