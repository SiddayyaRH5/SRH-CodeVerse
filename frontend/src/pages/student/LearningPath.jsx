import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  completeLearningLesson,
  enrollLearningCourse,
  getLearningBookmarks,
  getLearningCourse,
  getLearningCourses,
  getLearningLesson,
  getLearningProgress,
  getLearningRecommendations,
  getMyLearning,
  saveLessonNote,
  toggleLessonBookmark,
} from "../../api/learningApi"

const LEARNING_RESOURCES = ["courses", "progress", "my", "bookmarks", "recommendations"]

const RESOURCE_LABELS = {
  courses: "Course library",
  progress: "Progress",
  my: "Continue learning",
  bookmarks: "Bookmarks",
  recommendations: "Recommendations",
}

function resourceErrorMessage(key, err) {
  return err?.response?.data?.message || `Unable to load ${RESOURCE_LABELS[key].toLowerCase()}.`
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--cv-surface-2)]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
      />
    </div>
  )
}

function parseQuiz(raw) {
  if (!raw) return []
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function Quiz({ questions }) {
  const [answers, setAnswers] = useState({})
  if (!questions.length) return null
  return (
    <div className="mt-4 space-y-4">
      {questions.map((question, index) => {
        const selected = answers[index]
        return (
          <div key={`${question.question}-${index}`} className="rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-sm font-bold">{index + 1}. {question.question}</p>
            <div className="mt-3 grid gap-2">
              {(question.options || []).map((option, optionIndex) => {
                const isSelected = selected === optionIndex
                const isCorrect = question.answer === optionIndex
                const reveal = selected !== undefined
                const tone = !reveal
                  ? "border-[var(--color-border)]"
                  : isCorrect
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : isSelected
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-[var(--color-border)]"
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${tone}`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {selected !== undefined && (
              <p className={`mt-2 text-xs font-bold ${selected === question.answer ? "text-emerald-500" : "text-red-400"}`}>
                {selected === question.answer ? "Correct" : `Not quite — the answer is: ${(question.options || [])[question.answer]}`}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function LearningPath() {
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState(null)
  const [my, setMy] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [status, setStatus] = useState(() =>
    Object.fromEntries(LEARNING_RESOURCES.map((key) => [key, "loading"])),
  )
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("ALL")
  const requestTokens = useRef({})
  const mounted = useRef(false)

  const applyResource = useCallback((key, data) => {
    if (key === "courses") setCourses(Array.isArray(data?.items) ? data.items : [])
    if (key === "progress") setProgress(data || null)
    if (key === "my") setMy(Array.isArray(data?.items) ? data.items : [])
    if (key === "bookmarks") setBookmarks(Array.isArray(data?.items) ? data.items : [])
    if (key === "recommendations") setRecommendations(Array.isArray(data?.items) ? data.items : [])
  }, [])

  const load = useCallback(async (requested = LEARNING_RESOURCES) => {
    const keys = requested.filter((key) => LEARNING_RESOURCES.includes(key))
    if (keys.length === 0) return

    const tokens = {}
    keys.forEach((key) => {
      tokens[key] = (requestTokens.current[key] || 0) + 1
      requestTokens.current[key] = tokens[key]
    })

    setStatus((current) => {
      const next = { ...current }
      keys.forEach((key) => { next[key] = "loading" })
      return next
    })
    setErrors((current) => {
      const next = { ...current }
      keys.forEach((key) => { delete next[key] })
      return next
    })

    const requests = {
      courses: () => getLearningCourses({
        search: search || undefined,
        category: category === "ALL" ? undefined : category,
      }),
      progress: () => getLearningProgress(),
      my: () => getMyLearning(),
      bookmarks: () => getLearningBookmarks(),
      recommendations: () => getLearningRecommendations(),
    }

    await Promise.all(keys.map(async (key) => {
      try {
        const response = await requests[key]()
        if (requestTokens.current[key] !== tokens[key]) return
        applyResource(key, response.data)
        setStatus((current) => ({ ...current, [key]: "success" }))
      } catch (err) {
        if (requestTokens.current[key] !== tokens[key]) return
        setStatus((current) => ({ ...current, [key]: "error" }))
        setErrors((current) => ({ ...current, [key]: resourceErrorMessage(key, err) }))
      }
    }))
  }, [applyResource, search, category])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mounted.current) {
        mounted.current = true
        load()
        return
      }
      load(["courses"])
    }, 250)
    return () => clearTimeout(timer)
  }, [load])

  const failedKeys = LEARNING_RESOURCES.filter((key) => status[key] === "error")
  const progressReady = status.progress === "success" && progress !== null
  const myReady = status.my === "success"
  const bookmarksReady = status.bookmarks === "success"
  const recommendationsReady = status.recommendations === "success"

  const retryFailed = () => {
    if (failedKeys.length > 0) load(failedKeys)
  }

  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(courses.map((course) => course.category)))],
    [courses],
  )

  return (
    <main className="cv-page mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="cv-reveal">
        <p className="cv-kicker">STRUCTURED LEARNING</p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Learning Path</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted)] sm:text-base">
              Real lessons with explanations, runnable examples, exercises and quizzes. Completion and notes
              are stored against your account, and recommendations are generated from your actual practice data.
            </p>
          </div>
          <span className="cv-pill w-fit">
            {progressReady
              ? `${progress.overallPercent ?? 0}% overall`
              : status.progress === "error"
                ? "Progress unavailable"
                : "Loading progress…"}
          </span>
        </div>
      </header>

      {failedKeys.length > 0 && (
        <section className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-black">Some learning data could not be loaded.</p>
            <button type="button" className="font-bold underline" onClick={retryFailed}>
              Retry failed
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {failedKeys.map((key) => (
              <li key={key}>
                <span className="font-bold">{RESOURCE_LABELS[key]}:</span> {errors[key]}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="cv-stat-card rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)]">ENROLLED COURSES</p>
          <p className="mt-2 text-3xl font-black">{progressReady ? (progress.enrolledCourses ?? 0) : "—"}</p>
          <p className="mt-1 text-xs text-[var(--cv-muted)]">
            {progressReady
              ? (myReady ? `${my.length} in progress or completed` : "Enrolled course list unavailable")
              : status.progress === "error" ? "Progress could not be loaded" : "Loading progress…"}
          </p>
        </div>
        <div className="cv-stat-card rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)]">LESSONS COMPLETED</p>
          <p className="mt-2 text-3xl font-black">{progressReady ? (progress.completedLessons ?? 0) : "—"}</p>
          <p className="mt-1 text-xs text-[var(--cv-muted)]">
            {progressReady
              ? `of ${progress.totalLessons ?? 0} in enrolled courses`
              : status.progress === "error" ? "Progress could not be loaded" : "Loading progress…"}
          </p>
        </div>
        <div className="cv-stat-card rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)]">BOOKMARKS</p>
          <p className="mt-2 text-3xl font-black">{progressReady ? (progress.bookmarks ?? 0) : "—"}</p>
          <p className="mt-1 text-xs text-[var(--cv-muted)]">
            {progressReady
              ? "Saved lessons for revision"
              : status.progress === "error" ? "Progress could not be loaded" : "Loading progress…"}
          </p>
        </div>
        <div className="cv-stat-card rounded-2xl p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--cv-muted)]">RECOMMENDATIONS</p>
          <p className="mt-2 text-3xl font-black">{recommendationsReady ? recommendations.length : "—"}</p>
          <p className="mt-1 text-xs text-[var(--cv-muted)]">
            {recommendationsReady
              ? "Rule-based, from your activity"
              : status.recommendations === "error" ? "Recommendations could not be loaded" : "Loading recommendations…"}
          </p>
        </div>
      </section>

      {recommendationsReady && recommendations.length > 0 && (
        <section className="cv-panel mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Recommended next</h2>
              <p className="text-xs text-[var(--cv-muted)]">
                Generated by transparent rules from solved problems, failed submissions, course progress and interview scores.
              </p>
            </div>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-violet-400">
              Rule based
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendations.slice(0, 4).map((item, index) => (
              <Link
                key={`${item.type}-${item.title}-${index}`}
                to={item.href || "/problems"}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--cv-surface-2)]/40 p-4 transition hover:border-violet-500/40"
              >
                <p className="text-[10px] font-black uppercase tracking-wide text-violet-400">{item.type}</p>
                <p className="mt-1 text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--cv-muted)]">{item.reason}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {myReady && my.length > 0 && (
        <section className="cv-panel mt-6">
          <h2 className="text-lg font-black">Continue learning</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {my.map((item) => (
              <Link key={item.slug} to={`/learning-path/courses/${item.slug}`} className="rounded-xl border border-[var(--color-border)] p-4 hover:border-violet-500/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{item.title}</p>
                  <span className="text-xs font-black text-violet-400">{item.progressPercent}%</span>
                </div>
                <ProgressBar value={item.progressPercent} />
                <p className="mt-2 text-xs text-[var(--cv-muted)]">
                  {item.completedLessons}/{item.totalLessons} lessons · {item.currentLessonTitle || "Ready to start"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-black">Course library</h2>
            <p className="text-xs text-[var(--cv-muted)]">Structured modules with real lesson content.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="cv-input"
              placeholder="Search courses…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="cv-input" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item} value={item}>{item === "ALL" ? "All categories" : item}</option>)}
            </select>
          </div>
        </div>

        {status.courses === "error" ? (
          <div className="cv-panel mt-5 py-14 text-center">
            <p className="text-4xl">⚠️</p>
            <h3 className="mt-3 text-lg font-black">Course library unavailable</h3>
            <p className="mt-1 text-sm text-[var(--cv-muted)]">
              The course list could not be loaded. Retry the failed request above.
            </p>
            <button
              type="button"
              className="cv-secondary-btn mt-4 !px-4 !py-2 text-xs"
              onClick={() => load(["courses"])}
            >
              Retry
            </button>
          </div>
        ) : status.courses === "loading" ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="cv-panel h-64 animate-pulse rounded-2xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="cv-panel mt-5 py-14 text-center">
            <p className="text-4xl">📚</p>
            <h3 className="mt-3 text-lg font-black">No courses found</h3>
            <p className="mt-1 text-sm text-[var(--cv-muted)]">Try another search or category.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.slug} to={`/learning-path/courses/${course.slug}`} className="cv-panel flex h-full flex-col transition hover:-translate-y-0.5 hover:border-violet-500/40">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-400">
                    {course.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[var(--cv-muted)]">{course.difficulty}</span>
                </div>
                <h3 className="mt-4 text-xl font-black">{course.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--cv-muted)]">{course.shortDescription}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {course.skillsGained.slice(0, 3).map((skill) => (
                    <span key={skill} className="rounded-md bg-[var(--cv-surface-2)] px-2 py-1 text-[11px] text-[var(--cv-muted)]">{skill}</span>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-[var(--cv-muted)]">{course.lessonCount} lessons</span>
                    <strong>{course.progressPercent}%</strong>
                  </div>
                  <ProgressBar value={course.progressPercent} />
                </div>
                <p className="mt-3 text-xs font-bold text-violet-400">
                  {course.enrolled ? "Continue course →" : "Open course →"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {bookmarksReady && bookmarks.length > 0 && (
        <section className="cv-panel mt-6">
          <h2 className="text-lg font-black">Bookmarked lessons</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {bookmarks.map((bookmark) => (
              <Link
                key={bookmark.lessonId}
                to={`/learning-path/lessons/${bookmark.lessonId}`}
                className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm hover:border-violet-500/40"
              >
                <span className="font-bold">{bookmark.title}</span>
                <span className="ml-2 text-xs text-[var(--cv-muted)]">{bookmark.courseTitle}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export function CourseOverview() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getLearningCourse(slug)
      setCourse(response.data)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load this course.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  const enroll = async () => {
    setBusy(true)
    setError("")
    try {
      const response = await enrollLearningCourse(slug)
      setCourse(response.data)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to enroll in this course.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main className="cv-page"><div className="cv-panel h-64 animate-pulse rounded-2xl" /></main>
  if (!course) {
    return (
      <main className="cv-page">
        <div className="cv-panel">
          <p className="text-sm text-red-400">{error || "Course not found."}</p>
          <button type="button" className="cv-secondary-btn mt-4 !px-4 !py-2 text-xs" onClick={load}>Retry</button>
        </div>
      </main>
    )
  }

  return (
    <main className="cv-page mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/learning-path" className="text-xs font-bold text-violet-400 hover:text-violet-300">← Learning path</Link>
      <div className="cv-panel mt-4">
        <p className="cv-kicker">{course.category} COURSE</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{course.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--cv-muted)]">{course.detailedDescription}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--cv-surface-2)]/50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--cv-muted)]">Lessons</p>
            <p className="mt-1 text-lg font-black">{course.completedLessons}/{course.totalLessons}</p>
          </div>
          <div className="rounded-xl bg-[var(--cv-surface-2)]/50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--cv-muted)]">Progress</p>
            <p className="mt-1 text-lg font-black">{course.progressPercent}%</p>
          </div>
          <div className="rounded-xl bg-[var(--cv-surface-2)]/50 p-3">
            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--cv-muted)]">Estimated time</p>
            <p className="mt-1 text-lg font-black">{course.estimatedDurationMinutes || 0} min</p>
          </div>
        </div>
        <ProgressBar value={course.progressPercent} />
        <div className="mt-4 flex flex-wrap gap-2">
          {!course.enrolled ? (
            <button type="button" className="cv-primary-btn !px-4 !py-2.5 text-xs" disabled={busy} onClick={enroll}>
              {busy ? "Enrolling…" : "Enroll in course"}
            </button>
          ) : course.currentLessonId ? (
            <button
              type="button"
              className="cv-primary-btn !px-4 !py-2.5 text-xs"
              onClick={() => navigate(`/learning-path/lessons/${course.currentLessonId}`)}
            >
              Continue: {course.currentLessonTitle}
            </button>
          ) : null}
        </div>
        {course.learningObjectives.length > 0 && (
          <div className="mt-5">
            <h2 className="text-sm font-black">Learning objectives</h2>
            <ul className="mt-2 grid gap-1 text-sm text-[var(--cv-muted)] sm:grid-cols-2">
              {course.learningObjectives.map((objective) => <li key={objective}>• {objective}</li>)}
            </ul>
          </div>
        )}
      </div>

      {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      <div className="mt-6 space-y-4">
        {course.modules.map((module) => (
          <section key={module.name} className="cv-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black">{module.name}</h2>
              <span className="text-xs text-[var(--cv-muted)]">{module.completedLessons}/{module.totalLessons} · {module.progressPercent}%</span>
            </div>
            <ul className="mt-3 space-y-2">
              {module.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    to={`/learning-path/lessons/${lesson.id}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3 hover:border-violet-500/40"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-black ${
                        lesson.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--cv-border)]"
                      }`}>
                        {lesson.completed ? "✓" : ""}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{lesson.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--cv-muted)]">{lesson.description}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--cv-muted)]">{lesson.estimatedMinutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}

export function LessonView() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")
  const [noteStatus, setNoteStatus] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getLearningLesson(lessonId)
      setLesson(response.data)
      setNote(response.data.note || "")
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load this lesson.")
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => { load() }, [load])

  const quiz = useMemo(() => parseQuiz(lesson?.quiz), [lesson])

  const toggleComplete = async () => {
    setBusy(true)
    setError("")
    try {
      const response = await completeLearningLesson(lessonId, !lesson.completed)
      setLesson(response.data)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update lesson progress.")
    } finally {
      setBusy(false)
    }
  }

  const toggleBookmark = async () => {
    setBusy(true)
    try {
      const response = await toggleLessonBookmark(lessonId)
      setLesson((current) => ({ ...current, bookmarked: response.data.bookmarked }))
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update bookmark.")
    } finally {
      setBusy(false)
    }
  }

  const saveNote = async () => {
    setBusy(true)
    setNoteStatus("")
    try {
      await saveLessonNote(lessonId, note)
      setNoteStatus("Note saved")
      setTimeout(() => setNoteStatus(""), 2000)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save your note.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main className="cv-page"><div className="cv-panel h-64 animate-pulse rounded-2xl" /></main>
  if (!lesson) {
    return (
      <main className="cv-page">
        <div className="cv-panel">
          <p className="text-sm text-red-400">{error || "Lesson not found."}</p>
          <button type="button" className="cv-secondary-btn mt-4 !px-4 !py-2 text-xs" onClick={load}>Retry</button>
        </div>
      </main>
    )
  }

  return (
    <main className="cv-page mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/learning-path/courses/${lesson.courseSlug}`} className="text-xs font-bold text-violet-400 hover:text-violet-300">
          ← {lesson.courseTitle}
        </Link>
        <span className="text-xs text-[var(--cv-muted)]">Lesson {lesson.position} of {lesson.totalLessons}</span>
      </div>

      <article className="cv-panel mt-4">
        <p className="cv-kicker">{lesson.moduleName}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{lesson.title}</h1>
        <p className="mt-2 text-sm text-[var(--cv-muted)]">{lesson.description}</p>

        {lesson.learningObjectives.length > 0 && (
          <div className="mt-5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-violet-400">You will learn</p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--cv-muted)]">
              {lesson.learningObjectives.map((objective) => <li key={objective}>• {objective}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-6 whitespace-pre-line text-sm leading-7 text-[var(--cv-text)]">{lesson.lessonContent}</div>

        {lesson.codeExample && (
          <div className="mt-6">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-[var(--cv-muted)]">Example</p>
            <pre className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--cv-surface-2)] p-4 text-xs leading-6">
              <code>{lesson.codeExample}</code>
            </pre>
            {lesson.expectedOutput && (
              <p className="mt-2 text-xs text-[var(--cv-muted)]">
                <span className="font-bold text-[var(--cv-text)]">Expected output:</span> {lesson.expectedOutput}
              </p>
            )}
          </div>
        )}

        {lesson.exercise && (
          <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-cyan-400">Exercise</p>
            <p className="mt-1 text-sm leading-6">{lesson.exercise}</p>
          </div>
        )}

        {lesson.commonMistakes && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-500">Common mistakes</p>
            <p className="mt-1 text-sm leading-6 text-[var(--cv-muted)]">{lesson.commonMistakes}</p>
          </div>
        )}

        {quiz.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-black">Check your understanding</h2>
            <Quiz questions={quiz} />
          </div>
        )}

        {lesson.resources.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-black">Resources</h2>
            <ul className="mt-2 space-y-1">
              {lesson.resources.map((resource) => {
                const [label, url] = resource.split("|")
                return (
                  <li key={resource}>
                    {url ? (
                      <a href={url} target={url.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-sm font-bold text-violet-400 hover:text-violet-300">
                        {label} ↗
                      </a>
                    ) : (
                      <span className="text-sm text-[var(--cv-muted)]">{label}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={toggleComplete} className={lesson.completed ? "cv-secondary-btn !px-4 !py-2.5 text-xs" : "cv-primary-btn !px-4 !py-2.5 text-xs"}>
            {lesson.completed ? "Mark as incomplete" : "Mark lesson complete"}
          </button>
          <button type="button" disabled={busy} onClick={toggleBookmark} className="cv-secondary-btn !px-4 !py-2.5 text-xs">
            {lesson.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        <div className="mt-6 rounded-xl border border-[var(--color-border)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black">Your notes</h2>
            {noteStatus && <span className="text-xs font-bold text-emerald-500">{noteStatus}</span>}
          </div>
          <textarea
            className="cv-input mt-2 min-h-28 w-full resize-y"
            placeholder="Write a short note, a question or a reminder…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <button type="button" disabled={busy} onClick={saveNote} className="cv-secondary-btn mt-2 !px-4 !py-2 text-xs">
            Save note
          </button>
        </div>
      </article>

      <div className="mt-5 flex flex-wrap justify-between gap-2">
        <button
          type="button"
          disabled={!lesson.previousLessonId}
          onClick={() => navigate(`/learning-path/lessons/${lesson.previousLessonId}`)}
          className="cv-secondary-btn !px-4 !py-2.5 text-xs disabled:opacity-40"
        >
          ← Previous lesson
        </button>
        <button
          type="button"
          disabled={!lesson.nextLessonId}
          onClick={() => navigate(`/learning-path/lessons/${lesson.nextLessonId}`)}
          className="cv-primary-btn !px-4 !py-2.5 text-xs disabled:opacity-40"
        >
          Next lesson →
        </button>
      </div>
    </main>
  )
}
