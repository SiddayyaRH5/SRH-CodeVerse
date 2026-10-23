import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getTrainerProblems, deleteProblem } from "../../api/problemApi"
import DifficultyBadge from "../../components/common/DifficultyBadge"
import ConfirmModal from "../../components/common/ConfirmModal"
import { useToast } from "../../context/ToastContext"

function TrainerProblems() {
  const { showToast } = useToast()

  const [problems, setProblems] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, title } or null

  const loadProblems = () => {
    setLoading(true)
    getTrainerProblems()
      .then((res) => setProblems(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load problems"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProblems()
  }, [])

  const requestDelete = (id, title) => {
    setConfirmDelete({ id, title })
  }

  const confirmDeleteProblem = async () => {
    const { id, title } = confirmDelete
    setConfirmDelete(null)
    try {
      await deleteProblem(id)
      setProblems((prev) => prev.filter((p) => p.id !== id))
      showToast(`"${title}" deleted.`, "success")
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete problem", "error")
    }
  }

  if (loading) return <p className="text-[var(--color-text-secondary)]">Loading problems...</p>
  if (error) return <p className="text-[var(--color-danger)]">{error}</p>

  const search = searchQuery.trim().toLowerCase()
  const sortedProblems = [...problems].sort((a, b) => a.id - b.id)
  const filteredProblems = sortedProblems.filter((p) => {
    if (!search) return true
    const title = p.title?.toLowerCase() || ""
    const topic = p.topic?.toLowerCase() || ""
    const difficulty = p.difficulty?.toLowerCase() || ""
    return title.includes(search) || topic.includes(search) || difficulty.includes(search)
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Manage Problems</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-64 sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-forge-500)] focus:ring-1 focus:ring-[var(--color-forge-500)] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
              >
                ✕
              </button>
            )}
          </div>

          <Link
            to="/trainer/problems/new"
            className="whitespace-nowrap bg-[var(--color-forge-500)] hover:bg-[var(--color-forge-600)] text-white font-semibold px-4 py-2 rounded transition"
          >
            + New Problem
          </Link>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && problems.length > 0 && (
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">
          {filteredProblems.length} {filteredProblems.length === 1 ? "problem" : "problems"} found
        </p>
      )}

      {/* Empty / no-results / list */}
      {problems.length === 0 ? (
        <p className="text-[var(--color-text-secondary)]">No problems yet. Create your first one.</p>
      ) : filteredProblems.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm font-medium">No problems found</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Try searching with a different problem name, topic, or difficulty.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-xs font-medium text-[var(--color-forge-500)] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredProblems.map((p) => {
            const problemNumber = sortedProblems.findIndex((problem) => problem.id === p.id) + 1

            return (
              <div
                key={p.id}
                className="flex items-center justify-between bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-forge-500)] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium truncate">
                    <span className="text-[var(--color-text-secondary)] mr-2">{problemNumber}.</span>
                    {p.title}
                  </span>
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className="text-sm text-[var(--color-text-secondary)]">{p.topic}</span>
                </div>

                <div className="flex gap-3 text-sm shrink-0">
                  <Link to={`/trainer/problems/${p.id}/edit`} className="text-[var(--color-forge-500)] hover:underline">
                    Edit
                  </Link>
                  <button
                    onClick={() => requestDelete(p.id, p.title)}
                    className="text-xs text-[var(--color-danger)] hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete Problem"
        message={confirmDelete ? `Delete "${confirmDelete.title}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={confirmDeleteProblem}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default TrainerProblems