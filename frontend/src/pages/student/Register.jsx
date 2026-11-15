import { useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { OAUTH_INITIATION_URLS, registerUser } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const submittingRef = useRef(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const strength = form.password.length >= 10 ? "Strong" : form.password.length >= 6 ? "Good" : form.password.length ? "Weak" : ""

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setError(""); setLoading(true)
    try { const response = await registerUser(form); login(response.data); navigate(response.data.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard") }
    catch (err) { setError(err.response?.data?.message || (err.code === "ECONNABORTED" ? "The server is taking longer than expected. Check your account status before trying signup again." : "Registration failed")) }
    finally { submittingRef.current = false; setLoading(false) }
  }

  return <main className="cv-auth-page">
    <div className="cv-hero-orb cv-orb-purple"/><div className="cv-hero-orb cv-orb-cyan"/>
    <div className="cv-auth-shell relative z-10">
      <section className="cv-auth-visual">
        <span className="cv-auth-orb one"/><span className="cv-auth-orb two"/>
        <div className="relative z-10 self-start max-w-sm"><p className="text-sm font-bold text-white/75">START YOUR JOURNEY</p><h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[.94] mt-4">Learn.<br/>Practice.<br/><span className="text-cyan-200">Build.</span><br/><span className="text-violet-100">Grow.</span></h1><p className="mt-5 text-white/80 leading-7">Join SRH CodeVerse and turn every solved problem into progress you can see.</p></div>
        <div className="cv-mini-code"><div className="text-xs text-white/50 mb-3">learning_path.json</div><div className="text-xs sm:text-sm leading-7 font-mono">{'{'}<br/><span className="pl-4 inline-block"><span className="text-pink-200">"path"</span>: <span className="text-cyan-200">"Full Stack Developer"</span>,</span><br/><span className="pl-4 inline-block"><span className="text-pink-200">"streak"</span>: <span className="text-amber-200">7</span>,</span><br/><span className="pl-4 inline-block"><span className="text-pink-200">"next"</span>: <span className="text-cyan-200">"Spring Boot"</span></span><br/>{'}'}</div></div>
      </section>
      <section className="cv-auth-form-side">
        <div className="flex items-center justify-between gap-4 mb-10"><Link to="/" className="flex items-center gap-2.5"><span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white font-black">&lt;/&gt;</span><span className="leading-none"><b className="block">SRH</b><b className="block cv-brand-gradient">CodeVerse</b></span></Link><span className="text-sm text-[var(--cv-muted)]">Already here? <Link to="/login" className="font-bold text-violet-600">Login</Link></span></div>
        <div className="max-w-md mx-auto"><p className="cv-kicker">CREATE ACCOUNT</p><h2 className="text-4xl sm:text-5xl font-black tracking-tight mt-2">Build your <span className="cv-gradient-text">future.</span></h2><p className="text-[var(--cv-muted)] mt-3">Create your CodeVerse account and start learning today.</p>
          {error && <div className="mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <input name="username" placeholder="Username" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} className="cv-input" required />
            <input name="email" type="email" placeholder="Email address" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="cv-input" required />
            <div><div className="relative"><input name="password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="cv-input pr-11" minLength={6} required /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cv-subtle)]">{showPassword ? "◉" : "◌"}</button></div>{strength && <div className="flex items-center gap-2 mt-2"><div className="h-1.5 flex-1 rounded-full bg-[var(--cv-surface-2)] overflow-hidden"><div className={`h-full ${strength === "Strong" ? "w-full" : strength === "Good" ? "w-2/3" : "w-1/3"} bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all`}/></div><span className="text-[10px] text-[var(--cv-muted)]">{strength}</span></div>}</div>
            <button disabled={loading} className="cv-primary-btn w-full !py-3.5 disabled:opacity-60">{loading ? "Creating account..." : "Create Account"} →</button>
          </form>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.location.assign(OAUTH_INITIATION_URLS.google)}
              title="Google sign-in"
              className="cv-secondary-btn relative min-h-[92px] w-full !px-7 !py-5 text-base"
            >
              <svg className="absolute left-6 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.51h6.44c-.28 1.45-1.12 2.68-2.37 3.5v2.92h3.84c2.25-2.07 3.58-5.12 3.58-8.59z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.93l-3.84-2.92c-1.08.72-2.46 1.15-4.1 1.15-3.15 0-5.82-2.13-6.77-5H1.26v3.01C3.24 21.11 7.29 24 12 24z" />
                <path fill="#FBBC05" d="M5.23 14.3c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3V6.69H1.26C.46 8.29 0 10.08 0 12s.46 3.71 1.26 5.31l3.97-3.01z" />
                <path fill="#EA4335" d="M12 4.78c1.77 0 3.35.61 4.6 1.81l3.44-3.44C17.95 1.2 15.24 0 12 0 7.29 0 3.24 2.89 1.26 6.69l3.97 3.01c.95-2.87 3.62-4.92 6.77-4.92z" />
              </svg>
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
              <svg className="absolute left-6 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 .297a12 12 0 0 0-3.79 23.385c.6.111.82-.261.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 6.008 0c2.292-1.552 3.299-1.23 3.299-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.91 1.235 3.221 0 4.61-2.807 5.623-5.479 5.921.43.372.814 1.102.814 2.222v3.293c0 .319.216.694.825.576A12 12 0 0 0 12 .297z" />
              </svg>
              <span className="text-center leading-7">
                <span className="block">Continue with</span>
                <span className="block">GitHub</span>
              </span>
            </button>
          </div>

          <p className="text-[11px] leading-5 text-[var(--cv-muted)] mt-5">By creating an account, you agree to use CodeVerse responsibly and respect the community.</p>
        </div>
      </section>
    </div>
  </main>
}

export default Register
