
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getProblems } from "../../api/problemApi"
import DifficultyBadge from "../../components/common/DifficultyBadge"
import { cachedFetch } from "../../utils/cache"
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
    let active = true
    setLoading(true)
    setError("")

    cachedFetch(
      `problems:${user?.username}`,
      () => getProblems().then((res) => res.data)
    )
      .then((data) => {
        if (active) setProblems(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || "Failed to load problems."
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user?.username])

  const topics = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(problems.map((problem) => problem.topic).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [problems]
  )

  const filtered = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()

    return problems
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((problem, index) => ({
        ...problem,
        problemNumber: index + 1,
      }))
      .filter((problem) => {
        const matchesSearch =
          !search ||
          String(problem.problemNumber).includes(search) ||
          String(problem.title || "").toLowerCase().includes(search)

        const matchesDifficulty =
          difficultyFilter === "ALL" ||
          String(problem.difficulty || "").toUpperCase() === difficultyFilter

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "SOLVED"
            ? Boolean(problem.solved)
            : !problem.solved)

        const matchesTopic =
          topicFilter === "ALL" || problem.topic === topicFilter

        return (
          matchesSearch &&
          matchesDifficulty &&
          matchesStatus &&
          matchesTopic
        )
      })
  }, [problems, searchQuery, difficultyFilter, statusFilter, topicFilter])

  const solvedCount = problems.filter((problem) => problem.solved).length

  const resetFilters = () => {
    setDifficultyFilter("ALL")
    setStatusFilter("ALL")
    setTopicFilter("ALL")
    setSearchQuery("")
  }

  const filterButton = (active) =>
    `shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
      active
        ? "border-violet-500 bg-violet-500 text-white shadow-sm shadow-violet-500/20"
        : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-violet-500/50 hover:text-[var(--color-text-primary)]"
    }`

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-3 w-40 rounded bg-slate-700/50" />
          <div className="mt-4 h-10 w-72 rounded bg-slate-700/50" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-700/30" />
          <div className="mt-8 h-28 rounded-2xl bg-slate-700/20" />
          <div className="mt-5 space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-20 rounded-xl bg-slate-700/20"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400"
        >
          <h1 className="text-lg font-bold">Unable to load problems</h1>
          <p className="mt-2">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 font-semibold hover:bg-red-500/10"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page heading */}
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-400">
          PRACTICE • IMPROVE • MASTER
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Problem Library
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Find your next challenge, practise consistently, and track the
              problems you have solved.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[230px]">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Total problems
              </p>
              <p className="mt-1 text-2xl font-black">{problems.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Solved
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-400">
                {solvedCount}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search and filters */}
      <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 sm:p-5">
        <label
          htmlFor="problem-search"
          className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]"
        >
          SEARCH PROBLEMS
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
            🔍
          </span>
          <input
            id="problem-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by problem name or number..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] py-3 pl-11 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="mt-5">
          <p className="mb-2.5 text-xs font-semibold text-[var(--color-text-secondary)]">
            DIFFICULTY
          </p>
          <div className="flex flex-wrap gap-2">
            {["ALL", "EASY", "MEDIUM", "HARD"].map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                aria-pressed={difficultyFilter === difficulty}
                onClick={() => setDifficultyFilter(difficulty)}
                className={filterButton(difficultyFilter === difficulty)}
              >
                {difficulty === "ALL" ? "All difficulties" : difficulty}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              STATUS
            </p>
            <div className="flex flex-wrap gap-2">
              {["ALL", "SOLVED", "UNSOLVED"].map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                  className={filterButton(statusFilter === status)}
                >
                  {status === "ALL"
                    ? "All status"
                    : status === "SOLVED"
                      ? "✓ Solved"
                      : "Unsolved"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="problem-topic"
              className="mb-2.5 block text-xs font-semibold text-[var(--color-text-secondary)]"
            >
              TOPIC
            </label>
            <select
              id="problem-topic"
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-violet-500"
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic === "ALL" ? "All topics" : topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Showing <strong>{filtered.length}</strong> of {problems.length} problems
          </p>

          {(searchQuery ||
            difficultyFilter !== "ALL" ||
            statusFilter !== "ALL" ||
            topicFilter !== "ALL") && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300"
            >
              Clear all filters ✕
            </button>
          )}
        </div>
      </section>

      {/* Problem results */}
      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
            🔎
          </div>
          <h2 className="mt-4 text-lg font-bold">No problems found</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Try another search or adjust your filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Clear filters
          </button>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="hidden grid-cols-[minmax(0,1fr)_100px_100px_44px] items-center gap-4 border-b border-[var(--color-border)] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] md:grid">
            <span>Problem</span>
            <span>Difficulty</span>
            <span>Time</span>
            <span className="text-center">Save</span>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {filtered.map((problem) => {
              const bookmarked = isBookmarked(problem.id)

              return (
                <div
                  key={problem.id}
                  className="flex min-w-0 items-start gap-3 px-4 py-4 transition hover:bg-[var(--color-bg-tertiary)] sm:px-5 md:items-center md:gap-4"
                >
                  <Link
                    to={`/problems/${problem.id}`}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500 md:items-center"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold md:mt-0 ${
                        problem.solved
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {problem.solved ? "✓" : problem.problemNumber}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-sm font-semibold text-[var(--color-text-primary)] transition hover:text-violet-400 sm:text-base">
                        {problem.title}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {problem.topic || "General"}
                        {problem.solved ? " · Solved" : ""}
                      </p>
                    </div>
                  </Link>

                  <div className="flex shrink-0 flex-col items-end gap-2 md:contents">
                    <div className="md:justify-self-start">
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </div>

                    <span className="whitespace-nowrap text-xs text-[var(--color-text-secondary)] md:justify-self-start">
                      {problem.estimatedTimeMinutes
                        ? `${problem.estimatedTimeMinutes} min`
                        : "—"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleBookmark(problem)
                      setProblems((current) => [...current])
                    }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl transition hover:bg-violet-500/10 ${
                      bookmarked
                        ? "text-violet-400"
                        : "text-[var(--color-text-secondary)] hover:text-violet-400"
                    }`}
                    title={bookmarked ? "Remove bookmark" : "Bookmark problem"}
                    aria-label={
                      bookmarked ? "Remove bookmark" : "Bookmark problem"
                    }
                    aria-pressed={bookmarked}
                  >
                    {bookmarked ? "★" : "☆"}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}

export default Problems
