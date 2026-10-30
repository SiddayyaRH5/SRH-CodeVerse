
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getCourse, updateCourseProgress } from "../../api/courseApi"

function ContentSection({ title, content, code = false }) {
  if (
    content === undefined ||
    content === null ||
    content === ""
  ) {
    return null
  }

  const displayContent =
    typeof content === "string"
      ? content
      : JSON.stringify(content, null, 2)

  return (
    <section className="cv-section-panel rounded-2xl p-5 sm:p-7">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      {code ? (
        <pre className="overflow-x-auto rounded-xl bg-slate-950 text-green-300 p-5 text-sm leading-7 whitespace-pre-wrap">
          <code>{displayContent}</code>
        </pre>
      ) : (
        <div className="text-sm leading-7 text-[var(--cv-muted)] whitespace-pre-wrap">
          {displayContent}
        </div>
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

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError("")

    getCourse(slug)
      .then((response) => {
        if (!cancelled) {
          setCourse(response.data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load this lesson."
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const lessons = course?.lessons || []

  const index = lessons.findIndex(
    (item) => String(item.id) === String(lessonId)
  )

  const lesson = index >= 0 ? lessons[index] : null

  const previousLesson = index > 0 ? lessons[index - 1] : null

  const nextLesson =
    index >= 0 && index < lessons.length - 1
      ? lessons[index + 1]
      : null

  const searchLinks = useMemo(() => {
    if (!course || !lesson) return []

    const topic = `${course.title} ${lesson.title}`

    const searches = [
      `${topic} tutorial for beginners`,
      `${topic} practical examples coding`,
    ]

    return searches.map((query) => ({
      query,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    }))
  }, [course, lesson])

  const videoUrl = lesson?.videoUrl?.trim() || ""

  const embedUrl = useMemo(() => {
    if (!videoUrl) return ""

    try {
      const parsed = new URL(videoUrl)
      let videoId = ""

      if (
        parsed.hostname === "youtu.be" ||
        parsed.hostname.endsWith(".youtu.be")
      ) {
        videoId = parsed.pathname.split("/")[1]
      } else if (
        parsed.hostname.includes("youtube.com")
      ) {
        if (parsed.pathname === "/watch") {
          videoId = parsed.searchParams.get("v")
        } else if (
          parsed.pathname.startsWith("/embed/") ||
          parsed.pathname.startsWith("/shorts/")
        ) {
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

  const markComplete = async () => {
    if (!lesson || saving || lesson.completed) return

    setSaving(true)
    setError("")

    try {
      const response = await updateCourseProgress(
        slug,
        lesson.id,
        true
      )

      setCourse(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update lesson progress."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        Loading lesson...
      </main>
    )
  }

  if (error && !course) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <p className="text-red-500">{error}</p>
        <Link
          to={`/courses/${slug}`}
          className="text-violet-600 font-bold mt-4 inline-block"
        >
          Back to course
        </Link>
      </main>
    )
  }

  if (!course) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        Course not found.
      </main>
    )
  }

  if (!lesson) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-xl font-bold">
          Lesson not found
        </h1>
        <Link to={`/courses/${slug}`}>
          Back to course
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-5 py-10 space-y-6">

      {/* Navigation */}
      <Link
        to={`/courses/${slug}`}
        className="text-sm font-semibold text-violet-600 hover:underline"
      >
        ← Back to {course.title}
      </Link>

      {/* Lesson heading */}
      <section className="cv-section-panel rounded-3xl p-6 sm:p-9">
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <span className="text-xs font-bold text-violet-600">
            {course.title}
          </span>

          <span className="text-xs text-[var(--cv-muted)]">
            • Lesson {index + 1} of {lessons.length}
          </span>

          {lesson.completed && (
            <span className="text-xs font-bold text-emerald-600">
              ✓ Completed
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="mt-4 text-sm leading-7 text-[var(--cv-muted)]">
            {lesson.description}
          </p>
        )}

        <p className="mt-4 text-xs text-[var(--cv-muted)]">
          Estimated time: {lesson.estimatedMinutes ?? 20} minutes
        </p>
      </section>

      {/* Existing lesson video */}
      {embedUrl && (
        <section className="cv-section-panel rounded-2xl p-5">
          <h2 className="text-lg font-bold mb-4">
            Lesson Video
          </h2>

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
      <ContentSection
        title="Lesson Explanation"
        content={
          lesson.lessonContent ||
          lesson.content ||
          lesson.description
        }
      />

      <ContentSection
        title="Code Example"
        content={lesson.codeExample}
        code
      />

      <ContentSection
        title="Practice Exercise"
        content={lesson.exercise}
      />

      <ContentSection
        title="Knowledge Check"
        content={lesson.quiz}
      />

      {/* Recommended videos */}
{/* Automatic video recommendations */}
<section className="cv-section-panel rounded-2xl p-5 sm:p-7">
  <div className="flex items-center gap-3 mb-2">
    <span className="text-2xl text-red-500">▶</span>
    <h2 className="text-xl font-black">
      Recommended Learning Videos
    </h2>
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
        {/* Dynamic SRH CodeVerse thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#071b46] via-[#160b48] to-[#080d20] p-4 sm:p-5">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 20%, #7c3aed 0, transparent 45%), radial-gradient(circle at 10% 90%, #0284c7 0, transparent 45%)"
            }}
          />

          <div className="relative h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">
                <span className="text-sky-400">◆</span> SRH CodeVerse
              </span>
              <span className="text-xs text-violet-300 font-bold">
                {videoIndex === 0 ? "LEARN" : "PRACTICE"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-sky-300 font-bold">
                  {course.title}
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-white leading-tight line-clamp-2 mt-1">
                  {lesson.title}
                </h3>
                <span className="inline-block mt-2 rounded bg-violet-600 px-2 py-1 text-[9px] sm:text-[10px] font-bold text-white">
                  {videoIndex === 0 ? "CONCEPT EXPLAINED" : "CODE • PRACTICE • BUILD"}
                </span>
              </div>

              <div className="shrink-0 text-4xl sm:text-6xl font-black text-sky-400/90">
                {videoIndex === 0 ? "</>" : "{ }"}
              </div>
            </div>

            <div className="absolute right-3 bottom-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/80 bg-violet-600/80 flex items-center justify-center text-white shadow-lg">
              ▶
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-violet-600">
              VIDEO {videoIndex + 1}
            </span>
            <span className="text-red-500 text-lg">▶</span>
          </div>

          <h3 className="font-bold leading-6">
            {videoIndex === 0
              ? "Understand the concept"
              : "Practical coding and examples"}
          </h3>

          <p className="text-xs text-[var(--cv-muted)] mt-2">
            {video.query}
          </p>

          <span className="inline-block mt-4 text-sm font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
            Find free videos →
          </span>
        </div>
      </a>
    ))}
  </div>

  <p className="text-xs text-[var(--cv-muted)] mt-4">
    YouTube search results may include different creators and video lengths.
    Choose a suitable free tutorial.
  </p>
</section>

      {/* Progress */}
      <section className="cv-section-panel rounded-2xl p-5 sm:p-7">
        <h2 className="text-lg font-bold mb-3">
          Lesson Progress
        </h2>

        {error && (
          <p className="text-sm text-red-500 mb-3" role="alert">
            {error}
          </p>
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
          {saving
            ? "Saving..."
            : lesson.completed
              ? "✓ Lesson Completed"
              : "Mark as Completed"}
        </button>
      </section>

      {/* Previous and next lesson */}
      <div className="grid grid-cols-2 gap-4">
        {previousLesson ? (
          <button
            type="button"
            onClick={() =>
              navigate(
                `/courses/${slug}/lessons/${previousLesson.id}`
              )
            }
            className="cv-section-panel rounded-xl p-4 text-left hover:border-violet-500 transition-colors"
          >
            <span className="text-xs text-[var(--cv-muted)]">
              ← Previous lesson
            </span>
            <p className="font-bold text-sm mt-2">
              {previousLesson.title}
            </p>
          </button>
        ) : (
          <div />
        )}

        {nextLesson && (
          <button
            type="button"
            onClick={() =>
              navigate(
                `/courses/${slug}/lessons/${nextLesson.id}`
              )
            }
            className="cv-section-panel rounded-xl p-4 text-right hover:border-violet-500 transition-colors"
          >
            <span className="text-xs text-[var(--cv-muted)]">
              Next lesson →
            </span>
            <p className="font-bold text-sm mt-2">
              {nextLesson.title}
            </p>
          </button>
        )}
      </div>

    </main>
  )
}



