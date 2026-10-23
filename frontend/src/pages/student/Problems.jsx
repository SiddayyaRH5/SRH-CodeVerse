import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getProblems } from "../../api/problemApi"
import { getCourses, getCourseProblems } from "../../api/courseApi"
import DifficultyBadge from "../../components/common/DifficultyBadge"

import { useAuth } from "../../context/AuthContext"
import { isBookmarked, toggleBookmark } from "../../utils/srhStudy"

function Problems() {
  const [problems, setProblems] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const [difficultyFilter, setDifficultyFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [topicFilter, setTopicFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")

    // The legacy /problems endpoint contains trainer-authored problems only.
    // The learning curriculum stores its practice set under each course, so
    // load those as well instead of showing an empty page for a fresh database.
    Promise.all([
      getCourses().then((response) => Array.isArray(response.data) ? response.data : []),
      getProblems().then((response) => Array.isArray(response.data) ? response.data : []).catch(() => []),
    ]).then(async ([courses, legacyProblems]) => {
      const curriculumSets = await Promise.all(courses.map(async (course) => {
        try {
          const response = await getCourseProblems(course.slug)
          const payload = response.data
          const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : Array.isArray(payload?.data) ? payload.data : []
          return rows.map((problem) => ({
            ...problem,
            solved: Boolean(problem.solved),
            courseSlug: course.slug,
            courseTitle: course.title,
            source: "course",
            topic: problem.topic || course.title,
          }))
        } catch {
          return []
        }
      }))
      const legacy = legacyProblems.map((problem) => ({ ...problem, source: "legacy" }))
      const combined = [...legacy, ...curriculumSets.flat()]
      const unique = Array.from(new Map(combined.map((problem) => [`${problem.source}:${problem.id}:${problem.courseSlug || ""}`, problem])).values())
      if (!cancelled) setProblems(unique)
    }).catch((err) => {
      if (!cancelled) setError(err.response?.data?.message || "Failed to load problems. Check that the backend is running.")
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [user?.username])

  if (loading) {
    return (
      <p className="text-[var(--color-text-secondary)]">
        Loading problems...
      </p>
    )
  }

  if (error) {
    return (
      <p className="text-[var(--color-danger)]">
        {error}
      </p>
    )
  }

  // =========================================================
  // SORT PROBLEMS
  // =========================================================

  const sortedProblems = [...problems].sort((a, b) => a.id - b.id)

  // =========================================================
  // TOPICS
  // =========================================================

  const topics = ["ALL", ...Array.from(
      new Set(problems.map((p) => p.topic))
    ),
  ]

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const search = searchQuery.trim().toLowerCase()

  const filtered = sortedProblems
    .map((p, index) => ({
      ...p,
      problemNumber: index + 1,
    }))

    // -------------------------------------------------------
    // SEARCH BY PROBLEM NUMBER OR NAME
    // -------------------------------------------------------

    .filter((p) => {
      if (!search) {
        return true
      }

      const problemNumber = String(p.problemNumber)

      const problemName = p.title?.toLowerCase() || ""

      const matchesNumber = problemNumber.includes(search)

      const matchesName = problemName.includes(search)

      return matchesNumber || matchesName
    })

    // -------------------------------------------------------
    // DIFFICULTY
    // -------------------------------------------------------

    .filter(
      (p) =>
        difficultyFilter === "ALL" ||
        p.difficulty === difficultyFilter
    )

    // -------------------------------------------------------
    // STATUS
    // -------------------------------------------------------

    .filter(
      (p) =>
        statusFilter === "ALL" ||
        (
          statusFilter === "SOLVED"
            ? p.solved
            : !p.solved
        )
    )

    // -------------------------------------------------------
    // TOPIC
    // -------------------------------------------------------

    .filter(
      (p) =>
        topicFilter === "ALL" ||
        p.topic === topicFilter
    )

  // =========================================================
  // FILTER PILL STYLE
  // =========================================================

  const pillClass = (active) =>
    `text-xs font-medium px-3 py-1.5 rounded-full border transition ${
      active
        ? "bg-[var(--color-forge-500)] text-white border-[var(--color-forge-500)]"
        : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-forge-500)]"
    }`

  return (
    <div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <h1 className="text-2xl font-bold mb-4">
        Problems
      </h1>

      {/* =====================================================
          FILTERS + SEARCH
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">

        {/* ===================================================
            FILTERS
        ==================================================== */}

        <div className="flex flex-wrap items-center gap-2">

          {/* Difficulty */}
          {["ALL", "EASY", "MEDIUM", "HARD"].map((d) => (
            <button
              key={d}
              onClick={() =>
                setDifficultyFilter(d)
              }
              className={pillClass(
                difficultyFilter === d
              )}
            >
              {d}
            </button>
          ))}

          <span className="w-px h-5 bg-[var(--color-border)] mx-1" />

          {/* Status */}
          {["ALL", "SOLVED", "UNSOLVED"].map((s) => (
            <button
              key={s}
              onClick={() =>
                setStatusFilter(s)
              }
              className={pillClass(
                statusFilter === s
              )}
            >
              {s}
            </button>
          ))}

          <span className="w-px h-5 bg-[var(--color-border)] mx-1" />

          {/* Topic */}
          <select
            value={topicFilter}
            onChange={(e) =>
              setTopicFilter(e.target.value)
            }
            className="
              text-xs
              bg-[var(--color-bg-secondary)]
              border
              border-[var(--color-border)]
              rounded-full
              px-3
              py-1.5
              text-[var(--color-text-secondary)]
              focus:outline-none
              focus:border-[var(--color-forge-500)]
              cursor-pointer
            "
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t === "ALL"
                  ? "All Topics"
                  : t}
              </option>
            ))}
          </select>

        </div>

        {/* ===================================================
            SEARCH BAR
        ==================================================== */}

        <div className="relative w-full sm:w-90 lg:w-100">

          {/* Search Icon */}
          <span
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[var(--color-text-secondary)]
              pointer-events-none
              text-sm
            "
          >
            🔍
          </span>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
            placeholder="Search problems..."
            className="
              w-full
              pl-9
              pr-9
              py-1.5
              text-xs
              bg-[var(--color-bg-secondary)]
              border
              border-[var(--color-border)]
              rounded-full
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-secondary)]
              focus:outline-none
              focus:border-[var(--color-forge-500)]
              focus:ring-1
              focus:ring-[var(--color-forge-500)]
              transition
            "
          />

          {/* Clear Search */}
          {searchQuery && (
            <button
              type="button"
              onClick={() =>
                setSearchQuery("")
              }
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-[var(--color-text-secondary)]
                hover:text-[var(--color-text-primary)]
                transition
              "
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          RESULTS COUNT
      ====================================================== */}

      {searchQuery && (
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "problem"
            : "problems"}{" "}
          found
        </p>
      )}

      {/* =====================================================
          PROBLEM LIST / NO RESULTS
      ====================================================== */}

      {filtered.length === 0 ? (

        <div className="py-10 text-center">

          <div className="text-3xl mb-3"> 🔍 </div>

          <p className="text-sm font-medium">
            No problems found
          </p>

          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Try searching for a different problem
            name or number.
          </p>

          {searchQuery && (
            <button
              onClick={() =>
                setSearchQuery("")
              }
              className="
                mt-4
                text-xs
                font-medium
                text-[var(--color-forge-500)]
                hover:underline
              "
            >
              Clear search
            </button>
          )}

        </div>

      ) : (

        <div className="flex flex-col gap-2">

          {filtered.map((p) => (

            <Link
              key={`${p.source || "legacy"}-${p.courseSlug || ""}-${p.id}`}
              to={p.source === "course" ? `/courses/${p.courseSlug}?tab=problems` : `/problems/${p.id}`}
              className="
                flex
                items-center
                justify-between
                bg-[var(--color-bg-secondary)]
                border
                border-[var(--color-border)]
                rounded-lg
                p-4
                hover:border-[var(--color-forge-500)]
                transition
              "
            >

              {/* =================================================
                  LEFT SIDE
              ================================================== */}

              <div className="flex items-center gap-3">

                {/* Solved */}
                {p.solved && (
                  <span className="text-[var(--color-success)]">
                    ✓
                  </span>
                )}

                {/* Problem Number + Title */}
                <span className="font-medium">

                  <span className="text-[var(--color-text-secondary)] mr-2">
                    {p.problemNumber}.
                  </span>

                  {p.title}

                </span>

                {/* Topic */}
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {p.topic}{p.courseTitle ? ` · ${p.courseTitle}` : ""}
                </span>

              </div>

              {/* =================================================
                  RIGHT SIDE
              ================================================== */}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); toggleBookmark(p); setProblems((current) => [...current]) }}
                  className={`text-lg transition hover:scale-110 ${isBookmarked(p.id) ? "text-[var(--color-forge-500)]" : "text-[var(--color-text-secondary)]"}`}
                  title={isBookmarked(p.id) ? "Remove bookmark" : "Bookmark problem"}
                  aria-label={isBookmarked(p.id) ? "Remove bookmark" : "Bookmark problem"}
                >
                  {isBookmarked(p.id) ? "★" : "☆"}
                </button>

                <div className="flex items-center gap-4">

                {/* Estimated Time */}
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {p.estimatedTimeMinutes} min
                </span>

                {/* Difficulty */}
                  <DifficultyBadge
                    difficulty={p.difficulty}
                  />
                </div>

              </div>

            </Link>

          ))}

        </div>

      )}

    </div>
  )
}

export default Problems