import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerUser } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const strength = form.password.length >= 10 ? "Strong" : form.password.length >= 6 ? "Good" : form.password.length ? "Weak" : ""

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { const response = await registerUser(form); login(response.data); navigate(response.data.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard") }
    catch (err) { setError(err.response?.data?.message || "Registration failed") }
    finally { setLoading(false) }
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
          <p className="text-[11px] leading-5 text-[var(--cv-muted)] mt-5">By creating an account, you agree to use CodeVerse responsibly and respect the community.</p>
        </div>
      </section>
    </div>
  </main>
}

export default Register
