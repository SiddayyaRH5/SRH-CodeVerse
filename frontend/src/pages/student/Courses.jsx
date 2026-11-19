import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getCourses } from "../../api/courseApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import EmptyState from "../../components/common/EmptyState"
import { SkeletonCards } from "../../components/common/Skeleton"

const LEVELS = ["ALL", "Beginner", "Intermediate", "Advanced"]

const NAV_ICONS = {
  default: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  java: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" />
    </svg>
  ),
  python: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2s.9-2 2-2h12c1.1 0 2 .9 2 2z" />
    </svg>
  ),
  javascript: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5" />
    </svg>
  ),
  html: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  css: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5" />
    </svg>
  ),
  react: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><polygon points="12 2 2 7 12 17 22 7" /><polyline points="2 17 12 22 22 17" /><polyline points="2 17 12 22 22 17" />
    </svg>
  ),
  sql: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 0-4 1l1.5 7.5L12 21" />
    </svg>
  ),
  database: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 0-4 1l1.5 7.5L12 21" />
    </svg>
  ),
  spring: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
}

function getCourseIcon(course) {
  const text = `${course.title || ""} ${course.category || ""}`.toLowerCase()
  const match = Object.keys(NAV_ICONS).find(
    (key) => key !== "default" && text.includes(key)
  )
  return NAV_ICONS[match || "default"]
}

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("ALL")
  const [level, setLevel] = useState("ALL")

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getCourses()
      setCourses(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load courses. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const categories = useMemo(
    () => [
      "ALL",
      ...new Set(
        courses
          .map((course) => course.category)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      ),
    ],
    [courses]
  )

  const search = query.toLowerCase().trim()
  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const matchesCategory = category === "ALL" || course.category === category
      const matchesLevel = level === "ALL" || course.level === level
      const searchableText = [course.title, course.shortDescription, course.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return (
        matchesCategory &&
        matchesLevel &&
        (!search || searchableText.includes(search))
      )
    })
  }, [courses, category, level, search])

  const resetFilters = useCallback(() => {
    setQuery("")
    setCategory("ALL")
    setLevel("ALL")
  }, [])

  const hasActiveFilters = query || category !== "ALL" || level !== "ALL"

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={6} />
        </PageContainer>
      </main>
    )
  }

  if (error) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl" aria-hidden="true">!</div>
            <h2 className="mt-5 text-lg font-bold">Unable to load courses</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">{error}</p>
            <button type="button" onClick={fetchCourses} className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Try again</button>
          </div>
        </PageContainer>
      </main>
    )
  }

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="SRH CODEVERSE ACADEMY"
          title="Learn with structure."
          description="Explore structured curricula, practical exercises, projects, and resources to build your skills from fundamentals to interviews."
          actions={
            <>
              <p className="cv-pill">
                <span className="w-2 h-2 rounded-full bg-[var(--cv-primary)] mr-2" />{courses.length} available courses
              </p>
            </>
          }
        />

        <section className="mb-6 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px]">
            <div className="min-w-0">
              <label htmlFor="course-search" className="mb-2 block text-xs font-semibold text-[var(--cv-muted)] uppercase tracking-wide">
                Search courses
              </label>
              <input
                id="course-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Java, React, databases..."
                className="cv-input"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="course-category" className="mb-2 block text-xs font-semibold text-[var(--cv-muted)] uppercase tracking-wide">
                Category
              </label>
              <select
                id="course-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="cv-input"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL" ? "All categories" : item}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="course-level" className="mb-2 block text-xs font-semibold text-[var(--cv-muted)] uppercase tracking-wide">
                Difficulty
              </label>
              <select
                id="course-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="cv-input"
              >
                {LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL" ? "All levels" : item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--cv-muted)]">
              Showing {filtered.length} of {courses.length} courses
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="text-xs font-semibold text-[var(--cv-primary)] hover:text-violet-300 underline">
                Clear filters
              </button>
            )}
          </div>
        </section>

        {filtered.length === 0 ? (
          <EmptyState
            icon="🔎"
            title="No matching courses"
            description="Try a different search or clear your filters."
            actionLabel="Show all courses"
            actionTo="/courses"
            className="max-w-md mx-auto mt-10"
          />
        ) : (
          <section aria-label="Available courses" className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => {
              const progress = Math.min(100, Math.max(0, Number(course.progressPercent) || 0))
              const durationHours = Math.round((Number(course.estimatedDurationMinutes) || 0) / 60)
              const icon = getCourseIcon(course)

              return (
                <Link
                  key={course.slug}
                  to={`/courses/${course.slug}`}
                  className="cv-course-card group block min-w-0 overflow-hidden rounded-3xl border border-[var(--cv-border)] bg-[var(--cv-surface)] transition-all hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden border-b border-[var(--cv-border)] bg-gradient-to-br from-violet-600/15 via-[var(--cv-surface-2)] to-cyan-500/10">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {icon}
                      </div>
                    )}
                    <span className="absolute right-4 top-4 rounded-full border border-violet-400/20 bg-[var(--cv-surface)]/95 px-3 py-1.5 text-[10px] font-bold text-[var(--cv-primary)] shadow-sm">
                      {course.level || "All levels"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {course.category && (
                        <span className="rounded-full bg-[var(--cv-surface-2)] px-3 py-1 text-[10px] font-semibold text-[var(--cv-muted)]">
                          {course.category}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black leading-snug group-hover:text-[var(--cv-primary)] transition-colors">
                      {course.title}
                    </h2>
                    <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[var(--cv-muted)]">
                      {course.shortDescription || "Explore lessons and practical exercises in this course."}
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-[var(--cv-surface-2)] p-3 text-center">
                        <p className="text-lg font-black">{course.lessonCount ?? 0}</p>
                        <p className="mt-1 text-[10px] text-[var(--cv-muted)]">Lessons</p>
                      </div>
                      <div className="rounded-xl bg-[var(--cv-surface-2)] p-3 text-center">
                        <p className="text-lg font-black">{course.problemCount ?? 0}</p>
                        <p className="mt-1 text-[10px] text-[var(--cv-muted)]">Practice</p>
                      </div>
                      <div className="rounded-xl bg-[var(--cv-surface-2)] p-3 text-center">
                        <p className="text-lg font-black">{durationHours}h</p>
                        <p className="mt-1 text-[10px] text-[var(--cv-muted)]">Learning</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--cv-muted)]">Progress</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--cv-surface-2)]">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-[var(--cv-border)] pt-4 text-sm font-bold text-[var(--cv-primary)]">
                      <span>Explore course</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>
        )}
      </PageContainer>
    </main>
  )
}

export default Courses