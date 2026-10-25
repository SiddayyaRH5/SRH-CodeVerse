import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getCourse, updateCourseProgress } from "../../api/courseApi"

export default function CourseLessonDetail() {
  const { slug, lessonId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    getCourse(slug)
      .then((response) => {
        if (!cancelled) setCourse(response.data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load this lesson.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) return <main className="max-w-4xl mx-auto p-8">Loading lesson...</main>

  if (error || !course) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <p className="text-red-500">{error || "Course not found."}</p>
        <Link to={`/courses/${slug}`}>Back to course</Link>
      </main>
    )
  }

  const lessons = course.lessons || []
  const index = lessons.findIndex((item) => String(item.id) === String(lessonId))
  const lesson = lessons[index]

  if (!lesson) {
    return (
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-xl font-bold">Lesson not found</h1>
        <Link to={`/courses/${slug}`}>Back to course</Link>
      </main>
    )
  }

  const markComplete = async () => {
    try {
      const response = await updateCourseProgress(slug, lesson.id, true)
      setCourse(response.data)
      setError("")
    } catch (err) {
      setError(err.response?.data?.message || "Could not update lesson progress.")
    }
  }

  const currentLesson =
    course.lessons?.find((item) => String(item.id) === String(lessonId)) || lesson

  return (
    <main className="max-w-4xl mx-auto px-5 py-10">
      <Link to={`/courses/${slug}`} className="text-sm font-semibold text-violet-600">
        ← Back to course
      </Link>

      <section className="cv-section-panel rounded-3xl p-6 sm:p-10 mt-6">
        <p className="text-sm font-bold text-violet-600">
          {lesson.moduleName || "Course lesson"}
        </p>

        <h1 className="text-3xl font-black mt-3">{lesson.title}</h1>

        <p className="text-sm mt-3 text-[var(--cv-muted)]">
          {lesson.estimatedMinutes ?? 20} minutes
        </p>

        <div className="mt-8 whitespace-pre-wrap leading-7">
          {lesson.description || "No lesson description is available yet."}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {!currentLesson.completed ? (
            <button
              type="button"
              onClick={markComplete}
              className="rounded-xl bg-violet-600 text-white px-5 py-3 font-bold"
            >
              Mark as complete
            </button>
          ) : (
            <span className="rounded-xl bg-emerald-500/10 text-emerald-600 px-5 py-3 font-bold">
              ✓ Lesson completed
            </span>
          )}

          {index < lessons.length - 1 && (
            <button
              type="button"
              onClick={() => navigate(`/courses/${slug}/lessons/${lessons[index + 1].id}`)}
              className="rounded-xl border border-[var(--cv-border)] px-5 py-3 font-bold"
            >
              Next lesson →
            </button>
          )}
        </div>

        {error && <p role="alert" className="text-sm text-red-500 mt-4">{error}</p>}
      </section>
    </main>
  )
}
