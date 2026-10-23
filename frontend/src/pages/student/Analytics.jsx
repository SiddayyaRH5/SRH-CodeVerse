import { useEffect, useMemo, useState } from "react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { getDashboard } from "../../api/dashboardApi"
import { getActivity } from "../../api/activityApi"
import { getProblems } from "../../api/problemApi"

export default function Analytics() {
  const [dashboard, setDashboard] = useState(null)
  const [activity, setActivity] = useState([])
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboard(), getActivity(), getProblems()]).then(([d,a,p]) => {
      setDashboard(d.data); setActivity(a.data?.days || []); setProblems(p.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const last14 = useMemo(() => activity.slice(-14).map((d) => ({ date: d.date.slice(5), submissions: d.count })), [activity])
  const difficulty = useMemo(() => ['EASY','MEDIUM','HARD'].map((name) => ({ name, solved: problems.filter((p) => p.difficulty === name && p.solved).length, total: problems.filter((p) => p.difficulty === name).length })), [problems])
  const totalSolved = problems.filter((p) => p.solved).length
  const solveRate = problems.length ? Math.round((totalSolved / problems.length) * 100) : 0
  const activeDays = activity.filter((d) => d.count > 0).length

  if (loading) return <div className="cv-page"><p className="text-[var(--cv-muted)]">Building your developer analytics...</p></div>

  return <div className="cv-page">
    <div><p className="cv-kicker">YOUR DEVELOPER TELEMETRY</p><h1 className="text-4xl font-black mt-2">Advanced Analytics</h1><p className="text-[var(--cv-muted)] mt-2 max-w-2xl">See how consistently you code, which difficulty levels you have mastered, and where your next improvement can come from.</p></div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
      {[["Problems Solved",dashboard?.problemsSolved ?? totalSolved,"✓"],["Current Streak",`${dashboard?.forgeStreakCurrent ?? 0} days`,"🔥"],["Solve Coverage",`${solveRate}%`,"◈"],["Active Days",activeDays,"↗"]].map(([label,value,icon]) => <div key={label} className="cv-stat-card rounded-2xl p-5"><div className="flex justify-between"><span className="w-10 h-10 rounded-xl grid place-items-center bg-violet-500/10 text-violet-500">{icon}</span><span className="text-xs text-emerald-500 font-bold">LIVE</span></div><p className="text-xs text-[var(--cv-muted)] mt-6">{label}</p><p className="text-3xl font-black mt-1">{value}</p></div>)}
    </div>
    <div className="grid xl:grid-cols-[1.35fr_.65fr] gap-5 mt-5">
      <section className="cv-panel"><div className="flex justify-between items-end"><div><p className="text-xs font-bold text-violet-500">LAST 14 DAYS</p><h2 className="text-xl font-black mt-1">Coding Activity</h2></div><span className="text-xs text-[var(--cv-muted)]">Actual submissions</span></div><div className="h-72 mt-6"><ResponsiveContainer width="100%" height="100%"><AreaChart data={last14}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)"/><XAxis dataKey="date" tick={{fill:'var(--cv-muted)',fontSize:11}}/><YAxis allowDecimals={false} tick={{fill:'var(--cv-muted)',fontSize:11}}/><Tooltip contentStyle={{background:'var(--cv-surface)',border:'1px solid var(--cv-border)',borderRadius:12,color:'var(--cv-text)'}}/><Area type="monotone" dataKey="submissions" stroke="#7c3aed" fill="url(#activityFill)" strokeWidth={3}/></AreaChart></ResponsiveContainer></div></section>
      <section className="cv-panel"><p className="text-xs font-bold text-cyan-500">DIFFICULTY MASTERY</p><h2 className="text-xl font-black mt-1">Solved vs available</h2><div className="h-72 mt-6"><ResponsiveContainer width="100%" height="100%"><BarChart data={difficulty}><CartesianGrid strokeDasharray="3 3" stroke="var(--cv-border)"/><XAxis dataKey="name" tick={{fill:'var(--cv-muted)',fontSize:11}}/><YAxis allowDecimals={false} tick={{fill:'var(--cv-muted)',fontSize:11}}/><Tooltip contentStyle={{background:'var(--cv-surface)',border:'1px solid var(--cv-border)',borderRadius:12,color:'var(--cv-text)'}}/><Bar dataKey="solved" fill="#06b6d4" radius={[6,6,0,0]}/><Bar dataKey="total" fill="#7c3aed" fillOpacity={0.22} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section>
    </div>
    <div className="grid lg:grid-cols-3 gap-5 mt-5"><div className="cv-panel"><p className="text-xs font-bold text-violet-500">NEXT FOCUS</p><h3 className="text-xl font-black mt-2">Build consistency</h3><p className="text-sm text-[var(--cv-muted)] mt-2">Your analytics show {activeDays} active days in the last 91 days. Aim for a short daily session instead of occasional long sessions.</p></div><div className="cv-panel"><p className="text-xs font-bold text-cyan-500">DIFFICULTY SIGNAL</p><h3 className="text-xl font-black mt-2">Push one level higher</h3><p className="text-sm text-[var(--cv-muted)] mt-2">Use your solved distribution to choose the next difficulty. Once Easy feels routine, increase Medium practice gradually.</p></div><div className="cv-panel"><p className="text-xs font-bold text-pink-500">STREAK</p><h3 className="text-xl font-black mt-2">Protect your momentum</h3><p className="text-sm text-[var(--cv-muted)] mt-2">Your current streak is {dashboard?.forgeStreakCurrent ?? 0} days. One focused problem a day is enough to keep the habit alive.</p></div></div>
  </div>
}
