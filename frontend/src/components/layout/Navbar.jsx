
import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"

const Icon = ({ children }) => (
  <span aria-hidden="true" className="text-base leading-none">
    {children}
  </span>
)

function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [query, setQuery] = useState("")

  const menuRef = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate("/login")
  }

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path))

  const links = [
    ["Home", "/"],
    ["Courses", "/courses"],
    ["Practice", "/problems"],
    ["Live Arena", "/live-coding"],
    ["Interview Arena", "/interview-arena"],
    ["Learning Path", "/learning-path"],
    ["Analytics", "/analytics"],
    ["Roadmap", "/roadmap"],
    ["Certificates", "/certificates"],
    ["Leaderboard", "/leaderboard"],
  ]

  return (
    <nav className="cv-navbar sticky top-0 z-50 border-b">
      <div className="max-w-[1600px] mx-auto h-[72px] px-4 sm:px-6 flex items-center gap-4">

        {/* Brand */}
       

<Link to="/" className="shrink-0 flex items-center gap-2.5 group">
  <img
    src="/srh-codeverse-logo.png"
    alt="SRH CodeVerse"
    className="w-11 h-11 object-contain shrink-0 rounded-xl border border-violet-400/30 bg-slate-950/80 p-1 shadow-md shadow-violet-500/10 ring-1 ring-white/5 transition-all duration-300 group-hover:border-cyan-400/60 group-hover:shadow-lg group-hover:shadow-violet-500/20 group-hover:scale-105"
  />
  {/* <span className="leading-none">
    <strong className="block text-[17px] font-black">SRH</strong>
    <strong className="block text-[17px] font-black cv-brand-gradient">
      CodeVerse
    </strong>
  </span> */}
</Link>


        {/* Desktop navigation: single-line labels */}
        <div className="hidden xl:flex items-center gap-3 ml-2 flex-1 min-w-0 whitespace-nowrap">
          {links.map(([label, path]) => (
            <Link
              key={label}
              to={path}
              className={`cv-nav-link text-xs whitespace-nowrap shrink-0 ${
                isActive(path) ? "active" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2 ml-auto shrink-0">
          <div className="relative hidden 2xl:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cv-subtle)]">
              ⌕
            </span>

            <input
              aria-label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                navigate(`/problems?search=${encodeURIComponent(query)}`)
              }
              placeholder="Search courses, problems..."
              className="w-[220px] cv-input !rounded-full !py-2.5 !pl-9 !pr-4 text-xs"
            />
          </div>

          <button
            className="cv-icon-btn"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={toggleTheme}
          >
            <Icon>{theme === "dark" ? "☀" : "☾"}</Icon>
          </button>

          <button className="cv-icon-btn" title="Notifications">
            <Icon>♢</Icon>
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] hover:border-violet-400/50 transition"
              >
                <span className="w-8 h-8 rounded-full grid place-items-center bg-gradient-to-br from-violet-600 to-cyan-400 text-white text-xs font-black">
                  {user.username?.slice(0, 1)?.toUpperCase() || "S"}
                </span>

                <span className="max-w-20 truncate text-xs font-bold">
                  {user.username}
                </span>

                <span className="text-[10px]">⌄</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-2 shadow-2xl z-30">
                  <Link
                    to={user.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard"}
                    className="block px-3 py-2 rounded-xl text-sm hover:bg-[var(--cv-surface-2)]"
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-xl text-sm hover:bg-[var(--cv-surface-2)]"
                  >
                    Profile
                  </Link>

                  <Link
                    to="/analytics"
                    className="block px-3 py-2 rounded-xl text-sm hover:bg-[var(--cv-surface-2)]"
                  >
                    Developer Analytics
                  </Link>

                  <Link
                    to="/settings"
                    className="block px-3 py-2 rounded-xl text-sm hover:bg-[var(--cv-surface-2)]"
                  >
                    Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="cv-secondary-btn !px-4 !py-2.5 !rounded-full text-xs"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="cv-primary-btn !px-5 !py-2.5 !rounded-full text-xs"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex lg:hidden items-center gap-2 ml-auto">
          <button
            className="cv-icon-btn"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <button
            className="cv-icon-btn"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileNavOpen && (
        <div className="xl:hidden border-t border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-4 shadow-xl">
          <div className="grid sm:grid-cols-2 gap-1">
            {links.map(([label, path]) => (
              <Link
                key={label}
                to={path}
                className={`px-3 py-2.5 rounded-xl text-sm ${
                  isActive(path)
                    ? "bg-violet-500/10 text-violet-600"
                    : "text-[var(--cv-muted)] hover:bg-[var(--cv-surface-2)]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--cv-border)] flex gap-2">
            {user ? (
              <>
                <Link
                  to={user.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard"}
                  className="cv-secondary-btn flex-1 !py-2.5"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="cv-secondary-btn !text-red-500 !py-2.5"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="cv-secondary-btn flex-1 !py-2.5"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="cv-primary-btn flex-1 !py-2.5"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
