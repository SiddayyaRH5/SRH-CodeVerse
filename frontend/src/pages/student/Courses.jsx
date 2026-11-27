
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getCourses } from "../../api/courseApi"

const LEVELS = ["ALL", "Beginner", "Intermediate", "Advanced"]
const ACCESS = ["ALL", "FREE", "PAID"]
const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "title", label: "Title A-Z" },
  { value: "duration", label: "Shortest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
]

const COURSE_ICONS = {
  java: "☕",
  python: "🐍",
  javascript: "JS",
  html: "🌐",
  css: "🎨",
  react: "⚛️",
  sql: "🗄️",
  database: "🗄️",
  spring: "🌱",
  default: "💻",
}

function getCourseIcon(course) {
  const text = `${course.title || ""} ${course.category || ""}`.toLowerCase()
  const match = Object.keys(COURSE_ICONS).find(
    (key) => key !== "default" && text.includes(key)
  )
  return COURSE_ICONS[match || "default"]
}

function isPaid(course) {
  return String(course.courseType || "").toUpperCase() === "PAID"
}

function formatPrice(course) {
  const amount = isPaid(course) ? Number(course.price) || 0 : 0
  const currency = course.currency || "INR"
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("ALL")
  const [level, setLevel] = useState("ALL")
  const [access, setAccess] = useState("ALL")
  const [sort, setSort] = useState("featured")
  const [brokenImages, setBrokenImages] = useState({})

  useEffect(() => {
    let active = true

    getCourses()
      .then((response) => {
        if (!active) return
        setCourses(Array.isArray(response.data) ? response.data : [])
      })
      .catch((err) => {
        if (!active) return
        setError(
          err.response?.data?.message || "Unable to load courses. Please try again."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

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

  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim()

    const result = courses.filter((course) => {
      const matchesCategory =
        category === "ALL" || course.category === category
      const matchesLevel = level === "ALL" || course.level === level
      const matchesAccess =
        access === "ALL" ||
        (access === "PAID" ? isPaid(course) : !isPaid(course))

      const searchableText = [
        course.title,
        course.shortDescription,
        course.category,
        course.instructor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return (
        matchesCategory &&
        matchesLevel &&
        matchesAccess &&
        (!search || searchableText.includes(search))
      )
    })

    const sorted = [...result]
    if (sort === "title") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    } else if (sort === "duration") {
      sorted.sort(
        (a, b) =>
          (Number(a.estimatedDurationMinutes) || 0) -
          (Number(b.estimatedDurationMinutes) || 0)
      )
    } else if (sort === "price-asc" || sort === "price-desc") {
      sorted.sort((a, b) => {
        const left = isPaid(a) ? Number(a.price) || 0 : 0
        const right = isPaid(b) ? Number(b.price) || 0 : 0
        return sort === "price-asc" ? left - right : right - left
      })
    }
    return sorted
  }, [courses, category, level, access, query, sort])

  const clearFilters = () => {
    setQuery("")
    setCategory("ALL")
    setLevel("ALL")
    setAccess("ALL")
    setSort("featured")
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-3 w-44 rounded bg-slate-700/50" />
          <div className="mt-4 h-10 w-80 max-w-full rounded bg-slate-700/50" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-700/30" />

          <div className="mt-8 h-24 rounded-2xl bg-slate-700/20" />

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-3xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)]"
              >
                <div className="aspect-video bg-slate-700/40" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 rounded bg-slate-700/40" />
                  <div className="h-3 w-full rounded bg-slate-700/30" />
                  <div className="h-3 w-4/5 rounded bg-slate-700/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400"
        >
          <h1 className="text-lg font-bold">Unable to load courses</h1>
          <p className="mt-2">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 font-semibold hover:bg-red-500/10"
          >
            Try again
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="cv-kicker">SRH CODEVERSE ACADEMY</p>

        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Learn with <span className="cv-gradient-text">structure.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted)] sm:text-base">
              Explore structured curricula, practical exercises, projects, and
              resources to build your skills from fundamentals to interviews.
            </p>
          </div>

          <div className="w-fit rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)] px-4 py-3">
            <p className="text-xs text-[var(--cv-muted)]">Available courses</p>
            <p className="mt-1 text-2xl font-black">{courses.length}</p>
          </div>
        </div>
      </header>

      <section className="mb-8 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="course-search"
              className="mb-2 block text-xs font-semibold text-[var(--cv-muted)]"
            >
              SEARCH COURSES
            </label>
            <input
              id="course-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Java, React, databases..."
              className="cv-input w-full min-w-0"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="course-category"
              className="mb-2 block text-xs font-semibold text-[var(--cv-muted)]"
            >
              CATEGORY
            </label>
            <select
              id="course-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="cv-input w-full min-w-0"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "All categories" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="course-level"
              className="mb-2 block text-xs font-semibold text-[var(--cv-muted)]"
            >
              DIFFICULTY
            </label>
            <select
              id="course-level"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="cv-input w-full min-w-0"
            >
              {LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "All levels" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="course-access"
              className="mb-2 block text-xs font-semibold text-[var(--cv-muted)]"
            >
              ACCESS
            </label>
            <select
              id="course-access"
              value={access}
              onChange={(event) => setAccess(event.target.value)}
              className="cv-input w-full min-w-0"
            >
              {ACCESS.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "Free & paid" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="course-sort"
              className="mb-2 block text-xs font-semibold text-[var(--cv-muted)]"
            >
              SORT BY
            </label>
            <select
              id="course-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="cv-input w-full min-w-0"
            >
              {SORTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--cv-muted)]">
            Showing {filtered.length} of {courses.length} courses
          </p>

          {(query || category !== "ALL" || level !== "ALL" || access !== "ALL" || sort !== "featured") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {filtered.length > 0 ? (
        <section
          aria-label="Available courses"
          className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((course) => {
            const progress = Math.min(
              100,
              Math.max(0, Number(course.progressPercent) || 0)
            )
            const paid = isPaid(course)
            const durationHours = Math.round(
              (Number(course.estimatedDurationMinutes) || 0) / 60
            )
            const icon = getCourseIcon(course)
            const imageFailed = brokenImages[course.slug]
            const image = course.thumbnailUrl || course.thumbnail

            return (
              <Link
                key={course.slug}
                to={`/courses/${course.slug}`}
                className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--cv-border)] bg-[var(--cv-surface)] transition duration-200 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <div className="relative aspect-video overflow-hidden border-b border-[var(--cv-border)] bg-gradient-to-br from-violet-600/15 via-[var(--cv-surface-2)] to-cyan-500/10">
                  {image && !imageFailed ? (
                    <img
                      src={image}
                      alt={`${course.title} course thumbnail`}
                      loading="lazy"
                      onError={() =>
                        setBrokenImages((current) => ({
                          ...current,
                          [course.slug]: true,
                        }))
                      }
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-500/10 text-5xl font-black text-violet-300">
                      {icon}
                    </div>
                  )}

                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide shadow-sm ${
                      paid
                        ? "bg-amber-400 text-slate-900"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {paid ? "Paid" : "Free"}
                  </span>

                  <span className="absolute right-4 top-4 rounded-full border border-violet-400/20 bg-[var(--cv-surface)]/95 px-3 py-1.5 text-[10px] font-bold text-violet-400 shadow-sm">
                    {course.level || course.difficulty || "All levels"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {course.category && (
                      <span className="rounded-full bg-[var(--cv-surface-2)] px-3 py-1 text-[10px] font-semibold text-[var(--cv-muted)]">
                        {course.category}
                      </span>
                    )}
                    {course.rating > 0 && (
                      <span className="rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-semibold text-amber-400">
                        ★ {course.rating}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-black leading-snug transition group-hover:text-violet-400">
                    {course.title}
                  </h2>

                  <p className="mt-2 text-xs font-semibold text-[var(--cv-muted)]">
                    By {course.instructor || "SRH CodeVerse"}
                  </p>

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
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--cv-border)] pt-4">
                    <span className="text-base font-black text-[var(--cv-text-primary)]">
                      {paid ? formatPrice(course) : "FREE"}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-bold text-violet-400">
                      View course
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
            🔎
          </div>
          <h2 className="mt-4 text-lg font-bold">No matching courses</h2>
          <p className="mt-2 text-sm text-[var(--cv-muted)]">
            Try a different search or clear your filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="cv-primary-btn mt-5 !px-5 !py-3 text-sm"
          >
            Show all courses
          </button>
        </section>
      )}
    </main>
  )
}

export default Courses
