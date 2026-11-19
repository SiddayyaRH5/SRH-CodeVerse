import { useCallback, useEffect, useMemo, useState } from "react"
import { getProblems } from "../../api/problemApi"
import { getProfile } from "../../api/profileApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import { SkeletonCards } from "../../components/common/Skeleton"

const NAV_ICONS = {
  java: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" />
    </svg>
  ),
  dsa: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="14" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  spring: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  fullstack: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
}

const CERTIFICATES = [
  { id: "java-foundations", title: "Java Foundations", icon: NAV_ICONS.java, topics: ["java", "oop", "strings", "arrays", "collections", "exception"], accent: "from-orange-500 to-red-500", description: "Core Java, OOP and practical problem solving." },
  { id: "dsa-mastery", title: "DSA Problem Solving", icon: NAV_ICONS.dsa, topics: ["dsa", "array", "arrays", "string", "strings", "linked", "stack", "queue", "tree", "sorting", "search"], accent: "from-violet-500 to-blue-500", description: "Algorithms and data structures through coding practice." },
  { id: "spring-backend", title: "Spring Boot Backend", icon: NAV_ICONS.spring, topics: ["spring", "spring boot", "springboot", "rest", "api", "hibernate", "jpa"], accent: "from-emerald-500 to-cyan-500", description: "REST APIs, persistence and production backend fundamentals." },
  { id: "fullstack-builder", title: "Full-Stack Builder", icon: NAV_ICONS.fullstack, topics: ["react", "javascript", "frontend", "web", "html", "css", "full stack"], accent: "from-blue-500 to-cyan-400", description: "Frontend and backend skills combined into full-stack development." },
]

const normalize = (value) => String(value || "").toLowerCase().trim()
const matches = (problem, topics) => topics.some((topic) => normalize(problem.topic).includes(topic))
const certificateKey = (username, id) => `srhcodeverse_certificate_${username}_${id}`

export default function Certificates() {
  const [problems, setProblems] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [p, u] = await Promise.all([getProblems(), getProfile()])
      setProblems(p.data || [])
      setProfile(u.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load certificates.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={4} />
        </PageContainer>
      </main>
    )
  }

  if (error) {
    return (
      <main className="cv-page">
        <PageContainer>
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl" aria-hidden="true">!</div>
            <h2 className="mt-5 text-lg font-bold">{error}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">Please check your connection and try again.</p>
            <button type="button" onClick={loadData} className="mt-6 cv-primary-btn !px-4 !py-2.5 text-sm">Try again</button>
          </div>
        </PageContainer>
      </main>
    )
  }

  const issuedCount = cards.filter((card) => card.issued).length

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="ACHIEVEMENT CENTER"
          title="Certificates"
          description="Generate local certificate previews from your solved-problem coverage. Claim state is stored in this browser only."
          actions={
            <>
              <div className="cv-pill">
                <span className="w-2 h-2 rounded-full bg-[var(--cv-primary)] mr-2" /> {issuedCount} claimed (local)
              </div>
            </>
          }
        />

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          {cards.map((certificate, index) => (
            <div key={certificate.id} className="cv-section-panel overflow-hidden cv-reveal" style={{ animationDelay: `${index * 70}ms` }}>
              <div className={`h-2 -mx-[22px] -mt-[22px] mb-6 bg-gradient-to-r ${certificate.accent}`} />
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 grid place-items-center text-2xl">{certificate.icon}</div>
                {certificate.issued && <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">✓ Claimed (local)</span>}
              </div>
              <h2 className="text-2xl font-black mt-5">{certificate.title}</h2>
              <p className="text-sm text-[var(--cv-muted)] mt-2">{certificate.description}</p>
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2"><span className="text-[var(--cv-muted)]">Progress</span><strong>{certificate.progress}%</strong></div>
                <div className="h-2 rounded-full bg-[var(--cv-surface-2)] overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${certificate.accent}`} style={{ width: `${certificate.progress}%` }} /></div>
                <p className="text-xs text-[var(--cv-muted)] mt-2">{certificate.solved} / {certificate.relevant.length || 0} matching problems solved · 70% required</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                <button className="text-xs font-bold text-[var(--cv-primary)] underline hover:text-violet-300" onClick={() => setSelected(certificate)}>Preview</button>
                {certificate.eligible ? (
                  <button className="text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg" onClick={() => { issue(certificate); setSelected({ ...certificate, issued: true }) }}>
                    {certificate.issued ? "Open Local Preview" : "Generate Local Certificate"}
                  </button>
                ) : (
                  <span className="inline-flex items-center text-xs text-[var(--cv-muted)] px-3 py-1.5">Solve more problems to unlock</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="cv-section-panel mt-6">
          <div className="flex gap-3 p-5">
            <span className="text-xl" aria-hidden="true">💡</span>
            <div>
              <h3 className="font-black">How certificates work</h3>
              <p className="text-sm text-[var(--cv-muted)] mt-1">CodeVerse calculates progress from your solved-problem coverage. Reach at least 70% solved coverage to claim a local certificate preview. Claim state is stored in this browser only; clearing browser storage removes claims. The printable document is a frontend-generated preview, not an official backend-issued certificate.</p>
            </div>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 sm:p-8 overflow-auto" role="dialog" aria-modal="true">
            <div className="min-h-full grid place-items-center">
              <div className="w-full max-w-5xl cv-section-panel !p-0 overflow-hidden">
                <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--cv-border)]">
                  <div>
                    <p className="cv-kicker">LOCAL CERTIFICATE PREVIEW</p>
                    <p className="text-sm text-[var(--cv-muted)] mt-1">SRH CodeVerse</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs font-bold text-[var(--cv-primary)] underline hover:text-violet-300" onClick={() => window.print()}>Print / Save PDF</button>
                    <button className="cv-icon-btn" onClick={() => setSelected(null)}>×</button>
                  </div>
                </div>
                <div className="certificate-print p-8 sm:p-14 bg-[var(--cv-surface)]">
                  <div className="border-[3px] border-violet-500/60 rounded-[28px] p-8 sm:p-14 text-center relative overflow-hidden">
                    <div className="absolute -top-28 -right-28 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
                    <div className="absolute -bottom-28 -left-28 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl" />
                    <p className="text-sm font-black tracking-[.3em] text-[var(--cv-primary)]">SRH CODEVERSE</p>
                    <p className="text-xs tracking-[.25em] text-[var(--cv-muted)] mt-3">LEARN. PRACTICE. BUILD. GROW.</p>
                    <div className="text-6xl mt-8" aria-hidden="true">🏆</div>
                    <h2 className="text-3xl sm:text-5xl font-black mt-5">Local Certificate Preview</h2>
                    <p className="text-[var(--cv-muted)] mt-6">This locally generated preview certifies that</p>
                    <h3 className="text-3xl sm:text-4xl font-black cv-gradient-text mt-3">{profile?.username || "CodeVerse Developer"}</h3>
                    <p className="text-[var(--cv-muted)] mt-6">has demonstrated coding proficiency in</p>
                    <h4 className="text-2xl sm:text-3xl font-black mt-3">{selected.title}</h4>
                    <p className="text-sm text-[var(--cv-muted)] mt-5 max-w-2xl mx-auto">Generated locally for personal record. Not an official backend-issued credential.</p>
                    <div className="grid sm:grid-cols-2 gap-4 mt-10 text-left max-w-xl mx-auto">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Local ID</p>
                        <p className="font-bold mt-1">SRH-{selected.id.slice(0, 4).toUpperCase()}-${String(profile?.username).replace(/\s+/g, "").slice(0, 4).toUpperCase()}-2026</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--cv-muted)]">Generated locally</p>
                        <p className="font-bold mt-1">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="mt-12 pt-5 border-t border-[var(--cv-border)] text-xs text-[var(--cv-muted)]">SRH CodeVerse · Siddayya Rudrayya Hiremath</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </main>
  )
}