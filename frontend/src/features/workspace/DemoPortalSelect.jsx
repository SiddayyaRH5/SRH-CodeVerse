import { Link, useNavigate } from "react-router-dom"
import { PORTALS } from "./demoData"
import { isPortalEntitled } from "./workspacePolicy"
import { useAuth } from "../../context/AuthContext"

// Internal portal keys (employee is the internal key for the Professional portal).
const PORTAL_ORDER = ["student", "employee", "trainer", "organization", "superadmin"]

// Map the internal portal key to the approved display name.
const PORTAL_DISPLAY = {
  student: "Student",
  employee: "Professional",
  trainer: "Trainer",
  organization: "Organization Admin",
  superadmin: "Super Admin",
}

function DemoPortalSelect() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const enterDemo = (portal) => {
    // Mark this browser session as a demo session. This is a UI-only flag:
    // it never creates an account, never touches JWT storage, and never grants
    // backend authorization. The demo workspace uses in-memory sample data.
    try {
      window.sessionStorage.setItem("srhcodeverse_demo_mode", "true")
    } catch {
      // Storage can be unavailable; the demo still works for this navigation.
    }
    navigate(`/demo/${portal}/dashboard`)
  }

  return (
    <main className="cv-auth-page relative overflow-hidden">
      <div className="cv-hero-orb cv-orb-purple" aria-hidden="true" />
      <div className="cv-hero-orb cv-orb-cyan" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 font-black text-white shadow-lg">
              {"</>"}
            </span>
            <span className="leading-none">
              <b className="block">SRH</b>
              <b className="cv-brand-gradient block">CodeVerse</b>
            </span>
          </Link>

          <Link to="/login" className="cv-secondary-btn !px-4 !py-2.5 text-sm">
            Sign in
          </Link>
        </div>

        <div className="text-center">
          <p className="cv-kicker">DEMO MODE</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            Explore the <span className="cv-gradient-text">portals.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl leading-6 text-[var(--cv-muted)]">
            No registration required. Every portal runs on sample data that stays in this browser
            session. Nothing is saved to the backend and no account is created.
          </p>
        </div>

        <div
          role="note"
          className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300"
        >
          <p className="font-semibold">Demo mode uses sample data only.</p>
          <p className="mt-1 leading-6">
            Switching portals, editing records and approving items only affect this browser session.
            They do not change any real account, organization or tenant data, and they grant no backend
            permission. Sign in with a real account for the production experience.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PORTAL_ORDER.map((key) => {
            const info = PORTALS[key]
            const entitled = isPortalEntitled(key, user?.role)
            return (
              <button
                key={key}
                type="button"
                onClick={() => enterDemo(key)}
                className="cv-secondary-btn flex w-full flex-col items-start gap-3 !px-5 !py-5 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 font-black text-white shadow-lg">
                  {PORTAL_DISPLAY[key].charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{PORTAL_DISPLAY[key]} portal</span>
                  <span className="mt-1 block text-xs text-[var(--cv-muted)]">{info.description}</span>
                  {!entitled && (
                    <span className="mt-2 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Demo preview
                    </span>
                  )}
                </span>
                <span className="self-end text-[var(--cv-primary)]">Enter demo →</span>
              </button>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--cv-muted)]">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[var(--cv-primary)] transition hover:text-cyan-400">
            Sign in
          </Link>{" "}
          or{" "}
          <Link to="/register" className="font-bold text-[var(--cv-primary)] transition hover:text-cyan-400">
            create one
          </Link>
          .
        </p>
      </div>
    </main>
  )
}

export default DemoPortalSelect
