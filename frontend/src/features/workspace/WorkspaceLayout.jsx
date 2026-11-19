import { useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { PORTALS, PORTAL_NAVIGATION } from "./demoData"
import { useWorkspace } from "./useWorkspace"
import { isPortalEntitled } from "./workspacePolicy"
import { useTheme } from "../../context/ThemeContext"
import { useAuth } from "../../context/AuthContext"

function WorkspaceLayout({ portal, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const {
    activeOrganization,
    activeOrganizationId,
    availableOrganizations,
    data,
    demoPreviewEnabled,
    demoUser,
    disableDemoPreview,
    selectPortal,
    setActiveOrganizationId,
    setStudentMode,
    studentMode,
  } = useWorkspace()

  // Demo mode is a no-login preview reached via /demo/*. It uses the same
  // workspace shell and sample data, but the base path changes so portal
  // switching and sidebar links stay inside the demo tree.
  const isDemoMode = pathname.startsWith("/demo")
  const basePath = isDemoMode ? "/demo" : "/workspace"

  const portalInfo = PORTALS[portal]
  const navigation = PORTAL_NAVIGATION[portal]
  const pagePath = pathname.split(`${basePath}/${portal}/`)[1] || "dashboard"
  const pageTitle =
    navigation.find(([, route]) => pagePath === route || pagePath.startsWith(`${route}/`))?.[0] ??
    portalInfo.label
  const isPlatformAdmin = portal === "superadmin"
  const isEntitledPortal = isPortalEntitled(portal, user?.role)
  const isDemoPreview = demoPreviewEnabled && !isEntitledPortal
  const currentScreen = pagePath.split("/")[0] || "dashboard"
  const currentRouteLabel = navigation.find(([, route]) => route === currentScreen)?.[0] ?? pageTitle
  const [notificationCount, notificationRoute, notificationLabel] = {
    student: [data.notifications.filter((item) => item.status === "UNREAD").length, "notifications", "notifications"],
    trainer: [data.submissions.filter((item) => item.status !== "GRADED").length, "notifications", "notifications"],
    employee: [data.notifications.filter((item) => item.status === "UNREAD").length, "notifications", "notifications"],
    organization: [data.notifications.filter((item) => item.status === "UNREAD").length, "notifications", "notifications"],
    superadmin: [data.applications.filter((item) => item.status === "PENDING").length, "applications", "pending applications"],
  }[portal]

  function changePortal(event) {
    const nextPortal = event.target.value
    selectPortal(nextPortal)
    navigate(`${basePath}/${nextPortal}/${PORTALS[nextPortal].dashboardPath}`)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[var(--cv-bg)] text-[var(--cv-text)]">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(84vw,280px)] flex-col border-r border-[var(--cv-border)] bg-[var(--cv-bg)] transition-transform md:w-64 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isPlatformAdmin ? "border-t-4 border-t-rose-500" : ""}`}
      >
        <div className="border-b border-[var(--cv-border)] px-5 py-5">
          <Link to="/" className="flex items-center gap-3" aria-label="Return to SRH CodeVerse home">
            <img src="/srh-codeverse-logo.png" alt="" className="h-10 w-10 rounded-xl border border-violet-400/30 bg-slate-950/80 p-1 object-contain" />
            <span className="font-black tracking-tight cv-brand-gradient">SRH CodeVerse</span>
          </Link>
          <p className="cv-kicker mt-3">
            {isPlatformAdmin ? "Platform control center" : `${portalInfo.label} workspace`}
          </p>
        </div>
        <nav aria-label={`${portalInfo.label} navigation`} className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map(([label, route]) => (
            <NavLink
              key={route}
              to={`${basePath}/${portal}/${route}`}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `cv-nav-link flex min-h-10 items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive
                  ? "active bg-[var(--cv-surface-2)] font-semibold text-[var(--cv-primary)]"
                    : "text-[var(--cv-muted)] hover:bg-[var(--cv-surface-2)] hover:text-[var(--cv-text)]"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {!isDemoMode && portal === "student" && (
          <div className="border-t border-[var(--cv-border)] px-3 py-4">
            <p className="cv-kicker mb-2">LEARNING TOOLS</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ["Playground", "/playground"],
                ["Mock interview", "/mock-interview"],
                ["Live coding", "/live-coding"],
                ["Study Hub", "/study-hub"],
                ["Roadmap", "/roadmap"],
                ["Analytics", "/analytics"],
                ["Leaderboard", "/leaderboard"],
                ["Achievements", "/achievements"],
              ].map(([label, href]) => (
                <Link key={href} to={href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg border border-[var(--cv-border)] px-2 py-2 text-xs text-[var(--cv-muted)] transition-colors hover:bg-[var(--cv-surface-2)] hover:text-[var(--cv-text)]">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="border-t border-[var(--cv-border)] p-4">
          <div className="mb-3 text-xs text-[var(--cv-muted)]">
            Demo identity: <span className="font-semibold text-[var(--cv-text)]">{demoUser.displayName}</span>
          </div>
          <Link to="/" className="text-sm font-medium text-[var(--cv-primary)] hover:underline">
            Return to CodeVerse
          </Link>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="cv-navbar sticky top-0 z-20 border-b">
          <div className="flex min-h-16 w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
              className="cv-secondary-btn !px-3 !py-2 text-sm md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              Menu
            </button>
            <div className="mr-auto min-w-0 flex-1 sm:min-w-36">
              <p className="cv-kicker">{portalInfo.description}</p>
              <nav aria-label="Breadcrumb" className="mt-1 flex items-center gap-2 text-sm">
                <Link to={`${basePath}/${portal}/dashboard`} className="text-[var(--cv-muted)] hover:text-[var(--cv-text)]">{portalInfo.label}</Link>
                <span aria-hidden="true" className="text-[var(--cv-subtle)]">/</span>
                <span className="font-bold">{currentRouteLabel}</span>
              </nav>
            </div>
            <label className="sr-only" htmlFor="demo-portal">Preview demo portal</label>
            <select
              id="demo-portal"
              value={portal}
              onChange={changePortal}
              title="Demo preview control. Switching portals never changes your account role or any backend permission."
              className="cv-input !w-auto min-w-0 max-w-44 !py-2 text-sm"
            >
              {Object.entries(PORTALS).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label} portal{isPortalEntitled(key, user?.role) ? "" : " (preview)"}
                </option>
              ))}
            </select>
            <Link to={`${basePath}/${portal}/${notificationRoute}`} aria-label={`${notificationCount} ${notificationLabel}`} className="cv-secondary-btn relative !px-3 !py-2 text-sm">
              Notifications
              <span className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-[var(--cv-primary)] px-1.5 py-0.5 text-xs font-bold text-white">{notificationCount}</span>
            </Link>
            {portal === "student" && (
              <>
                <label className="sr-only" htmlFor="student-mode">Student membership mode</label>
                <select
                  id="student-mode"
                  value={studentMode}
                  onChange={(event) => setStudentMode(event.target.value)}
                  className="cv-input !w-auto min-w-0 max-w-40 !py-2 text-sm"
                >
                  <option value="organization">Organization-linked</option>
                  <option value="independent">Independent student</option>
                </select>
              </>
            )}
            {(portal !== "student" || studentMode !== "independent") && availableOrganizations.length > 0 && (
              <>
                <label className="sr-only" htmlFor="active-organization">Switch organization</label>
                <select
                  id="active-organization"
                  value={activeOrganizationId}
                  onChange={(event) => setActiveOrganizationId(event.target.value)}
                  className="cv-input !w-auto min-w-0 max-w-48 !py-2 text-sm"
                >
                  {availableOrganizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </select>
              </>
            )}
            {activeOrganization && (portal !== "student" || studentMode !== "independent") && (
              <span className="hidden max-w-32 truncate text-xs text-[var(--cv-muted)] lg:inline">
                {activeOrganization.status}
              </span>
            )}
            <button type="button" onClick={toggleTheme} className="cv-secondary-btn !px-3 !py-2 text-sm" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
              {theme === "dark" ? "Light" : "Dark"} theme
            </button>
            <div className="relative">
              <button type="button" aria-expanded={profileMenuOpen} aria-haspopup="menu" onClick={() => setProfileMenuOpen((open) => !open)} className="cv-secondary-btn !px-3 !py-2 text-sm">
                {demoUser.displayName}
              </button>
              {profileMenuOpen && (
                <div role="menu" className="absolute right-0 top-full z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-2 shadow-xl">
                  <Link role="menuitem" to={`${basePath}/${portal}/profile`} onClick={() => setProfileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--cv-surface-2)]">My profile</Link>
                  <Link role="menuitem" to={`${basePath}/${portal}/settings`} onClick={() => setProfileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--cv-surface-2)]">Settings</Link>
                  <Link role="menuitem" to="/" onClick={() => setProfileMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--cv-surface-2)]">Exit demo workspace</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {isDemoPreview && (
            <div className="cv-panel mb-6 flex flex-wrap items-start gap-3 !border-amber-500/40 !bg-amber-500/10 !p-4 text-sm">
              <span aria-hidden="true" className="cv-kicker">DEMO PREVIEW</span>
              <p className="flex-1 text-[var(--cv-muted)]">
                You are previewing the {portalInfo.label.toLowerCase()} portal as{" "}
                <strong>{user?.role ?? "an unknown role"}</strong>. Sample records only — the
                workspace never calls the SRH CodeVerse API and grants no backend permission.
              </p>
              <button type="button" onClick={disableDemoPreview} className="cv-secondary-btn !px-3 !py-2 text-sm">
                Stop preview
              </button>
            </div>
          )}
          {isDemoMode && (
            <div className="cv-panel mb-6 flex flex-wrap items-start gap-3 !border-amber-500/40 !bg-amber-500/10 !p-4 text-sm">
              <span aria-hidden="true" className="cv-kicker text-amber-400">DEMO MODE</span>
              <p className="flex-1 text-[var(--cv-muted)]">
                You are browsing a no-login demo. All data is sample content held in this browser session
                only — nothing is saved to the backend and no account is created.{" "}
                <Link to="/login" className="font-bold text-[var(--cv-primary)] transition hover:text-cyan-400">
                  Sign in
                </Link>{" "}
                for the full experience.
              </p>
            </div>
          )}
          <div className="cv-panel mb-6 flex items-start gap-3 !border-violet-500/20 !bg-[var(--cv-surface-2)] !p-4 text-sm">
            <span aria-hidden="true" className="cv-kicker">DEMO</span>
            <p className="text-[var(--cv-muted)]">Changes are held in memory for this browser session only. Nothing is saved to the backend.</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

export default WorkspaceLayout
