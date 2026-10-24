import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginUser } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

function Login() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await loginUser(form)
      login(response.data)

      navigate(
        response.data.role === "TRAINER"
          ? "/trainer/dashboard"
          : "/dashboard"
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="cv-auth-page relative overflow-hidden">
      <div className="cv-hero-orb cv-orb-purple" aria-hidden="true" />
      <div className="cv-hero-orb cv-orb-cyan" aria-hidden="true" />

      <div className="cv-auth-shell relative z-10">
        {/* Login form panel */}
        <section className="cv-auth-form-side min-w-0">
          {/* Brand header */}
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

            <span className="text-sm text-[var(--cv-muted)]">
              New here?{" "}
              <Link
                to="/register"
                className="font-bold text-violet-500 transition hover:text-cyan-400"
              >
                Sign Up
              </Link>
            </span>
          </div>

          <div className="mx-auto w-full max-w-md min-w-0">
            <p className="cv-kicker">WELCOME BACK</p>

            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Welcome <span className="cv-gradient-text">Back!</span>
            </h1>

            <p className="mt-3 leading-6 text-[var(--cv-muted)]">
              Login to continue your coding journey with SRH CodeVerse.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="login-username"
                  className="mb-2 block text-sm font-medium text-[var(--cv-muted)]"
                >
                  Username
                </label>

                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 select-none text-base font-semibold text-[var(--cv-muted)]"
                  >
                    @
                  </span>

                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={loading}
                    className="cv-input block w-full min-w-0 !py-4 !pl-12 !pr-4"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium text-[var(--cv-muted)]"
                >
                  Password
                </label>

                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 select-none text-base text-[var(--cv-muted)]"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>

                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="cv-input block w-full min-w-0 !py-4 !pl-12 !pr-14"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--cv-muted)] transition hover:bg-violet-500/10 hover:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  >
                    {showPassword ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a16 16 0 0 1-3.1 3.9" />
                        <path d="M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10 10 0 0 0 4-.8" />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me and forgot password */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-[var(--cv-muted)]">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="cv-check"
                  />
                  Remember me
                </label>

                <Link
                  to="/forgot-password"
                  className="font-bold text-violet-500 transition hover:text-cyan-400"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="cv-primary-btn flex w-full items-center justify-center gap-2 !py-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                      aria-hidden="true"
                    />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 text-xs text-[var(--cv-muted)]">
              <span className="h-px flex-1 bg-[var(--cv-border)]" />
              OR
              <span className="h-px flex-1 bg-[var(--cv-border)]" />
            </div>

            {/* Provider buttons: visual placeholders until OAuth is connected */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled
                title="Google sign-in is not connected yet"
                className="cv-secondary-btn !py-3 opacity-70"
              >
                <span className="mr-2 font-bold">G</span>
                Continue with Google
              </button>

              <button
                type="button"
                disabled
                title="GitHub sign-in is not connected yet"
                className="cv-secondary-btn !py-3 opacity-70"
              >
                <span className="mr-2 font-bold">●</span>
                Continue with GitHub
              </button>
            </div>

            <p className="mt-7 text-center text-xs text-[var(--cv-muted)]">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-violet-500 transition hover:text-cyan-400"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </section>

        {/* Decorative right panel */}
        <section className="cv-auth-visual relative overflow-hidden">
          <span className="cv-auth-orb one" aria-hidden="true" />
          <span className="cv-auth-orb two" aria-hidden="true" />

          <div className="relative z-10 max-w-sm self-start">
            <p className="text-sm font-bold text-white/75">SRH CODEVERSE</p>

            <h2 className="mt-4 text-5xl font-black leading-[0.94] tracking-tight sm:text-6xl">
              Learn.
              <br />
              Practice.
              <br />
              <span className="text-cyan-200">Build.</span>
              <br />
              <span className="text-violet-100">Grow.</span>
            </h2>

            <p className="mt-5 leading-7 text-white/80">
              Build stronger coding habits, solve practical problems and
              become the developer you want to be.
            </p>
          </div>

          <div className="cv-mini-code relative z-10">
            <div className="mb-4 flex gap-1.5" aria-hidden="true">
              <i className="h-2 w-2 rounded-full bg-red-400" />
              <i className="h-2 w-2 rounded-full bg-amber-300" />
              <i className="h-2 w-2 rounded-full bg-green-400" />
            </div>

            <code className="text-xs leading-6 sm:text-sm">
              <span className="text-violet-300">const</span> developer = {"{"}
              <br />
              <span className="inline-block pl-4">
                learn: <span className="text-cyan-200">true</span>,
              </span>
              <br />
              <span className="inline-block pl-4">
                practice: <span className="text-cyan-200">true</span>,
              </span>
              <br />
              <span className="inline-block pl-4">
                future: <span className="text-pink-200">"yours"</span>
              </span>
              <br />
              {"};"}
            </code>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login