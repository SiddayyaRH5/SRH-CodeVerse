import { Link, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { PORTALS } from "./demoData"
import { isKnownPortal, isPortalEntitled, portalForRole, resolvePortal } from "./workspacePolicy"
import { useWorkspace } from "./useWorkspace"

function WorkspaceShell({ children }) {
  return (
    <div className="min-h-screen bg-[var(--cv-bg)] text-[var(--cv-text)]">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

function WorkspacePortalNotFound({ homePortal, homeLabel }) {
  return (
    <WorkspaceShell>
      <p className="cv-kicker">Workspace</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Workspace portal not found</h1>
      <p className="mt-3 text-sm text-[var(--cv-muted)]">
        The requested workspace portal does not exist. SRH CodeVerse ships five demo portals: student,
        trainer, employee, organization and super admin.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/workspace/${homePortal}/dashboard`} className="cv-primary-btn !px-4 !py-2.5 text-sm">
          Open the {homeLabel} workspace
        </Link>
        <Link to="/" className="cv-secondary-btn !px-4 !py-2.5 text-sm">
          Return to CodeVerse
        </Link>
      </div>
    </WorkspaceShell>
  )
}

function WorkspacePortalRestricted({ portal, role, onEnablePreview }) {
  const portalInfo = PORTALS[portal]
  const requiredRole = portalInfo?.role ?? "the matching portal role"
  const homePortal = portalForRole(role)
  const homeLabel = PORTALS[homePortal].label

  return (
    <WorkspaceShell>
      <p className="cv-kicker">Workspace access</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{portalInfo.label} portal is restricted</h1>
      <p className="mt-3 text-sm text-[var(--cv-muted)]">
        Your SRH CodeVerse account is signed in as <strong>{role ?? "an unknown role"}</strong>. The{" "}
        {portalInfo.label.toLowerCase()} portal is reserved for <strong>{requiredRole}</strong> accounts.
      </p>
      <p className="mt-3 text-sm text-[var(--cv-muted)]">
        The workspace is a front-end demo. It renders sample records from memory and never calls the
        SRH CodeVerse API, so previewing it grants no backend access and no tenant data.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onEnablePreview}
          className="cv-primary-btn !px-4 !py-2.5 text-sm"
        >
          Preview this portal with sample data
        </button>
        <Link to={`/workspace/${homePortal}/dashboard`} className="cv-secondary-btn !px-4 !py-2.5 text-sm">
          Open my {homeLabel.toLowerCase()} workspace
        </Link>
        <Link to="/" className="cv-secondary-btn !px-4 !py-2.5 text-sm">
          Return to CodeVerse
        </Link>
      </div>
    </WorkspaceShell>
  )
}

/**
 * Guards the /workspace/:portal/* route family.
 *
 * Authentication is handled by the surrounding ProtectedRoute, which uses the
 * production JWT/session stored by AuthContext. This component only decides
 * which portal a signed-in account may browse:
 *
 *  - The account's own production role opens its portal directly.
 *  - Any other portal needs an explicit, session-scoped "demo preview", which is
 *    clearly labelled in the workspace shell and never changes the account.
 *
 * Front-end route guards are a navigation convenience only. They are not a
 * substitute for backend authorization or tenant isolation.
 */
export default function WorkspaceAccess({ children }) {
  const { portal: rawPortal } = useParams()
  const portal = resolvePortal(rawPortal)
  const { user } = useAuth()
  const { demoPreviewEnabled, enableDemoPreview } = useWorkspace()

  if (!isKnownPortal(portal)) {
    const homePortal = portalForRole(user?.role)
    return <WorkspacePortalNotFound homePortal={homePortal} homeLabel={PORTALS[homePortal].label} />
  }

  if (isPortalEntitled(portal, user?.role)) return children
  if (demoPreviewEnabled) return children

  return (
    <WorkspacePortalRestricted
      portal={portal}
      role={user?.role}
      onEnablePreview={enableDemoPreview}
    />
  )
}
