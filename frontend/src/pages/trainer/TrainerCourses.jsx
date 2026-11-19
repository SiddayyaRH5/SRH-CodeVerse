import { useEffect, useState } from "react"
import { getCourses } from "../../api/courseApi"
import { Link } from "react-router-dom"

export default function TrainerCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => { getCourses().then(r => setCourses(Array.isArray(r.data) ? r.data : [])).catch(e => setError(e.response?.data?.message || "Unable to load course catalogue.")).finally(() => setLoading(false)) }, [])
  return <div className="cv-page">
    <div className="mb-7"><p className="cv-kicker">TEACHING</p><h1 className="text-3xl sm:text-4xl font-black mt-2">Course Library</h1><p className="text-[var(--cv-muted)] mt-2">Browse courses and inspect their published learning content.</p></div>
    {error && <div className="cv-panel p-4 border border-red-500/30 text-red-400 mb-4">{error}<button onClick={() => {setLoading(true);setError("");getCourses().then(r=>setCourses(Array.isArray(r.data)?r.data:[])).catch(e=>setError(e.response?.data?.message||"Unable to load course catalogue.")).finally(()=>setLoading(false))}} className="ml-3 underline">Retry</button></div>}
    {loading ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length:6},(_,i)=><div key={i} className="cv-panel h-48 animate-pulse" />)}</div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{courses.map((c,i)=><article key={c.slug||c.id||i} className="cv-panel p-5 flex flex-col min-h-56"><div className="flex items-start justify-between gap-3"><span className="cv-pill">Course {i+1}</span><span className="text-xs text-[var(--cv-muted)]">{c.level||c.difficulty||"Learning track"}</span></div><h2 className="font-bold text-xl mt-4">{c.title||c.name||"Untitled course"}</h2><p className="text-sm text-[var(--cv-muted)] mt-2 line-clamp-3">{c.description||"Explore lessons, resources, and practice problems in this course."}</p><div className="mt-auto pt-5 flex flex-wrap gap-2 text-xs text-[var(--cv-muted)]"><span>{c.lessonCount??c.lessons?.length??"—"} lessons</span><span>•</span><span>{c.problemCount??c.problems?.length??"—"} problems</span></div><Link to={`/courses/${c.slug}`} className="mt-4 inline-flex text-sm font-semibold text-[var(--cv-primary)] hover:underline">View course content →</Link></article>)}{courses.length===0&&!error&&<div className="cv-panel p-8 text-center text-[var(--cv-muted)]">No courses are currently available.</div>}</div>}
    <div className="mt-5 cv-panel p-4 text-sm text-[var(--cv-muted)]">Course creation, curriculum editing, and trainer ownership assignment are not supported by the current course API. This page is catalogue-only.</div>
  </div>
}
