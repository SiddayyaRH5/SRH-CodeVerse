import { useState, useEffect, useRef } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import Footer from "./Footer"
import Navbar from "./Navbar"

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "Learning",
    items: [
      { label: "Courses", path: "/courses", icon: "courses" },
      { label: "Learning Path", path: "/learning-path", icon: "learning-path" },
      { label: "Certificates", path: "/certificates", icon: "certificates" },
      { label: "Achievements", path: "/achievements", icon: "achievements" },
      { label: "Study Hub", path: "/study-hub", icon: "study-hub" },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Problems", path: "/problems", icon: "problems" },
      { label: "My Submissions", path: "/my-submissions", icon: "submissions" },
      { label: "Playground", path: "/playground", icon: "playground" },
      { label: "Live Coding", path: "/live-coding", icon: "live-coding" },
      { label: "Mock Interview", path: "/mock-interview", icon: "mock-interview" },
      { label: "Interview Arena", path: "/interview-arena", icon: "interview-arena" },
    ],
  },
  {
    label: "Career",
    items: [
      { label: "Roadmap", path: "/roadmap", icon: "roadmap" },
      { label: "Analytics", path: "/analytics", icon: "analytics" },
      { label: "Leaderboard", path: "/leaderboard", icon: "leaderboard" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", path: "/profile", icon: "profile" },
      { label: "Settings", path: "/settings", icon: "settings" },
      { label: "Announcements", path: "/announcements", icon: "announcements" },
      { label: "Calendar", path: "/calendar", icon: "calendar" },
      { label: "Notifications", path: "/notifications", icon: "notifications" },
    ],
  },
]

const NAV_ICONS = {
  dashboard: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  courses: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6l4 4v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M22 3h-6l-4 4v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" />
    </svg>
  ),
  "learning-path": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  certificates: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2z" /><polyline points="7 11 12 16 17 11" />
    </svg>
  ),
  achievements: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  "study-hub": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3-2 3z" />
    </svg>
  ),
  problems: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  submissions: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-10a2 2 0 0 0-2-2h-3" /><polyline points="9 12 12 15 15 12" />
    </svg>
  ),
  playground: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  "live-coding": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  "mock-interview": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><path d="M16 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2" />
    </svg>
  ),
  "interview-arena": (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  roadmap: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 4-4 6-6 2v2c0 4-4 6-6 2H4c0-4 4-6 6-2V4c0-4 4-6 6-2z" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="4" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="4" />
    </svg>
  ),
  leaderboard: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="10" x2="8" y2="18" /><line x1="12" y1="6" x2="12" y2="18" /><line x1="16" y1="14" x2="16" y2="18" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0z" /><path d="M12 17v-8M12 3v8" />
    </svg>
  ),
  announcements: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 10c0-5-3-10-9-10s-9 5-9 10v11l9-3 9 3z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  notifications: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
}

const HAMBURGER_ICON = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const CLOSE_ICON = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SUN_ICON = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MOON_ICON = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79" />
  </svg>
)

function isStudentRoute(pathname) {
  if (pathname.startsWith("/trainer")) return false
  if (pathname.startsWith("/workspace")) return false
  if (pathname.startsWith("/demo")) return false
  const publicRoutes = ["/", "/login", "/register", "/oauth/callback", "/forgot-password", "/courses"]
  if (publicRoutes.includes(pathname)) return false
  if (pathname.startsWith("/courses/")) {
    const parts = pathname.split("/")
    if (parts.length === 5 && parts[1] === "courses" && parts[3] === "lessons") {
      return true
    }
    return false
  }
  return true
}

function StudentLayout({ children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const drawerRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  // Keyboard handling: Escape closes drawer, Tab/Shift+Tab trapped inside drawer
  useEffect(() => {
    if (!mobileOpen) return undefined

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false)
        toggleRef.current?.focus()
        return
      }

      if (e.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (e.target === first || e.target === toggleRef.current) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (e.target === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKey)

    // Move focus into drawer on open
    const timer = setTimeout(() => {
      const firstLink = drawerRef.current?.querySelector("a[href]")
      firstLink?.focus()
    }, 0)

    return () => {
      document.removeEventListener("keydown", handleKey)
      clearTimeout(timer)
    }
  }, [mobileOpen])

  // Prevent body scroll while drawer is open; restore on close/unmount
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate("/login")
  }

  const sidebarContent = (
    <nav aria-label="Student portal navigation" className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--cv-border)] px-5 py-5">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Return to SRH CodeVerse home">
          <img src="/srh-codeverse-logo.png" alt="" className="h-9 w-9 rounded-xl border border-violet-400/30 bg-slate-950/80 p-1 object-contain" />
          <span className="leading-none">
            <b className="block text-sm font-black">SRH</b>
            <b className="cv-brand-gradient block text-sm font-black">CodeVerse</b>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="cv-kicker mb-2 px-2">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? `text-[var(--cv-primary)] font-semibold bg-[color-mix(in_srgb,var(--cv-primary)_12%,transparent)] border-l-2 border-[var(--cv-primary)]`
                          : "text-[var(--cv-muted)] hover:bg-[var(--cv-surface-2)] hover:text-[var(--cv-text)]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="w-5 h-5 flex-shrink-0">{NAV_ICONS[item.icon]}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--cv-border)] px-4 py-4">
        <Link
          to="/workspace/select"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--cv-muted)] hover:bg-[var(--cv-surface-2)] hover:text-[var(--cv-text)]"
        >
          <span aria-hidden="true" className="w-5 h-5 flex-shrink-0">{NAV_ICONS.notifications}</span> Workspaces
        </Link>
      </div>
    </nav>
  )

  return (
    <div className="cv-app-shell flex min-h-screen text-[var(--cv-text)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 lg:border-r lg:border-[var(--cv-border)] lg:bg-[var(--cv-surface)]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer - always in DOM, shown/hidden via transform */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 lg:hidden ${mobileOpen ? "" : "hidden"}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="student-sidebar-drawer"
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 z-50 w-[min(84vw,280px)] bg-[var(--cv-surface)] border-r border-[var(--cv-border)] lg:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Student portal navigation"
      >
        {sidebarContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--cv-border)] bg-[var(--cv-glass)] px-4 backdrop-blur-xl sm:px-6">
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="student-sidebar-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="cv-icon-btn lg:hidden"
          >
            <span className="sr-only">{mobileOpen ? "Close navigation menu" : "Open navigation menu"}</span>
            {mobileOpen ? CLOSE_ICON : HAMBURGER_ICON}
          </button>

          <div className="min-w-0 flex-1">
            <p className="cv-kicker">Student Portal</p>
            <p className="truncate text-sm font-semibold text-[var(--cv-text)]">
              {user?.username ? `Welcome, ${user.username}` : "Welcome"}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="cv-icon-btn"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? SUN_ICON : MOON_ICON}
          </button>

          <Link
            to="/notifications"
            className="cv-icon-btn relative"
            aria-label="Notifications"
            title="Notifications"
          >
            {NAV_ICONS.notifications}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface-2)] text-sm font-bold text-[var(--cv-text)]"
              aria-label="Account menu"
            >
              {user?.username?.slice(0, 1)?.toUpperCase() || "S"}
            </button>
            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-2 shadow-xl"
              >
                <Link role="menuitem" to="/profile" onClick={() => setUserMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--cv-surface-2)]">Profile</Link>
                <Link role="menuitem" to="/settings" onClick={() => setUserMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--cv-surface-2)]">Settings</Link>
                <Link role="menuitem" to="/my-submissions" onClick={() => setUserMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--cv-surface-2)]">My Submissions</Link>
                <button role="menuitem" onClick={handleLogout} className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10">Logout</button>
              </div>
            )}
          </div>
        </header>

        <a href="#main-content" className="cv-skip-link">Skip to main content</a>

        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>

        <footer className="border-t border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-4 text-center text-xs text-[var(--cv-muted)] sm:px-6">
          © {new Date().getFullYear()} SRH CodeVerse. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

function PageLayout({ children }) {
  const { pathname } = useLocation()
  const { user } = useAuth()

  if (pathname.startsWith("/workspace") || pathname.startsWith("/demo")) {
    return (
      <div className="cv-app-shell text-[var(--cv-text)]">
        <a href="#main-content" className="cv-skip-link">
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    )
  }

  if (isStudentRoute(pathname) && user?.role === "STUDENT") {
    return <StudentLayout>{children}</StudentLayout>
  }

  return (
    <div className="cv-app-shell text-[var(--cv-text)]">
      <a href="#main-content" className="cv-skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="cv-main">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default PageLayout