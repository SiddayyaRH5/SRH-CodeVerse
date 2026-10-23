import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginUser } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

function Login() {
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { const response = await loginUser(form); login(response.data); navigate(response.data.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard") }
    catch (err) { setError(err.response?.data?.message || "Login failed. Please check your credentials.") }
    finally { setLoading(false) }
  }

  return <main className="cv-auth-page">
    <div className="cv-hero-orb cv-orb-purple"/><div className="cv-hero-orb cv-orb-cyan"/>
    <div className="cv-auth-shell relative z-10">
      <section className="cv-auth-form-side">
        <div className="flex items-center justify-between gap-4 mb-12"><Link to="/" className="flex items-center gap-2.5"><span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white font-black">&lt;/&gt;</span><span className="leading-none"><b className="block">SRH</b><b className="block cv-brand-gradient">CodeVerse</b></span></Link><span className="text-sm text-[var(--cv-muted)]">New here? <Link to="/register" className="font-bold text-violet-600">Sign Up</Link></span></div>
        <div className="max-w-md mx-auto"><p className="cv-kicker">WELCOME BACK</p><h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-2">Welcome <span className="cv-gradient-text">Back!</span></h1><p className="text-[var(--cv-muted)] mt-3">Login to continue your coding journey with SRH CodeVerse.</p>
          {error && <div className="mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block"><span className="sr-only">Username</span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cv-subtle)]">@</span><input name="username" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} className="cv-input pl-10" placeholder="Enter your username" required /></div></label>
            <label className="block"><span className="sr-only">Password</span><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cv-subtle)]">⌑</span><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="cv-input pl-10 pr-11" placeholder="Enter your password" required /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cv-subtle)]">{showPassword ? "◉" : "◌"}</button></div></label>
            <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-[var(--cv-muted)]"><input type="checkbox" className="cv-check"/> Remember me</label><button type="button" className="font-bold text-violet-600">Forgot password?</button></div>
            <button disabled={loading} className="cv-primary-btn w-full !py-3.5 disabled:opacity-60">{loading ? "Logging in..." : "Login"} <span>→</span></button>
          </form>
          <div className="flex items-center gap-3 my-6 text-xs text-[var(--cv-muted)]"><span className="h-px bg-[var(--cv-border)] flex-1"/>OR<span className="h-px bg-[var(--cv-border)] flex-1"/></div>
          <div className="grid sm:grid-cols-2 gap-3"><button type="button" className="cv-secondary-btn !py-3">G&nbsp;&nbsp; Continue with Google</button><button type="button" className="cv-secondary-btn !py-3">●&nbsp;&nbsp; Continue with GitHub</button></div>
          <p className="text-center text-xs text-[var(--cv-muted)] mt-7">Don't have an account? <Link to="/register" className="font-bold text-violet-600">Sign Up</Link></p>
        </div>
      </section>
      <section className="cv-auth-visual">
        <span className="cv-auth-orb one"/><span className="cv-auth-orb two"/>
        <div className="relative z-10 self-start max-w-sm"><p className="text-sm font-bold text-white/75">SRH CODEVERSE</p><h2 className="text-5xl sm:text-6xl font-black tracking-tight leading-[.94] mt-4">Learn.<br/>Practice.<br/><span className="text-cyan-200">Build.</span><br/><span className="text-violet-100">Grow.</span></h2><p className="mt-5 text-white/80 leading-7">Build stronger coding habits, solve practical problems and become the developer you want to be.</p></div>
        <div className="cv-mini-code"><div className="flex gap-1.5 mb-4"><i className="w-2 h-2 rounded-full bg-red-400"/><i className="w-2 h-2 rounded-full bg-amber-300"/><i className="w-2 h-2 rounded-full bg-green-400"/></div><code className="text-xs sm:text-sm leading-6"><span className="text-violet-300">const</span> developer = {'{'}<br/><span className="pl-4 inline-block">learn: <span className="text-cyan-200">true</span>,</span><br/><span className="pl-4 inline-block">practice: <span className="text-cyan-200">true</span>,</span><br/><span className="pl-4 inline-block">future: <span className="text-pink-200">"yours"</span></span><br/>{'}'};</code></div>
      </section>
    </div>
  </main>
}

export default Login
