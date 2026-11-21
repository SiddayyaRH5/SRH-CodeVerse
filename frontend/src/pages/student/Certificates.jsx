import { useEffect, useMemo, useState } from "react"
import { getProblems } from "../../api/problemApi"
import { getProfile } from "../../api/profileApi"

const CERTIFICATES = [
  { id: "java-foundations", title: "Java Foundations", icon: "☕", topics: ["java", "oop", "strings", "arrays", "collections", "exception"], accent: "from-orange-500 to-red-500", description: "Core Java, OOP and practical problem solving." },
  { id: "dsa-mastery", title: "DSA Problem Solving", icon: "🧠", topics: ["dsa", "array", "arrays", "string", "strings", "linked", "stack", "queue", "tree", "sorting", "search"], accent: "from-violet-500 to-blue-500", description: "Algorithms and data structures through coding practice." },
  { id: "spring-backend", title: "Spring Boot Backend", icon: "🌱", topics: ["spring", "spring boot", "springboot", "rest", "api", "hibernate", "jpa"], accent: "from-emerald-500 to-cyan-500", description: "REST APIs, persistence and production backend fundamentals." },
  { id: "fullstack-builder", title: "Full-Stack Builder", icon: "🚀", topics: ["react", "javascript", "frontend", "web", "html", "css", "full stack"], accent: "from-blue-500 to-cyan-400", description: "Frontend and backend skills combined into full-stack development." },
]

const normalize = (value) => String(value || "").toLowerCase().trim()
const matches = (problem, topics) => topics.some((topic) => normalize(problem.topic).includes(topic))

function certificateKey(username, id) { return `srhcodeverse_certificate_${username}_${id}` }

export default function Certificates() {
  const [problems, setProblems] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([getProblems(), getProfile()])
      .then(([p, u]) => { setProblems(p.data || []); setProfile(u.data || null) })
      .catch(() => { setProblems([]); setProfile(null) })
      .finally(() => setLoading(false))
  }, [])

  const cards = useMemo(() => CERTIFICATES.map((certificate) => {
    const relevant = problems.filter((problem) => matches(problem, certificate.topics))
    const solved = relevant.filter((problem) => problem.solved).length
    const progress = relevant.length ? Math.round((solved / relevant.length) * 100) : 0
    const eligible = relevant.length > 0 && progress >= 70
    const issued = profile?.username ? localStorage.getItem(certificateKey(profile.username, certificate.id)) === "issued" : false
    return { ...certificate, relevant, solved, progress, eligible, issued }
  }), [problems, profile])

  const issue = (certificate) => {
    if (!profile?.username || !certificate.eligible) return
    localStorage.setItem(certificateKey(profile.username, certificate.id), "issued")
    setSelected({ ...certificate, issued: true })
  }

  if (loading) return <div className="cv-page"><div className="cv-panel animate-pulse h-64" /></div>

  return (
    <div className="cv-page">
      <div className="flex flex-col lg:flex-row justify-between gap-5 items-start lg:items-end">
        <div><p className="cv-kicker">ACHIEVEMENT CENTER</p><h1 className="text-4xl sm:text-5xl font-black mt-2">Certificates</h1><p className="text-[var(--cv-muted)] mt-3 max-w-2xl">Turn consistent coding practice into shareable CodeVerse certificates. Eligibility is calculated from your real solved-problem coverage.</p></div>
        <div className="cv-pill">🏅 {cards.filter((card) => card.issued).length} earned</div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-8">
        {cards.map((certificate, index) => (
          <div key={certificate.id} className="cv-panel overflow-hidden cv-reveal" style={{ animationDelay: `${index * 70}ms` }}>
            <div className={`h-2 -mx-[22px] -mt-[22px] mb-6 bg-gradient-to-r ${certificate.accent}`} />
            <div className="flex items-start justify-between gap-4"><div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 grid place-items-center text-2xl">{certificate.icon}</div>{certificate.issued && <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">✓ Earned</span>}</div>
            <h2 className="text-2xl font-black mt-5">{certificate.title}</h2>
            <p className="text-sm text-[var(--cv-muted)] mt-2">{certificate.description}</p>
            <div className="mt-6"><div className="flex justify-between text-xs mb-2"><span className="text-[var(--cv-muted)]">Progress</span><strong>{certificate.progress}%</strong></div><div className="h-2 rounded-full bg-[var(--cv-surface-2)] overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${certificate.accent}`} style={{ width: `${certificate.progress}%` }} /></div><p className="text-xs text-[var(--cv-muted)] mt-2">{certificate.solved} / {certificate.relevant.length || 0} matching problems solved · 70% required</p></div>
            <div className="flex flex-wrap gap-2 mt-6">
              <button className="cv-secondary-btn !py-2.5 !px-4 text-xs" onClick={() => setSelected(certificate)}>Preview</button>
              {certificate.eligible ? <button className="cv-primary-btn !py-2.5 !px-4 text-xs" onClick={() => { issue(certificate); setSelected({ ...certificate, issued: true }) }}>{certificate.issued ? "Open Certificate" : "Claim Certificate"}</button> : <span className="inline-flex items-center text-xs text-[var(--cv-muted)] px-3">Solve more problems to unlock</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="cv-panel mt-6"><div className="flex gap-3"><span className="text-xl">💡</span><div><h3 className="font-black">How certificates work</h3><p className="text-sm text-[var(--cv-muted)] mt-1">CodeVerse calculates progress from the topics attached to your existing coding problems. Reach at least 70% solved coverage for a certificate, then claim and print it.</p></div></div></div>

      {selected && <CertificateModal certificate={selected} username={profile?.username || "CodeVerse Developer"} onClose={() => setSelected(null)} />}
    </div>
  )
}

function CertificateModal({ certificate, username, onClose }) {
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
  const id = `SRH-${certificate.id.slice(0, 4).toUpperCase()}-${String(username).replace(/\s+/g, "").slice(0, 4).toUpperCase()}-2026`
  return <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 sm:p-8 overflow-auto" role="dialog" aria-modal="true">
    <div className="min-h-full grid place-items-center"><div className="w-full max-w-5xl cv-panel !p-0 overflow-hidden">
      <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--cv-border)]"><div><p className="cv-kicker">CERTIFICATE PREVIEW</p><p className="text-sm text-[var(--cv-muted)] mt-1">SRH CodeVerse</p></div><div className="flex gap-2"><button className="cv-secondary-btn !py-2 !px-4 text-xs" onClick={() => window.print()}>Print / Save PDF</button><button className="cv-icon-btn" onClick={onClose}>×</button></div></div>
      <div className="certificate-print p-8 sm:p-14 bg-[var(--cv-surface)]">
        <div className="border-[3px] border-violet-500/60 rounded-[28px] p-8 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute -top-28 -right-28 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" /><div className="absolute -bottom-28 -left-28 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <p className="text-sm font-black tracking-[.3em] text-violet-500">SRH CODEVERSE</p><p className="text-xs tracking-[.25em] text-[var(--cv-muted)] mt-3">LEARN. PRACTICE. BUILD. GROW.</p>
          <div className="text-6xl mt-8">🏆</div><h2 className="text-3xl sm:text-5xl font-black mt-5">Certificate of Achievement</h2><p className="text-[var(--cv-muted)] mt-6">This certifies that</p><h3 className="text-3xl sm:text-4xl font-black cv-gradient-text mt-3">{username}</h3><p className="text-[var(--cv-muted)] mt-6">has successfully demonstrated coding proficiency in</p><h4 className="text-2xl sm:text-3xl font-black mt-3">{certificate.title}</h4><p className="text-sm text-[var(--cv-muted)] mt-5 max-w-2xl mx-auto">Awarded for achieving the CodeVerse learning milestone through consistent problem solving and practical development.</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-10 text-left max-w-xl mx-auto"><div><p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Certificate ID</p><p className="font-bold mt-1">{id}</p></div><div><p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Issued</p><p className="font-bold mt-1">{date}</p></div></div>
          <div className="mt-12 pt-5 border-t border-[var(--cv-border)] text-xs text-[var(--cv-muted)]">SRH CodeVerse · Siddayya Rudrayya Hiremath</div>
        </div>
      </div>
    </div></div>
  </div>
}
