import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getCourse, updateCourseProgress } from "../../api/courseApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"

function ContentSection({ title, content, code = false }) {
  if (content === undefined || content === null || content === "") {
    return null
  }
  const displayContent = typeof content === "string" ? content : JSON.stringify(content, null, 2)
  return (
    <section className="cv-section-panel rounded-2xl p-5 sm:p-7">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      {code ? (
        <pre className="overflow-x-auto rounded-xl bg-slate-950 text-green-300 p-5 text-sm leading-7 whitespace-pre-wrap">
          <code>{displayContent}</code>
        </pre>
      ) : (
        <div className="text-sm leading-7 text-[var(--cv-muted)] whitespace-pre-wrap">{displayContent}</div>
      )}
    </section>
  )
}

export default function CourseLessonDetail() {
  const { slug, lessonId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const loadCourse = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getCourse(slug)
      setCourse(response.data)
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this lesson.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadCourse()
  }, [loadCourse])

  const lessons = course?.lessons || []
  const index = lessons.findIndex((item) => String(item.id) === String(lessonId))
  const lesson = index >= 0 ? lessons[index] : null
  const previousLesson = index > 0 ? lessons[index - 1] : null
  const nextLesson = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null

  const searchLinks = useMemo(() => {
    if (!course || !lesson) return []
    const topic = `${course.title} ${lesson.title}`
    const searches = [
      `${topic} tutorial for beginners`,
      `${topic} practical examples coding`,
    ]
    return searches.map((query) => ({ query, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` }))
  }, [course, lesson])

  const videoUrl = lesson?.videoUrl?.trim() || ""
  const embedUrl = useMemo(() => {
    if (!videoUrl) return ""
    try {
      const parsed = new URL(videoUrl)
      let videoId = ""
      if (parsed.hostname === "youtu.be" || parsed.hostname.endsWith(".youtu.be")) {
        videoId = parsed.pathname.split("/")[1]
      } else if (parsed.hostname.includes("youtube.com")) {
        if (parsed.pathname === "/watch") {
          videoId = parsed.searchParams.get("v")
        } else if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) {
          videoId = parsed.pathname.split("/")[2]
        }
      }
      return videoId && /^[a-zA-Z0-9_-]+$/.test(videoId)
        ? `https://www.youtube-nocookie.com/embed/${videoId}`
        : ""
    } catch {
      return ""
    }
  }, [videoUrl])

  const markComplete = useCallback(async () => {
    if (!lesson || saving || lesson.completed) return
    setSaving(true)
    setError("")
    try {
      const response = await updateCourseProgress(slug, lesson.id, true)
      setCourse(response.data)
    } catch (err) {
      setError(err.response?.data?.message || "Could not update lesson progress.")
    } finally {
      setSaving(false)
    }
  }, [lesson, saving, slug])

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="text-sm text-[var(--cv-muted)] text-center py-20">Loading lesson…</div>
        </PageContainer>
      </main>
    )
  }

  if (error && !course) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl" aria-hidden="true">!</div>
            <h2 className="mt-5 text-lg font-bold">{error}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">The lesson could not be loaded.</p>
            <button type="button" onClick={loadCourse} className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Try again</button>
            <Link to={`/courses/${slug}`} className="mt-3 inline-block text-xs font-bold text-[var(--cv-primary)] hover:underline">Back to course</Link>
          </div>
        </PageContainer>
      </main>
    )
  }

  if (!course) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl" aria-hidden="true">!</div>
            <h2 className="mt-5 text-lg font-bold">Course not found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">This course does not exist.</p>
            <Link to="/courses" className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Back to courses</Link>
          </div>
        </PageContainer>
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl" aria-hidden="true">!</div>
            <h2 className="mt-5 text-lg font-bold">Lesson not found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">The requested lesson does not exist in this course.</p>
            <Link to={`/courses/${slug}`} className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Back to course</Link>
          </div>
        </PageContainer>
      </main>
    )
  }

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker={course.title}
          title={lesson.title}
          description={lesson.description}
          actions={
            <>
              <Link to={`/courses/${slug}`} className="text-xs font-bold text-[var(--cv-primary)] hover:underline">
                ← Back to course
              </Link>
              <span className="text-xs text-[var(--cv-muted)]">Lesson {index + 1} of {lessons.length}</span>
              {lesson.completed && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  ✓ Completed
                </span>
              )}
            </>
          }
        />

        <p className="mt-4 text-xs text-[var(--cv-muted)]">
          Estimated time: {lesson.estimatedMinutes ?? 20} minutes
        </p>

        {/* Lesson video */}
        {embedUrl && (
          <section className="cv-section-panel rounded-2xl p-5 mt-6">
            <h2 className="text-lg font-bold mb-4">Lesson Video</h2>
            <div className="aspect-video overflow-hidden rounded-xl">
              <iframe
                src={embedUrl}
                title={`${lesson.title} lesson video`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </section>
        )}

        {/* Learning material */}
        <ContentSection title="Lesson Explanation" content={lesson.lessonContent || lesson.content || lesson.description} />
        <ContentSection title="Code Example" content={lesson.codeExample} code />
        <ContentSection title="Practice Exercise" content={lesson.exercise} />
        <ContentSection title="Knowledge Check" content={lesson.quiz} />

        {/* Recommended videos */}
        <section className="cv-section-panel rounded-2xl p-5 sm:p-7 mt-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl text-red-500" aria-hidden="true">▶</span>
            <h2 className="text-xl font-black">Recommended Learning Videos</h2>
          </div>
          <p className="text-sm text-[var(--cv-muted)] mb-5">
            Explore free YouTube tutorials selected using your course and lesson topic.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {searchLinks.map((video, videoIndex) => (
              <a
                key={video.url}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-[var(--cv-border)] overflow-hidden hover:border-violet-500 transition-all"
              >
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#071b46] via-[#160b48] to-[#080d20] p-4 sm:p-5">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #7c3aed 0, transparent 45%), radial-gradient(circle at 10% 90%, #0284c7 0, transparent 45%)" }} />
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white"><span className="text-sky-400">◆</span> SRH CodeVerse</span>
                      <span className="text-xs text-violet-300 font-bold">{videoIndex === 0 ? "LEARN" : "PRACTICE"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-sky-300 font-bold">{course.title}</p>
                        <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight line-clamp-2 mt-1">{lesson.title}</h3>
                        <span className="inline-block mt-2 rounded bg-violet-600 px-2 py-1 text-[9px] sm:text-[10px] font-bold text-white">
                          {videoIndex === 0 ? "CONCEPT EXPLAINED" : "CODE • PRACTICE • BUILD"}
                        </span>
                      </div>
                      <div className="shrink-0 text-4xl sm:text-6xl font-black text-sky-400/90">{videoIndex === 0 ? "</>" : "{ }"}</div>
                    </div>
                    <div className="absolute right-3 bottom-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/80 bg-violet-600/80 flex items-center justify-center text-white shadow-lg">▶</div>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[var(--cv-primary)]">VIDEO {videoIndex + 1}</span>
                    <span className="text-red-500 text-lg" aria-hidden="true">▶</span>
                  </div>
                  <h3 className="font-bold leading-6">{videoIndex === 0 ? "Understand the concept" : "Practical coding and examples"}</h3>
                  <p className="text-xs text-[var(--cv-muted)] mt-2">{video.query}</p>
                  <span className="inline-block mt-4 text-sm font-bold text-[var(--cv-primary)] group-hover:translate-x-1 transition-transform underline">Find free videos →</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-[var(--cv-muted)] mt-4">
            YouTube search results may include different creators and video lengths. Choose a suitable free tutorial.
          </p>
        </section>

        {/* Progress */}
        <section className="cv-section-panel rounded-2xl p-5 sm:p-7 mt-6">
          <h2 className="text-lg font-bold mb-3">Lesson Progress</h2>
          {error && (
            <p className="text-sm text-red-500 mb-3" role="alert">{error}</p>
          )}
          <button
            type="button"
            onClick={markComplete}
            disabled={saving || lesson.completed}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
              lesson.completed
                ? "bg-emerald-500/10 text-emerald-600 cursor-default"
                : "bg-violet-600 text-white hover:bg-violet-700"
            }`}
          >
            {saving ? "Saving…" : lesson.completed ? "✓ Lesson Completed" : "Mark as Completed"}
          </button>
        </section>

        {/* Previous and next lesson */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {previousLesson ? (
            <button
              type="button"
              onClick={() => navigate(`/courses/${slug}/lessons/${previousLesson.id}`)}
              className="cv-section-panel rounded-xl p-4 text-left hover:border-violet-500 transition-colors"
            >
              <span className="text-xs text-[var(--cv-muted)] uppercase tracking-wider">← Previous lesson</span>
              <p className="font-bold text-sm mt-2">{previousLesson.title}</p>
            </button>
          ) : <div />}
          {nextLesson ? (
            <button
              type="button"
              onClick={() => navigate(`/courses/${slug}/lessons/${nextLesson.id}`)}
              className="cv-section-panel rounded-xl p-4 text-right hover:border-violet-500 transition-colors"
            >
              <span className="text-xs text-[var(--cv-muted)] uppercase tracking-wider">Next lesson →</span>
              <p className="font-bold text-sm mt-2">{nextLesson.title}</p>
            </button>
          ) : <div />}
        </div>
      </PageContainer>
    </main>
  )
}