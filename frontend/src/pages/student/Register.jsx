import { useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { OAUTH_INITIATION_URLS, registerUser } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

const ACCOUNT_TYPES = [
  {
    id: "student",
    title: "Student",
    description: "Learn, practice, track progress and earn certificates.",
    real: true,
  },
  {
    id: "professional",
    title: "Professional",
    description: "Company employees, freelancers, independent developers and project teams.",
    real: false,
  },
  {
    id: "trainer",
    title: "Trainer",
    description: "Independent trainers and organization-linked instructors.",
    real: false,
  },
]

function StudentForm() {
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const submittingRef = useRef(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const strength =
    form.password.length >= 10
      ? "Strong"
      : form.password.length >= 6
        ? "Good"
        : form.password.length
          ? "Weak"
          : ""

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setError("")
    setLoading(true)
    try {
      const response = await registerUser(form)
      login(response.data)
      navigate(response.data.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard")
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.code === "ECONNABORTED"
            ? "The server is taking longer than expected. Check your account status before trying signup again."
            : "Registration failed"),
      )
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <>
      <p className="mt-2 text-xs text-[var(--cv-muted)]">
        Student registration is connected to the real backend and always creates a STUDENT account.
      </p>
      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--cv-muted)]" htmlFor="register-username">
            Username
          </label>
          <input
            id="register-username"
            name="username"
            placeholder="Enter your username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="cv-input"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--cv-muted)]" htmlFor="register-email">
            Email address
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="cv-input"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--cv-muted)]" htmlFor="register-password">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="cv-input pr-11"
              minLength={6}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cv-subtle)]"
            >
              {showPassword ? "◉" : "◌"}
            </button>
          </div>
          {strength && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--cv-surface-2)]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all ${
                    strength === "Strong" ? "w-full" : strength === "Good" ? "w-2/3" : "w-1/3"
                  }`}
                />
              </div>
              <span className="text-[10px] text-[var(--cv-muted)]">{strength}</span>
            </div>
          )}
        </div>
        <button
          disabled={loading}
          className="cv-primary-btn w-full !py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create Student Account"} →
        </button>
      </form>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => window.location.assign(OAUTH_INITIATION_URLS.google)}
          title="Google sign-in"
          className="cv-secondary-btn relative min-h-[92px] w-full !px-7 !py-5 text-base"
        >
          <span className="text-center leading-7">
            <span className="block">Continue with</span>
            <span className="block">Google</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => window.location.assign(OAUTH_INITIATION_URLS.github)}
          title="GitHub sign-in"
          className="cv-secondary-btn relative min-h-[92px] w-full !px-7 !py-5 text-base"
        >
          <span className="text-center leading-7">
            <span className="block">Continue with</span>
            <span className="block">GitHub</span>
          </span>
        </button>
      </div>

    </>
  )
}

function PrototypeForm({ title, fields, onBack }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, ""])))
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")
    // Basic required-field validation only. No backend call is made.
    for (const field of fields) {
      if (field.required && !String(values[field.name] || "").trim()) {
        setError(`${field.label} is required.`)
        return
      }
    }
    if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setSubmitted(true)
  }

  return (
    <>
      <PrototypeNotice title={title} />
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="mb-2 block text-sm font-medium text-[var(--cv-muted)]">
              {field.label}
              {field.required ? " *" : ""}
            </label>
            {field.type === "select" ? (
              <select
                value={values[field.name]}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                className="cv-input"
                required={field.required}
              >
                <option value="">Select…</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                placeholder={field.placeholder || field.label}
                value={values[field.name]}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                className="cv-input"
                required={field.required}
                minLength={field.minLength}
              />
            )}
          </div>
        ))}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400"
          >
            {error}
          </div>
        )}
        {submitted && (
          <div
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-300"
          >
            Form validated. No account was created because the backend does not yet support this
            account type. See the API contract document for the required endpoint.
          </div>
        )}
        <button type="submit" className="cv-primary-btn w-full !py-3.5">
          {submitted ? "Validated (prototype)" : `Create ${title} Account`} →
        </button>
      </form>

    </>
  )
}

function Register() {
  return (
    <main className="cv-auth-page relative overflow-hidden">
      <div className="cv-hero-orb cv-orb-purple" aria-hidden="true" />
      <div className="cv-hero-orb cv-orb-cyan" aria-hidden="true" />

      <div className="cv-auth-shell relative z-10">
        <section className="cv-auth-visual relative overflow-hidden">
          <span className="cv-auth-orb one" aria-hidden="true" />
          <span className="cv-auth-orb two" aria-hidden="true" />

          <div className="relative z-10 max-w-sm self-start">
            <p className="text-sm font-bold text-white/75">START YOUR JOURNEY</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.94] tracking-tight sm:text-6xl">
              Learn.
              <br />
              Practice.
              <br />
              <span className="text-cyan-200">Build.</span>
              <br />
              <span className="text-violet-100">Grow.</span>
            </h1>
            <p className="mt-5 leading-7 text-white/80">
              Join SRH CodeVerse and turn every solved problem into progress you can see.
            </p>
          </div>

          <div className="cv-mini-code relative z-10">
            <div className="mb-3 text-xs text-white/50">learning_path.json</div>
            <div className="font-mono text-xs leading-7 sm:text-sm">
              {"{"}
              <br />
              <span className="inline-block pl-4">
                <span className="text-pink-200">"path"</span>:{" "}
                <span className="text-cyan-200">"Full Stack Developer"</span>,
              </span>
              <br />
              <span className="inline-block pl-4">
                <span className="text-pink-200">"streak"</span>: <span className="text-amber-200">7</span>,
              </span>
              <br />
              <span className="inline-block pl-4">
                <span className="text-pink-200">"next"</span>: <span className="text-cyan-200">"Spring Boot"</span>
              </span>
              <br />
              {"}"}
            </div>
          </div>
        </section>

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
            <span className="text-sm text-[var(--cv-muted)]">
              Already here?{" "}
              <Link to="/login" className="font-bold text-violet-500 transition hover:text-cyan-400">
                Login
              </Link>
            </span>
          </div>

          <div className="mx-auto w-full max-w-md min-w-0">
            <p className="cv-kicker">CREATE ACCOUNT</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Build your <span className="cv-gradient-text">future.</span>
            </h2>
            <p className="mt-3 text-[var(--cv-muted)]">
              Create your Student account to start learning and practicing.
            </p>

            <StudentForm />
          </div>
        </section>
      </div>
    </main>
  )
}

export default Register
