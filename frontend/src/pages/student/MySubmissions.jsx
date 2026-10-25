import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getMySubmissions } from "../../api/submissionApi"

function formatDate(value) {
  if (!value) return "Date unavailable"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toUpperCase()

  const styles = {
    PASSED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    FAILED: "border-red-500/30 bg-red-500/10 text-red-600",
    ERROR: "border-red-500/30 bg-red-500/10 text-red-600",
    RUNNING: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[normalized] || "border-gray-500/30 bg-gray-500/10 text-gray-500"
      }`}
    >
      {normalized}
    </span>
  )
}

function MySubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await getMySubmissions()
      // Supports either a plain array or a Spring/API wrapper.
      const payload = response.data
      const records = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.value)
          ? payload.value
          : Array.isArray(payload?.data)
            ? payload.data
            : []

      setSubmissions(records)
    } catch (err) {
      const status = err.response?.status

      if (status === 401 || status === 403) {
        setError("Your session may have expired or you do not have permission to view submissions. Please sign in again.")
      } else {
        setError(
          err.response?.data?.message ||
            "Could not load your submissions. Check that the backend is running and try again."
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase()

    return submissions.filter((item) => {
      const title = String(item.problemTitle || "").toLowerCase()
      const code = String(item.code || "").toLowerCase()
      const status = String(item.status || "").toUpperCase()

      const matchesSearch = !query || title.includes(query) || code.includes(query)
      const matchesStatus = statusFilter === "ALL" || status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [submissions, search, statusFilter])

  const passedCount = submissions.filter(
    (item) => String(item.status).toUpperCase() === "PASSED"
  ).length

  const totalTestsPassed = submissions.reduce(
    (sum, item) => sum + (Number(item.passedTestCount) || 0),
    0
  )

  const totalTests = submissions.reduce(
    (sum, item) => sum + (Number(item.totalTestCount) || 0),
    0
  )

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-3xl border border-[var(--cv-border,rgba(128,128,128,0.2))] bg-[var(--cv-surface,#ffffff)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-500">
              Your coding journey
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Submissions
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cv-muted,#6b7280)]">
              Review your attempts, check your results, and keep improving one
              problem at a time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadSubmissions}
              disabled={loading}
              className="rounded-xl border border-[var(--cv-border,rgba(128,128,128,0.25))] px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              to="/problems"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Practice problems
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--cv-border,rgba(128,128,128,0.2))] bg-[var(--cv-surface,#ffffff)] p-5">
          <p className="text-sm text-[var(--cv-muted,#6b7280)]">Total submissions</p>
          <p className="mt-2 text-3xl font-bold">{submissions.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--cv-border,rgba(128,128,128,0.2))] bg-[var(--cv-surface,#ffffff)] p-5">
          <p className="text-sm text-[var(--cv-muted,#6b7280)]">Passed submissions</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{passedCount}</p>
        </div>
        <div className="rounded-2xl border border-[var(--cv-border,rgba(128,128,128,0.2))] bg-[var(--cv-surface,#ffffff)] p-5">
          <p className="text-sm text-[var(--cv-muted,#6b7280)]">Test cases passed</p>
          <p className="mt-2 text-3xl font-bold">
            {totalTestsPassed}
            <span className="ml-2 text-base font-medium text-[var(--cv-muted,#6b7280)]">
              / {totalTests}
            </span>
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--cv-border,rgba(128,128,128,0.2))] bg-[var(--cv-surface,#ffffff)]">
        <div className="flex flex-col gap-3 border-b border-[var(--cv-border,rgba(128,128,128,0.2))] p-4 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search problem or submitted code..."
            aria-label="Search submissions"
            className="min-w-0 flex-1 rounded-xl border border-[var(--cv-border,rgba(128,128,128,0.25))] bg-transparent px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by submission status"
            className="rounded-xl border border-[var(--cv-border,rgba(128,128,128,0.25))] bg-[var(--cv-surface,#ffffff)] px-4 py-3 text-sm outline-none focus:border-violet-500"
          >
            <option value="ALL">All statuses</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="ERROR">Error</option>
            <option value="RUNNING">Running</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--cv-muted,#6b7280)]">
            Loading your submission history...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadSubmissions}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Try again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl" aria-hidden="true">{"</>"}</div>
            <h2 className="mt-4 text-lg font-bold">
              {submissions.length === 0
                ? "No submissions yet"
                : "No matching submissions"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--cv-muted,#6b7280)]">
              {submissions.length === 0
                ? "Your submitted solutions will appear here. Choose a problem and submit your first solution."
                : "Try a different search term or select another status."}
            </p>
            {submissions.length === 0 && (
              <Link
                to="/problems"
                className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Explore problems
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.025] text-xs uppercase tracking-wider text-[var(--cv-muted,#6b7280)]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Problem</th>
                    <th className="px-5 py-4 font-semibold">Result</th>
                    <th className="px-5 py-4 font-semibold">Test cases</th>
                    <th className="px-5 py-4 font-semibold">Runtime</th>
                    <th className="px-5 py-4 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-[var(--cv-border,rgba(128,128,128,0.15))] transition hover:bg-black/[0.02]"
                    >
                      <td className="max-w-xs px-5 py-5">
                        <Link
                          to={`/problems/${item.problemId}`}
                          className="font-semibold hover:text-violet-600"
                        >
                          {item.problemTitle || `Problem #${item.problemId}`}
                        </Link>
                        <p className="mt-1 text-xs text-[var(--cv-muted,#6b7280)]">
                          Submission #{item.id}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-5 tabular-nums">
                        {item.passedTestCount ?? 0} / {item.totalTestCount ?? 0}
                      </td>
                      <td className="px-5 py-5 tabular-nums">
                        {item.runtimeMs == null ? "—" : `${item.runtimeMs} ms`}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-[var(--cv-muted,#6b7280)]">
                        {formatDate(item.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredSubmissions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-[var(--cv-border,rgba(128,128,128,0.2))] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/problems/${item.problemId}`}
                        className="font-semibold hover:text-violet-600"
                      >
                        {item.problemTitle || `Problem #${item.problemId}`}
                      </Link>
                      <p className="mt-1 text-xs text-[var(--cv-muted,#6b7280)]">
                        Submission #{item.id}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[var(--cv-muted,#6b7280)]">Test cases</p>
                      <p className="mt-1 font-semibold">
                        {item.passedTestCount ?? 0} / {item.totalTestCount ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--cv-muted,#6b7280)]">Runtime</p>
                      <p className="mt-1 font-semibold">
                        {item.runtimeMs == null ? "—" : `${item.runtimeMs} ms`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[var(--cv-muted,#6b7280)]">
                    {formatDate(item.submittedAt)}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}

        {!loading && !error && filteredSubmissions.length > 0 && (
          <div className="border-t border-[var(--cv-border,rgba(128,128,128,0.15))] px-5 py-3 text-xs text-[var(--cv-muted,#6b7280)]">
            Showing {filteredSubmissions.length} of {submissions.length} submissions
          </div>
        )}
      </section>
    </main>
  )
}

export default MySubmissions
