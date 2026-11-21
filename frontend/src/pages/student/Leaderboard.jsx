
import { useEffect, useState } from "react"
import { getLeaderboard } from "../../api/leaderboardApi"

function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    getLeaderboard()
      .then((res) => {
        if (!active) return
        setEntries(Array.isArray(res.data) ? res.data : [])
      })
      .catch((err) => {
        if (!active) return
        setError(
          err.response?.data?.message || "Failed to load leaderboard."
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const topThree = entries
    .slice()
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .filter((entry) => Number(entry.rank) >= 1 && Number(entry.rank) <= 3)
    .sort((a, b) => Number(a.rank) - Number(b.rank))

  const getMedal = (rank) => {
    if (Number(rank) === 1) return "🥇"
    if (Number(rank) === 2) return "🥈"
    if (Number(rank) === 3) return "🥉"
    return null
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-3 w-36 rounded bg-slate-700/50" />
          <div className="mt-4 h-10 w-72 max-w-full rounded bg-slate-700/50" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-700/30" />

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
              />
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-400">
          CODEVERSE COMMUNITY
        </p>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Leaderboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Celebrate your progress, stay consistent, and see how you rank
              among fellow CodeVerse learners.
            </p>
          </div>

          <div className="w-fit rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Participants
            </p>
            <p className="mt-1 text-xl font-black">{entries.length}</p>
          </div>
        </div>
      </header>

      {error ? (
        <section
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400"
        >
          <p className="font-semibold">Unable to load the leaderboard</p>
          <p className="mt-2">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 font-semibold transition hover:bg-red-500/10"
          >
            Try again
          </button>
        </section>
      ) : entries.length === 0 ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-3xl">
            🏆
          </div>
          <h2 className="mt-5 text-xl font-bold">Your journey starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
            No leaderboard entries are available yet. Solve coding problems
            and keep practising to build your progress.
          </p>
        </section>
      ) : (
        <>
          {/* Top three */}
          {topThree.length > 0 && (
            <section className="mb-10">
              <div className="mb-4">
                <h2 className="text-lg font-bold">Top performers</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  The current leaders of the CodeVerse community.
                </p>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
                {topThree.map((entry) => {
                  const rank = Number(entry.rank)
                  const medal = getMedal(rank)

                  const accent =
                    rank === 1
                      ? "border-amber-400/40 from-amber-400/10"
                      : rank === 2
                        ? "border-slate-400/30 from-slate-400/10"
                        : "border-orange-500/30 from-orange-500/10"

                  return (
                    <article
                      key={entry.username}
                      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accent} to-[var(--color-bg-secondary)] p-5`}
                    >
                      {rank === 1 && (
                        <span className="absolute right-4 top-4 rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Top rank
                        </span>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/10 text-3xl">
                          {medal}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                            Rank #{entry.rank}
                          </p>
                          <h3 className="mt-1 truncate text-lg font-black">
                            {entry.username}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-black/10 p-3">
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            Problems solved
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {entry.problemsSolved ?? 0}
                          </p>
                        </div>

                        <div className="rounded-xl bg-black/10 p-3">
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            Current streak
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {entry.forgeStreakCurrent ?? 0} 🔥
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {/* Full leaderboard */}
          <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="flex flex-col justify-between gap-2 border-b border-[var(--color-border)] px-5 py-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold">All rankings</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {entries.length} {entries.length === 1 ? "participant" : "participants"}
                </p>
              </div>
              <span className="w-fit rounded-full bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400">
                Live standings
              </span>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {entries
                .slice()
                .sort((a, b) => Number(a.rank) - Number(b.rank))
                .map((entry) => {
                  const medal = getMedal(entry.rank)

                  return (
                    <article
                      key={entry.username}
                      className="flex flex-col gap-4 px-5 py-4 transition hover:bg-[var(--color-bg-tertiary)] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black ${
                            medal
                              ? "bg-violet-500/10 text-xl"
                              : "bg-[var(--color-bg-tertiary)] text-sm text-violet-400"
                          }`}
                        >
                          {medal || `#${entry.rank}`}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold">
                            {entry.username}
                          </h3>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            Rank #{entry.rank}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 pl-14 text-sm sm:pl-0">
                        <div>
                          <p className="font-bold">
                            {entry.problemsSolved ?? 0}
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            Solved
                          </p>
                        </div>

                        <div className="h-8 w-px bg-[var(--color-border)]" />

                        <div>
                          <p className="font-bold">
                            {entry.forgeStreakCurrent ?? 0} 🔥
                          </p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            Streak
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default Leaderboard
