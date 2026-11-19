import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  getCourse,
  updateCourseProgress,
  getCourseProblems,
} from "../../api/courseApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import { SkeletonCards } from "../../components/common/Skeleton"

export default function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openModule, setOpenModule] = useState(1)
  const [tab, setTab] = useState("lessons")
  const [selectedProject, setSelectedProject] = useState(null)

  const loadCourse = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getCourse(slug)
      setCourse(response.data)
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load course.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadCourse()
  }, [loadCourse])

  const modules = useMemo(() => {
    const lessons = course?.lessons || []
    const grouped = lessons.reduce((acc, lesson) => {
      const order = lesson.moduleOrder ?? 1
      if (!acc[order]) {
        acc[order] = { name: lesson.moduleName || `Module ${order}`, lessons: [] }
      }
      acc[order].lessons.push(lesson)
      return acc
    }, {})
    return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b))
  }, [course])

  const toggleLesson = async (lesson) => {
    if (!user) {
      navigate("/login")
      return
    }
    setError("")
    try {
      const response = await updateCourseProgress(slug, lesson.id, !lesson.completed)
      setCourse(response.data)
    } catch (err) {
      setError(err.response?.data?.message || "Could not update lesson progress.")
    }
  }

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={3} />
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
            <h2 className="mt-5 text-lg font-bold">{error || "Course not found."}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">
              {error ? "The course could not be loaded." : "This course does not exist."}
            </p>
            {error && (
              <button type="button" onClick={loadCourse} className="mt-4 cv-secondary-btn !px-4 !py-2 text-sm">Retry</button>
            )}
            <Link to="/courses" className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Back to courses</Link>
          </div>
        </PageContainer>
      </main>
    )
  }

  const tabs = [
    { id: "lessons", label: "Lessons" },
    { id: "problems", label: "Practice" },
    { id: "projects", label: "Projects" },
    { id: "resources", label: "Free Resources" },
  ]

  const projects = Array.isArray(course.projects) ? course.projects : []
  const resources = Array.isArray(course.resources) ? course.resources : []

  const progress = Math.min(100, Math.max(0, Number(course.progressPercent) || 0))

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker={`${course.category} · ${course.level}`}
          title={course.title}
          description={course.detailedDescription}
          actions={
            <>
              <Link to="/courses" className="text-xs font-bold text-[var(--cv-primary)] hover:underline">
                ← Back to all courses
              </Link>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--cv-text)]">
                {progress}% complete
              </div>
            </>
          }
        />

        <div className="flex flex-wrap gap-2 mt-6" role="tablist" aria-label="Course sections">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => { setTab(id); setError("") }}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all duration-200 ${
                tab === id
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-[var(--cv-surface)] border-[var(--cv-border)] hover:border-violet-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500" role="alert">{error}</p>
        )}

        {/* Lessons */}
        {tab === "lessons" && (
          <section className="mt-6 space-y-3" role="tabpanel">
            {modules.length === 0 ? (
              <div className="max-w-md mx-auto mt-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl" aria-hidden="true">📚</div>
                <h2 className="mt-4 text-lg font-bold">No lessons available</h2>
                <p className="mt-2 text-sm text-[var(--cv-muted)]">There are no lessons published for this course yet.</p>
              </div>
            ) : (
              modules.map(([order, module]) => (
                <div key={order} className="cv-section-panel rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenModule(Number(order) === openModule ? null : Number(order))
                    }
                    aria-expanded={openModule === Number(order)}
                    className="w-full p-5 flex justify-between text-left"
                  >
                    <div>
                      <span className="text-[10px] text-[var(--cv-primary)] font-black uppercase tracking-wider">
                        Module {order}
                      </span>
                      <b className="block mt-1">{module.name}</b>
                    </div>
                    <span>{openModule === Number(order) ? "−" : "+"}</span>
                  </button>
                  {openModule === Number(order) && (
                    <div className="border-t border-[var(--cv-border)] divide-y divide-[var(--cv-border)]">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="p-4 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => toggleLesson(lesson)}
                            aria-label={lesson.completed ? `Mark ${lesson.title} incomplete` : `Mark ${lesson.title} complete`}
                            className={`w-7 h-7 shrink-0 rounded-full border grid place-items-center ${
                              lesson.completed
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "border-[var(--cv-border)]"
                            }`}
                          >
                            {lesson.completed ? "✓" : ""}
                          </button>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/courses/${slug}/lessons/${lesson.id}`}
                              className="text-sm font-bold hover:text-[var(--cv-primary)] transition-colors"
                            >
                              {lesson.title}
                            </Link>
                            <p className="text-xs text-[var(--cv-muted)] mt-1">{lesson.description}</p>
                          </div>
                          <span className="text-[10px] text-[var(--cv-muted)] whitespace-nowrap">
                            {lesson.estimatedMinutes ?? 20} min
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {/* Practice */}
        {tab === "problems" && <CourseProblems slug={slug} />}

        {/* Projects */}
        {tab === "projects" && (
          <section className="grid md:grid-cols-3 gap-4 mt-6" role="tabpanel">
            {projects.length === 0 ? (
              <p className="col-span-3 text-sm text-[var(--cv-muted)]">No projects are available for this course yet.</p>
            ) : (
              projects.map((project, index) => (
                <button
                  key={project.id ?? `${project.title}-${index}`}
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="cv-section-panel rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <span className="text-[10px] text-[var(--cv-primary)] font-black uppercase tracking-wider">
                    {project.difficulty || "PROJECT"}
                  </span>
                  <h3 className="font-black mt-2">{project.title}</h3>
                  <p className="text-sm text-[var(--cv-muted)] mt-2 leading-6">{project.description}</p>
                  <p className="text-xs mt-4"><b>Tech:</b> {project.technologies}</p>
                  <p className="text-xs text-[var(--cv-muted)] mt-2">{project.outcome}</p>
                  <span className="block mt-4 text-xs font-bold text-[var(--cv-primary)] underline">View project details</span>
                </button>
              ))
            )}
          </section>
        )}

        {/* Project details popup */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedProject(null)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-dialog-title"
              className="cv-section-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 sm:p-9 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-black text-[var(--cv-primary)] uppercase tracking-wider">
                    {selectedProject.difficulty || "PROJECT"}
                  </span>
                  <h2 id="project-dialog-title" className="text-2xl font-black mt-2">{selectedProject.title}</h2>
                </div>
                <button type="button" onClick={() => setSelectedProject(null)} aria-label="Close project details" className="rounded-lg px-3 py-1 border border-[var(--cv-border)] hover:bg-violet-600 hover:text-white">
                  ✕
                </button>
              </div>
              <p className="text-sm text-[var(--cv-muted)] mt-4 leading-7">{selectedProject.description}</p>
              <p className="text-sm mt-4"><b>Technologies:</b> {selectedProject.technologies}</p>
              <p className="text-sm text-[var(--cv-muted)] mt-3"><b>Expected outcome:</b> {selectedProject.outcome}</p>
              <button type="button" onClick={() => setSelectedProject(null)} className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-white font-bold hover:bg-violet-700">Close details</button>
            </div>
          </div>
        )}

        {/* Free Resources */}
        {tab === "resources" && (
          <section className="grid md:grid-cols-2 gap-4 mt-6" role="tabpanel">
            {resources.length === 0 ? (
              <p className="col-span-2 text-sm text-[var(--cv-muted)]">No resources are available for this course yet.</p>
            ) : (
              resources.map((resource, index) => (
                <a
                  key={resource.id ?? `${resource.title}-${index}`}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cv-section-panel rounded-2xl p-5 hover:-translate-y-1 hover:border-violet-500 transition-all duration-300"
                >
                  <div className="flex justify-between gap-3">
                    <span className="text-xs font-black text-[var(--cv-primary)] uppercase tracking-wider">{resource.type}</span>
                    {resource.free && <span className="text-[10px] font-bold text-emerald-600">FREE</span>}
                  </div>
                  <h3 className="font-black mt-2">{resource.title}</h3>
                  <p className="text-xs text-[var(--cv-muted)] mt-1">{resource.provider}</p>
                  <p className="text-sm text-[var(--cv-muted)] mt-3 leading-6">{resource.description}</p>
                  <span className="inline-block mt-4 text-xs font-bold text-[var(--cv-primary)] underline">Open resource</span>
                </a>
              ))
            )}
          </section>
        )}
      </PageContainer>
    </main>
  )
}

function CourseProblems({ slug }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadProblems = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getCourseProblems(slug)
      setItems(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load practice problems.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadProblems()
  }, [loadProblems])

  const shown = items.filter((problem) => {
    if (filter === "ALL") return true
    return String(problem.difficulty || "").toUpperCase() === filter
  })

  if (loading) {
    return (
      <section className="mt-6" role="tabpanel">
        <p className="text-sm text-[var(--cv-muted)]">Loading practice problems…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-6 cv-section-panel rounded-2xl p-5" role="tabpanel">
        <p className="text-sm text-red-500">{error}</p>
        <button type="button" onClick={loadProblems} className="mt-3 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold">Retry</button>
      </section>
    )
  }

  return (
    <section className="mt-6" role="tabpanel">
      <div className="flex gap-2 mb-5 flex-wrap">
        {["ALL", "EASY", "MEDIUM", "HARD"].map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={filter === level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              filter === level
                ? "bg-violet-600 text-white border-violet-600"
                : "border-[var(--cv-border)] hover:border-violet-500"
            }`}
          >
            {level}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="cv-section-panel rounded-2xl p-6">
          <p className="font-bold">No practice problems found.</p>
          <p className="text-sm text-[var(--cv-muted)] mt-2">Try another filter or check whether problems have been assigned to this course.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {shown.map((problem, index) => (
            <button
              key={problem.id ?? `${problem.title}-${index}`}
              type="button"
              onClick={() => {
                if (problem.id === undefined || problem.id === null) {
                  setError("This problem has no valid ID.")
                  return
                }
                navigate(`/courses/${slug}/problems/${problem.id}`)
              }}
              className="cv-section-panel rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <div className="flex justify-between items-start gap-3">
                <b className="text-sm leading-6">{index + 1}. {problem.title || "Untitled problem"}</b>
                <span className="shrink-0 text-[10px] font-black text-[var(--cv-primary)]">{problem.difficulty || "UNRATED"}</span>
              </div>
              <p className="text-xs text-[var(--cv-muted)] mt-3 leading-6">{problem.statement || problem.description || "Open this problem to view its details."}</p>
              <div className="flex justify-between gap-2 mt-4 text-[10px] text-[var(--cv-muted)]">
                <span>{problem.topic || "General"}</span>
                <span>+{problem.xp ?? 0} XP · {problem.estimatedTimeMinutes ?? 0} min</span>
              </div>
              <span className="block mt-4 text-xs font-bold text-[var(--cv-primary)] underline">Solve problem</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}