import { Link } from "react-router-dom"

const SUGGESTIONS = [
  ["Dashboard", "/dashboard"],
  ["Courses", "/courses"],
  ["Practice problems", "/problems"],
  ["Leaderboard", "/leaderboard"],
]

function NotFound() {
  return (
    <main className="cv-premium-page cv-auth-page relative overflow-hidden">
      <div className="cv-hero-orb cv-orb-purple" aria-hidden="true" />
      <div className="cv-hero-orb cv-orb-cyan" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 font-black text-white shadow-lg">
          {"</>"}
        </span>

        <p className="cv-kicker mt-8">SRH CODEVERSE</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">
          4<span className="cv-gradient-text">0</span>4
        </h1>
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          We couldn&apos;t find that page
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--cv-muted)]">
          The link may be outdated, or the page may have moved. Try one of the destinations below,
          or head back to the CodeVerse home page.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="cv-primary-btn !px-5 !py-2.5 text-sm">
            Return to home
          </Link>
          <Link to="/login" className="cv-secondary-btn !px-5 !py-2.5 text-sm">
            Go to login
          </Link>
        </div>

        <nav aria-label="Suggested pages" className="mt-10 w-full">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--cv-subtle)]">
            Popular destinations
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {SUGGESTIONS.map(([label, to]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center justify-between rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--cv-surface-2)]"
                >
                  {label}
                  <span aria-hidden="true" className="text-violet-500">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  )
}

export default NotFound
