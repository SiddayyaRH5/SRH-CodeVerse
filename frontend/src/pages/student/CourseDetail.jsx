
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getCourse,
  updateCourseProgress,
  getCourseProblems,
  enrollCourse,
  createPaymentOrder,
  verifyPayment,
} from '../../api/courseApi'
import PremiumProgress from '../../components/common/PremiumProgress'
import { loadRazorpayScript } from '../../utils/razorpay'

function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openModule, setOpenModule] = useState(1)
  const [tab, setTab] = useState('lessons')
  const [selectedProject, setSelectedProject] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const checkoutInFlight = useRef(false)

  const paid = String(course?.courseType || '').toUpperCase() === 'PAID'
  const eligible = course?.eligible !== false
  const locked = paid && !eligible
  const priceLabel = paid
    ? (() => {
        try {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: course?.currency || 'INR',
            maximumFractionDigits: 0,
          }).format(Number(course?.price) || 0)
        } catch {
          return `${course?.currency || 'INR'} ${Number(course?.price) || 0}`
        }
      })()
    : 'FREE'

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      setLoading(true)
      setError('')

      try {
        const response = await getCourse(slug)

        if (!cancelled) {
          setCourse(response.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || 'Unable to load course.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCourse()

    return () => {
      cancelled = true
    }
  }, [slug])

  const modules = useMemo(() => {
    const lessons = course?.lessons || []

    const grouped = lessons.reduce((acc, lesson) => {
      const order = lesson.moduleOrder ?? 1

      if (!acc[order]) {
        acc[order] = {
          name: lesson.moduleName || `Module ${order}`,
          lessons: [],
        }
      }

      acc[order].lessons.push(lesson)
      return acc
    }, {})

    return Object.entries(grouped).sort(
      ([a], [b]) => Number(a) - Number(b)
    )
  }, [course])

  const toggleLesson = async (lesson) => {
    if (locked) {
      setError('This lesson requires a verified payment.')
      return
    }
    if (!user) {
      navigate('/login')
      return
    }

    setError('')

    try {
      const response = await updateCourseProgress(
        slug,
        lesson.id,
        !lesson.completed
      )

      setCourse(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not update lesson progress.'
      )
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setBusy(true)
    setNotice('')
    setError('')
    try {
      const response = await enrollCourse(slug)
      setCourse(response.data)
      setNotice('You are enrolled. Happy learning!')
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const handlePurchase = async () => {
    if (checkoutInFlight.current) return
    if (!user) {
      navigate('/login')
      return
    }

    checkoutInFlight.current = true
    setBusy(true)
    setNotice('Creating a secure payment order…')
    setError('')

    try {
      // Amount and public key always come from the backend; the browser never
      // computes or supplies a payable amount.
      const { data: order } = await createPaymentOrder(slug)
      const amountPaise = Number(order?.amountPaise)
      if (!order?.orderId || !Number.isInteger(amountPaise) || amountPaise <= 0)
        throw new Error('The payment order is incomplete. Please try again.')
      if (!String(order.keyId || '').startsWith('rzp_test_'))
        throw new Error('Razorpay Test Mode is not configured on the server.')

      setNotice('Opening secure checkout…')
      const ready = await loadRazorpayScript()
      if (!ready || !window.Razorpay)
        throw new Error('Razorpay Checkout could not be loaded. Check your connection and retry.')

      await new Promise((resolve) => {
        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          checkoutInFlight.current = false
          setBusy(false)
          resolve()
        }

        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: amountPaise,
          currency: order.currency || 'INR',
          name: 'SRH CodeVerse',
          description: course.title,
          order_id: order.orderId,
          prefill: { name: user.username },
          notes: { courseSlug: slug },
          theme: { color: '#6d28d9' },
          modal: {
            ondismiss: () => {
              setNotice('Checkout was closed before payment. No access has been granted; you can retry safely.')
              finish()
            },
          },
          handler: async (response) => {
            if (!response?.razorpay_order_id || response.razorpay_order_id !== order.orderId) {
              setError('Payment verification could not be completed: the order did not match. If you were charged, please contact support.')
              finish()
              return
            }
            setNotice('Verifying your payment with the server…')
            try {
              await verifyPayment(
                order.orderId,
                response.razorpay_payment_id,
                response.razorpay_signature,
              )
              const fresh = await getCourse(slug)
              setCourse(fresh.data)
              setNotice('Payment verified. You can continue learning.')
            } catch (err) {
              setError(
                err.response?.data?.message
                  || 'Payment verification failed. If you were charged, please contact support.',
              )
              try {
                const fresh = await getCourse(slug)
                setCourse(fresh.data)
              } catch {
                // Keep the existing course state if the status refresh fails.
              }
            } finally {
              finish()
            }
          },
        })

        rzp.on('payment.failed', (event) => {
          setError(event?.error?.description || 'The payment failed. No access has been granted.')
          finish()
        })
        rzp.open()
      })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Purchases are not available right now.')
      checkoutInFlight.current = false
      setBusy(false)
      try {
        const response = await getCourse(slug)
        setCourse(response.data)
      } catch {
        // Keep the existing course state if the status refresh fails.
      }
    }
  }

  if (loading) {
    return (
      <main className="cv-premium-page max-w-[1280px] mx-auto px-5 sm:px-8 py-10">
        Loading course...
      </main>
    )
  }

  if (!course) {
    return (
      <main className="cv-premium-page max-w-[1280px] mx-auto px-5 sm:px-8 py-10">
        <p className="text-red-500">
          {error || 'Course not found.'}
        </p>

        <Link
          to="/courses"
          className="inline-block mt-4 text-violet-600 font-bold"
        >
          Back to courses
        </Link>
      </main>
    )
  }

  const tabs = [
    { id: 'lessons', label: 'Lessons' },
    { id: 'problems', label: 'Practice' },
    { id: 'projects', label: 'Projects' },
    { id: 'resources', label: 'Free Resources' },
  ]

  const projects = Array.isArray(course.projects)
    ? course.projects
    : []

  const resources = Array.isArray(course.resources)
    ? course.resources
    : []

  return (
    <main className="cv-premium-page max-w-[1280px] mx-auto px-5 sm:px-8 py-10">
      {/* Course introduction */}
      <section className="cv-section-panel rounded-3xl p-7 sm:p-10 bg-gradient-to-br from-violet-600/10 via-blue-500/5 to-cyan-400/10">
        <Link
          to="/courses"
          className="text-xs font-bold text-violet-600"
        >
          ← All Courses
        </Link>

        {(course.thumbnailUrl || course.thumbnail) && (
          <div className="mt-5 aspect-video max-h-80 overflow-hidden rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)]">
            <img
              src={course.thumbnailUrl || course.thumbnail}
              alt={`${course.title} course thumbnail`}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row justify-between gap-8 mt-5">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black tracking-widest text-violet-600">
                {course.category} · {course.level}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                  paid ? 'bg-amber-400 text-slate-900' : 'bg-emerald-500 text-white'
                }`}
              >
                {paid ? 'Paid' : 'Free'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black mt-2">
              {course.title}
            </h1>

            <p className="text-[var(--cv-muted)] mt-4 leading-7">
              {course.detailedDescription}
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {(course.skillsGained || []).map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-[var(--cv-surface)] border border-[var(--cv-border)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-[250px] rounded-2xl bg-[var(--cv-surface)] border border-[var(--cv-border)] p-5">
            <div className="mt-3">
              <PremiumProgress value={course.progressPercent ?? 0} label="Course completion" />
            </div>

            <p className="text-xs text-[var(--cv-muted)] mt-3">
              By {course.instructor || 'SRH CodeVerse'}
            </p>

            <p className="text-xs text-[var(--cv-muted)] mt-3">
              {course.lessonCount ?? (course.lessons || []).length} lessons
              {' · '}
              {course.problemCount ?? 0} practice tasks
            </p>

            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-2xl font-black">{priceLabel}</span>
              {paid && !eligible ? (
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={busy || course.enrollmentEnabled === false}
                  className="cv-primary-btn !py-3 text-sm disabled:opacity-60"
                >
                  {busy ? 'Working...' : `Buy Course — ${priceLabel}`}
                </button>
              ) : !paid && course.enrollmentEnabled !== false && !(course.progressPercent > 0) ? (
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={busy}
                  className="cv-primary-btn !py-3 text-sm disabled:opacity-60"
                >
                  {busy ? 'Enrolling...' : 'Enroll for free'}
                </button>
              ) : paid ? (
                <Link
                  to={`/learning-path/courses/${slug}`}
                  className="cv-primary-btn !py-3 text-sm"
                >
                  Continue Learning
                </Link>
              ) : (
                <span className="text-xs font-bold text-emerald-500">You are enrolled</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course tabs */}
      <div
        className="flex gap-2 flex-wrap mt-7"
        role="tablist"
        aria-label="Course sections"
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id)
              setError('')
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all duration-200 ${
              tab === id
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-[var(--cv-surface)] border-[var(--cv-border)] hover:border-violet-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="mt-4 text-sm text-emerald-500" role="status">
          {notice}
        </p>
      )}

      {locked && paid && (
        <p className="mt-4 text-sm text-amber-500" role="status">
          Lessons unlock after a verified payment. No access is granted from browser state alone.
        </p>
      )}

      {/* Lessons */}
      {tab === 'lessons' && (
        <section className="mt-5 space-y-3" role="tabpanel">
          {modules.length === 0 ? (
            <div className="cv-section-panel rounded-2xl p-5">
              No lessons are available for this course yet.
            </div>
          ) : (
            modules.map(([order, module]) => (
              <div
                key={order}
                className="cv-section-panel rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenModule(
                      Number(order) === openModule
                        ? null
                        : Number(order)
                    )
                  }
                  aria-expanded={openModule === Number(order)}
                  className="w-full p-5 flex justify-between text-left"
                >
                  <span>
                    <span className="text-[10px] text-violet-600 font-black">
                      MODULE {order}
                    </span>
                    <b className="block mt-1">{module.name}</b>
                  </span>

                  <span>
                    {openModule === Number(order) ? '−' : '+'}
                  </span>
                </button>

                {openModule === Number(order) && (
                  <div className="border-t border-[var(--cv-border)] divide-y divide-[var(--cv-border)]">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-4 flex items-center gap-4"
                      >
                        <button
                          type="button"
                          onClick={() => toggleLesson(lesson)}
                          disabled={locked}
                          aria-label={
                            lesson.completed
                              ? `Mark ${lesson.title} incomplete`
                              : `Mark ${lesson.title} complete`
                          }
                          className={`w-7 h-7 shrink-0 rounded-full border grid place-items-center ${
                            lesson.completed
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'border-[var(--cv-border)]'
                          }`}
                        >
                          {lesson.completed ? '✓' : ''}
                        </button>

                        <div className="flex-1 min-w-0">
                          {locked ? (
                            <span
                              className="text-sm font-bold text-[var(--cv-muted)]"
                              aria-label={`${lesson.title} is locked`}
                            >
                              🔒 {lesson.title}
                            </span>
                          ) : (
                            <Link
                              to={`/courses/${slug}/lessons/${lesson.id}`}
                              className="text-sm font-bold hover:text-violet-600 transition-colors"
                            >
                              {lesson.title}
                            </Link>
                          )}
                          <p className="text-xs text-[var(--cv-muted)] mt-1">
                            {lesson.description}
                          </p>
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
      {tab === 'problems' && <CourseProblems slug={slug} />}

      {/* Projects */}
      {tab === 'projects' && (
        <section
          className="grid md:grid-cols-3 gap-4 mt-5"
          role="tabpanel"
        >
          {projects.length === 0 ? (
            <p className="text-sm text-[var(--cv-muted)]">
              No projects are available for this course yet.
            </p>
          ) : (
            projects.map((project, index) => (
              <button
                key={project.id ?? `${project.title}-${index}`}
                type="button"
                onClick={() => setSelectedProject(project)}
                className="cv-section-panel rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <span className="text-[10px] text-violet-600 font-black">
                  {project.difficulty || 'PROJECT'}
                </span>

                <h3 className="font-black mt-2">
                  {project.title}
                </h3>

                <p className="text-sm text-[var(--cv-muted)] mt-2 leading-6">
                  {project.description}
                </p>

                <p className="text-xs mt-4">
                  <b>Tech:</b> {project.technologies}
                </p>

                <p className="text-xs text-[var(--cv-muted)] mt-2">
                  {project.outcome}
                </p>

                <span className="block mt-4 text-xs font-bold text-violet-600">
                  View project details ←’
                </span>
              </button>
            ))
          )}
        </section>
      )}

      {/* Project details popup */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-dialog-title"
            className="cv-section-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 sm:p-9 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-black text-violet-600">
                  {selectedProject.difficulty || 'PROJECT'}
                </span>

                <h2
                  id="project-dialog-title"
                  className="text-2xl font-black mt-2"
                >
                  {selectedProject.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
                className="rounded-lg px-3 py-1 border border-[var(--cv-border)] hover:bg-violet-600 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[var(--cv-muted)] mt-4 leading-7">
              {selectedProject.description}
            </p>

            <p className="text-sm mt-4">
              <b>Technologies:</b> {selectedProject.technologies}
            </p>

            <p className="text-sm text-[var(--cv-muted)] mt-3">
              <b>Expected outcome:</b> {selectedProject.outcome}
            </p>
            {/* Project learning videos */}
            <section className="mt-6 border-t border-[var(--cv-border)] pt-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-500 text-xl">▶</span>
                <h3 className="text-lg font-black">
                  Project Learning Videos
                </h3>
              </div>

              <p className="text-xs text-[var(--cv-muted)] mb-4">
                Learn how to build {selectedProject.title} with practical tutorials.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  {
                    label: "BUILD THE PROJECT",
                    title: "Complete project tutorial",
                    query: `${selectedProject.title} ${selectedProject.technologies || course.title} full project tutorial`,
                    symbol: "</>",
                    tag: "PROJECT OVERVIEW"
                  },
                  {
                    label: "STEP BY STEP",
                    title: "Implementation guide",
                    query: `${selectedProject.title} ${selectedProject.technologies || course.title} step by step coding`,
                    symbol: "{ }",
                    tag: "PRACTICAL BUILD"
                  }
                ].map((video, videoIndex) => (
                  <a
                    key={video.label}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-xl border border-[var(--cv-border)] hover:border-violet-500 transition-all"
                  >
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#071b46] via-[#160b48] to-[#080d20] p-4">
                      <div
                        className="absolute inset-0 opacity-40"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 80% 20%, #7c3aed 0, transparent 45%), radial-gradient(circle at 10% 90%, #0284c7 0, transparent 45%)"
                        }}
                      />

                      <div className="relative h-full flex flex-col justify-between">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            <span className="text-sky-400">◆</span> SRH CodeVerse
                          </span>
                          <span className="text-[9px] font-bold text-violet-300">
                            {videoIndex === 0 ? "BUILD" : "IMPLEMENT"}
                          </span>
                        </div>

                        <div className="flex items-end justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] uppercase tracking-widest text-sky-300 font-bold">
                              {course.title}
                            </p>

                            <h4 className="text-sm sm:text-base font-black text-white leading-tight line-clamp-2 mt-1">
                              {selectedProject.title}
                            </h4>

                            <span className="inline-block mt-2 rounded bg-violet-600 px-2 py-1 text-[8px] font-bold text-white">
                              {video.tag}
                            </span>
                          </div>

                          <span className="text-3xl sm:text-4xl font-black text-sky-400">
                            {video.symbol}
                          </span>
                        </div>

                        <span className="absolute right-3 bottom-3 w-8 h-8 rounded-full border-2 border-white/80 bg-violet-600 flex items-center justify-center text-white">
                          ▶
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      <span className="text-[9px] font-black text-violet-600">
                        VIDEO {videoIndex + 1}
                      </span>

                      <h4 className="text-sm font-bold mt-1">
                        {video.title}
                      </h4>

                      <p className="text-[10px] text-[var(--cv-muted)] mt-1 line-clamp-2">
                        {video.query}
                      </p>

                      <span className="inline-block mt-3 text-xs font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
                        Find tutorials →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>


            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-white font-bold hover:bg-violet-700"
            >
              Close details
            </button>
          </div>
        </div>
      )}

      {/* Free Resources */}
      {tab === 'resources' && (
        <section
          className="grid md:grid-cols-2 gap-4 mt-5"
          role="tabpanel"
        >
          {resources.length === 0 ? (
            <p className="text-sm text-[var(--cv-muted)]">
              No resources are available for this course yet.
            </p>
          ) : (
            resources.map((resource, index) => (
              <a
                key={resource.id ?? `${resource.title}-${index}`}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="cv-section-panel rounded-2xl p-5 hover:-translate-y-1 hover:border-violet-500 transition-all duration-300"
              >
                <div className="flex justify-between gap-3">
                  <span className="text-xs font-black text-violet-600">
                    {resource.type}
                  </span>

                  {resource.free && (
                    <span className="text-[10px] font-bold text-emerald-600">
                      FREE
                    </span>
                  )}
                </div>

                <h3 className="font-black mt-2">
                  {resource.title}
                </h3>

                <p className="text-xs text-[var(--cv-muted)] mt-1">
                  {resource.provider}
                </p>

                <p className="text-sm text-[var(--cv-muted)] mt-3 leading-6">
                  {resource.description}
                </p>

                <span className="inline-block mt-4 text-xs font-bold text-violet-600">
                  Open resource ←—
                </span>
              </a>
            ))
          )}
        </section>
      )}
    </main>
  )
}

function CourseProblems({ slug }) {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProblems() {
      setLoading(true)
      setError('')

      try {
        const response = await getCourseProblems(slug)

        if (!cancelled) {
          setItems(
            Array.isArray(response.data) ? response.data : []
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              'Unable to load practice problems.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProblems()

    return () => {
      cancelled = true
    }
  }, [slug])

  const shown = items.filter((problem) => {
    if (filter === 'ALL') return true
    return String(problem.difficulty || '').toUpperCase() === filter
  })

  if (loading) {
    return (
      <section className="mt-5" role="tabpanel">
        <p className="text-sm text-[var(--cv-muted)]">
          Loading practice problems...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section
        className="mt-5 cv-section-panel rounded-2xl p-5"
        role="tabpanel"
      >
        <p className="text-sm text-red-500">{error}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold"
        >
          Retry
        </button>
      </section>
    )
  }

  return (
    <section className="mt-5" role="tabpanel">
      <div className="flex gap-2 mb-5 flex-wrap">
        {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={filter === level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              filter === level
                ? 'bg-violet-600 text-white border-violet-600'
                : 'border-[var(--cv-border)] hover:border-violet-500'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="cv-section-panel rounded-2xl p-6">
          <p className="font-bold">No practice problems found.</p>
          <p className="text-sm text-[var(--cv-muted)] mt-2">
            Try another filter or check whether problems have been
            assigned to this course.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {shown.map((problem, index) => (
            <button
              key={problem.id ?? `${problem.title}-${index}`}
              type="button"
              onClick={() => {
                if (problem.id === undefined || problem.id === null) {
                  setError('This problem has no valid ID.')
                  return
                }

                navigate(`/courses/${slug}/problems/${problem.id}`)
              }}
              className="cv-section-panel rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <div className="flex justify-between items-start gap-3">
                <b className="text-sm leading-6">
                  {index + 1}. {problem.title || 'Untitled problem'}
                </b>

                <span className="shrink-0 text-[10px] font-black text-violet-600">
                  {problem.difficulty || 'UNRATED'}
                </span>
              </div>

              <p className="text-xs text-[var(--cv-muted)] mt-3 leading-6">
                {problem.statement ||
                  problem.description ||
                  'Open this problem to view its details.'}
              </p>

              <div className="flex justify-between gap-2 mt-4 text-[10px] text-[var(--cv-muted)]">
                <span>{problem.topic || 'General'}</span>
                <span>
                  +{problem.xp ?? 0} XP · {problem.estimatedTimeMinutes ?? 0} min
                </span>
              </div>

              <span className="block mt-4 text-xs font-bold text-violet-600">
                Solve problem ←’
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default CourseDetail


