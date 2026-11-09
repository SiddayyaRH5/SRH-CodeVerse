import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const courses = [
  ["☕", "Java", "Complete Java from basics to advanced", "120+ Lessons", "#ef4444"],
  ["🐍", "Python", "From basics to real-world applications", "100+ Lessons", "#f59e0b"],
  ["JS", "JavaScript", "Modern JavaScript for web development", "80+ Lessons", "#eab308"],
  ["⚛", "React", "Frontend development with real projects", "70+ Lessons", "#06b6d4"],
  ["🌱", "Spring Boot", "Build powerful backend applications", "60+ Lessons", "#22c55e"],
  ["◎", "Web Development", "HTML, CSS, Tailwind CSS and more", "90+ Lessons", "#8b5cf6"],
]

const features = [
  ["▣", "Interactive Learning", "Well-structured lessons with hands-on examples."],
  ["</>", "Coding Challenges", "Practice problems with multiple difficulty levels."],
  ["◈", "Real Projects", "Build and showcase practical developer projects."],
  ["↗", "Track Progress", "Monitor learning, streaks and achievements."],
]

function CodeWindow() {
  return <div className="relative cv-float">
    <div className="cv-code-window relative">
      <div className="cv-code-header px-5 py-4 flex items-center justify-between">
        <div className="flex gap-2"><i className="w-2.5 h-2.5 rounded-full bg-red-400"/><i className="w-2.5 h-2.5 rounded-full bg-amber-300"/><i className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
        <span className="text-[11px] text-[var(--cv-muted)] font-mono">Developer.java</span><span className="text-[10px] text-emerald-500 font-bold">● LIVE</span>
      </div>
      <div className="cv-code-body p-5 sm:p-7 font-mono text-xs sm:text-sm leading-7 min-h-[320px]">
        <div><span className="text-violet-500">public class</span> <span className="text-amber-500">Developer</span> {'{'}</div>
        <div className="pl-5"><span className="text-violet-500">public static void</span> <span className="text-blue-500">main</span>(String[] args) {'{'}</div>
        <div className="pl-10">String goal = <span className="text-emerald-500">"Build. Learn. Repeat."</span>;</div>
        <div className="pl-10"><span className="text-blue-500">CodeVerse</span>.practice(goal);</div>
        <div className="pl-10"><span className="text-blue-500">CodeVerse</span>.levelUp(); <span className="text-violet-500 animate-pulse">▌</span></div>
        <div className="pl-5">{'}'}</div><div>{'}'}</div>
        <div className="mt-7 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)]/70 p-4 flex items-center justify-between font-sans">
          <div><p className="text-xs text-[var(--cv-muted)]">Today's progress</p><p className="font-bold mt-1">7 / 10 problems</p></div>
          <div className="w-12 h-12 rounded-full grid place-items-center bg-[conic-gradient(#7c3aed_70%,var(--cv-surface-2)_0)]"><span className="w-9 h-9 rounded-full grid place-items-center bg-[var(--cv-surface)] text-[10px] font-bold">70%</span></div>
        </div>
      </div>
    </div>
    <div className="cv-code-glow" />
    <div className="cv-floating-badge cv-badge-a">☕ <b>Java</b><span>120+ lessons</span></div>
    <div className="cv-floating-badge cv-badge-b">⚡ <b>+120 XP</b><span>level up</span></div>
    <div className="hidden sm:block absolute -right-7 top-24 px-4 py-3 rounded-2xl bg-[var(--cv-glass)] border border-[var(--cv-border)] shadow-xl backdrop-blur-xl rotate-3"><b className="text-sm">Solve Problems</b><span className="block text-[10px] text-[var(--cv-muted)] mt-1">Easy → Hard</span></div>
  </div>
}

function Landing() {
  const { user } = useAuth()
  const dashboard = user?.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard"

  return <main>
    <section className="cv-hero min-h-[720px] lg:min-h-[760px] flex items-center">
      <div className="cv-hero-orb cv-orb-purple"/><div className="cv-hero-orb cv-orb-cyan"/><div className="cv-hero-orb cv-orb-pink"/>
      <div className="max-w-[1320px] mx-auto w-full px-5 sm:px-8 py-20 relative z-10 grid lg:grid-cols-[.88fr_1.12fr] gap-12 items-center">
        <div className="cv-reveal">
          <div className="cv-pill"><span className="cv-live-dot"/> 🚀 Your Coding Journey Starts Here</div>
          <h1 className="mt-7 text-5xl sm:text-6xl lg:text-[72px] font-black tracking-[-.055em] leading-[.94]">Learn to Code.<br/>Build Your <span className="cv-gradient-text">Future.</span></h1>
          <p className="mt-7 max-w-xl text-base sm:text-lg leading-8 text-[var(--cv-muted)]">Interactive courses, coding challenges, real-world projects and a supportive community to help you become a better developer.</p>
          <div className="flex flex-wrap gap-3 mt-8"><Link to={user ? dashboard : "/register"} className="cv-primary-btn">{user ? "Open Dashboard" : "Start Learning"} <span>→</span></Link><Link to="/courses" className="cv-secondary-btn">Explore Courses</Link></div>
          <div className="flex items-center gap-4 mt-9"><div className="flex -space-x-2"><span className="w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-violet-500 to-blue-500 border-2 border-[var(--cv-bg)] text-white text-xs font-bold">S</span><span className="w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-blue-500 to-cyan-400 border-2 border-[var(--cv-bg)] text-white text-xs font-bold">A</span><span className="w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-pink-500 to-violet-500 border-2 border-[var(--cv-bg)] text-white text-xs font-bold">R</span><span className="w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-[var(--cv-bg)] text-white text-xs font-bold">+</span></div><div><b className="text-sm">10K+ Developers</b><p className="text-xs text-[var(--cv-muted)]">are learning with CodeVerse</p></div></div>
        </div>
        <div className="relative px-2 sm:px-8 lg:px-0"><CodeWindow /></div>
      </div>
    </section>

    <section className="relative z-20 -mt-10 max-w-[1280px] mx-auto px-4 sm:px-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[["⌘","500+","Coding Problems"],["▶","50+","Video Courses"],["▣","20+","Real-world Projects"],["♧","10K+","Community Members"]].map(([icon,num,label]) => <div className="cv-stat-card rounded-2xl p-5 flex items-center gap-4" key={label}><span className="w-12 h-12 rounded-xl grid place-items-center bg-gradient-to-br from-violet-500/15 to-cyan-500/15 text-violet-600 text-xl">{icon}</span><div><b className="text-2xl tracking-tight">{num}</b><p className="text-xs text-[var(--cv-muted)] mt-0.5">{label}</p></div></div>)}
      </div>
    </section>

    <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"><div><p className="cv-kicker">LEARN WITH STRUCTURE</p><h2 className="text-3xl sm:text-4xl font-black mt-2">Popular Courses</h2><p className="text-[var(--cv-muted)] mt-2">Learn from structured courses designed for beginners to advanced learners.</p></div><Link to="/courses" className="text-sm font-bold text-violet-600 hover:translate-x-1 transition-transform">View All Courses →</Link></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {courses.map(([icon,title,desc,lessons,accent]) => <Link to={`/courses/${({Java:"java-programming",Python:"python-programming",JavaScript:"javascript",React:"react-js","Spring Boot":"spring-boot","Web Development":"html-css"})[title] || ""}`} key={title} className="cv-course-card rounded-2xl p-5 group">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-2xl" style={{background:`color-mix(in srgb, ${accent} 10%, var(--cv-surface))`}}>{icon}</span><h3 className="font-extrabold mt-5">{title}</h3><p className="text-xs leading-5 text-[var(--cv-muted)] mt-2 min-h-10">{desc}</p><div className="mt-5 flex items-center justify-between"><span className="text-[11px] font-semibold text-[var(--cv-muted)]">{lessons}</span><span className="w-8 h-8 rounded-full grid place-items-center bg-violet-500/10 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">→</span></div>
        </Link>)}
      </div>
    </section>

    <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-20 grid lg:grid-cols-[1.45fr_.75fr] gap-5">
      <div className="cv-section-panel rounded-3xl p-6 sm:p-8"><p className="cv-kicker">WHY CHOOSE US</p><h2 className="text-3xl font-black mt-2">Why Choose SRH <span className="cv-gradient-text">CodeVerse?</span></h2><p className="text-[var(--cv-muted)] mt-2">More than just courses — a complete platform to help you grow as a developer.</p><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-7">{features.map(([icon,title,desc]) => <div key={title} className="rounded-2xl p-4 bg-[var(--cv-surface-2)] border border-[var(--cv-border)] hover:-translate-y-1 transition"><span className="w-10 h-10 rounded-xl grid place-items-center bg-violet-500/10 text-violet-600 font-bold">{icon}</span><h3 className="text-sm font-bold mt-4">{title}</h3><p className="text-[11px] leading-5 text-[var(--cv-muted)] mt-1">{desc}</p></div>)}</div></div>
      <div className="cv-section-panel rounded-3xl p-6 sm:p-8"><div className="flex items-start justify-between"><div><p className="cv-kicker">PRACTICE</p><h2 className="text-2xl font-black mt-2">Practice Problems</h2><p className="text-xs text-[var(--cv-muted)] mt-1">Sharpen your skills with coding challenges.</p></div><Link to="/problems" className="text-xs font-bold text-violet-600">View All →</Link></div><div className="space-y-3 mt-7">{[["Easy","450+ Problems","#22c55e"],["Medium","320+ Problems","#f59e0b"],["Hard","180+ Problems","#ef4444"]].map(([name,count,color]) => <Link to="/problems" key={name} className="flex items-center justify-between rounded-2xl p-4 bg-[var(--cv-surface-2)] border border-[var(--cv-border)] hover:-translate-y-1 transition"><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl grid place-items-center font-bold" style={{color,background:`color-mix(in srgb, ${color} 10%, var(--cv-surface))`}}>◆</span><div><b className="text-sm">{name}</b><p className="text-[10px] text-[var(--cv-muted)]">{count}</p></div></div><span className="text-[var(--cv-muted)]">→</span></Link>)}</div></div>
    </section>

    <section className="max-w-[1280px] mx-auto px-5 sm:px-8 pb-24"><div className="rounded-[28px] overflow-hidden relative p-8 sm:p-12 bg-gradient-to-r from-violet-700 via-blue-600 to-cyan-500 text-white shadow-2xl"><div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/15 blur-3xl"/><div className="relative z-10 max-w-2xl"><p className="text-xs font-black tracking-[.18em] text-white/75">LEARN. PRACTICE. BUILD. GROW.</p><h2 className="text-3xl sm:text-4xl font-black mt-3">Your next level starts with one solved problem.</h2><p className="mt-3 text-sm sm:text-base text-white/80">Build consistent habits, create real projects and get interview-ready with SRH CodeVerse.</p><div className="mt-7"><Link to={user ? dashboard : "/register"} className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-5 py-3 font-extrabold hover:-translate-y-1 transition">{user ? "Open Dashboard" : "Join CodeVerse"} →</Link></div></div></div></section>
  </main>
}

export default Landing
