import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { PORTALS } from "./demoData"
import { isPortalEntitled } from "./workspacePolicy"
import { useWorkspace } from "./useWorkspace"

function WorkspaceSelect() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { demoPreviewEnabled } = useWorkspace()

  const role = user?.role

  const workspaces = Object.entries(PORTALS).map(([key, info]) => {
    const entitled = isPortalEntitled(key, role)
    const preview = !entitled && demoPreviewEnabled
    return {
      key,
      info,
      entitled,
      preview,
      available: entitled || preview,
    }
  })

  const available = workspaces.filter((w) => w.available)

  return (
    <main className="cv-auth-page relative overflow-hidden">
      <div className="cv-hero-orb cv-orb-purple" aria-hidden="true" />
      <div className="cv-hero-orb cv-orb-cyan" aria-hidden="true" />

      <div className="cv-auth-shell relative z-10">
        <section className="cv-auth-form-side min-w-0">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 sm:mb-12">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 font-black text-white shadow-lg">
                {"</>"}
              </span>
              <span className="leading-none">
                <b className="block">SRH</b>
                <b className="cv-brand-gradient block">CodeVerse</b>
              </span>
            </Link>
          </div>

          <div className="mx-auto w-full max-w-2xl min-w-0">
            <p className="cv-kicker">WORKSPACE SELECTION</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Choose your <span className="cv-gradient-text">workspace.</span>
            </h1>
            <p className="mt-3 leading-6 text-[var(--cv-muted)]">
              You are signed in as <strong>{user?.username ?? "—"}</strong> ({role ?? "—"}). Select a
              workspace to continue. Only workspaces you can access are shown.
            </p>

            <div className="mt-7 grid gap-3">
              {available.length === 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  No workspace is available for your account. Please contact support.
                </div>
              )}
              {available.map((workspace) => (
                <button
                  key={workspace.key}
                  type="button"
                  onClick={() => navigate(`/workspace/${workspace.key}/dashboard`)}
                  className="cv-secondary-btn flex w-full items-start gap-3 !px-4 !py-4 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-400 font-black text-white">
                    {workspace.info.label.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block font-bold">{workspace.info.label} workspace</span>
                      {workspace.preview && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          Demo preview
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--cv-muted)]">
                      {workspace.info.description}
                    </span>
                    <span className="mt-1 block text-[10px] text-[var(--cv-muted)]">
                      Role: {workspace.info.role} · {workspace.entitled ? "Your account" : "Preview only"}
                    </span>
                  </span>
                  <span className="shrink-0 text-violet-500">→</span>
                </button>
              ))}
            </div>

            {available.length > 1 && (
              <p className="mt-4 text-xs text-[var(--cv-muted)]">
                Tip: the portal selector inside a workspace lets you switch portals. Demo previews use
                sample data only and never call the SRH CodeVerse API.
              </p>
            )}

            <p className="mt-5 text-center text-xs text-[var(--cv-muted)]">
              <Link to="/" className="font-bold text-violet-500 transition hover:text-cyan-400">
                ← Return to CodeVerse
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default WorkspaceSelect