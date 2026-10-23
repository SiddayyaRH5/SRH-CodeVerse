import { useEffect, useMemo, useState } from "react"
import Editor from "@monaco-editor/react"
import { getProblemDetail, getProblems, runCode, submitCode } from "../../api/problemApi"
import DifficultyBadge from "../../components/common/DifficultyBadge"

const START_SECONDS = 45 * 60

export default function LiveCodingArena() {
  const [problems, setProblems] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(START_SECONDS)
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getProblems().then((res) => {
      const list = res.data || []
      setProblems(list)
      if (list[0]) setSelectedId(String(list[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setResult(null)
    getProblemDetail(selectedId).then((res) => {
      setProblem(res.data)
      setCode(res.data.starterCode || "")
    })
  }, [selectedId])

  useEffect(() => {
    if (!started || submitted || seconds <= 0) return
    const timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [started, submitted, seconds])

  const formatted = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`, [seconds])

  const run = async (isSubmit = false) => {
    if (!problem || busy) return
    setBusy(true)
    try {
      const res = await (isSubmit ? submitCode(problem.id, code) : runCode(problem.id, code))
      setResult(res.data)
      if (isSubmit && res.data.status === "PASSED") setSubmitted(true)
    } catch (err) {
      setResult({ status: "ERROR", compileError: err.response?.data?.message || "Request failed" })
    } finally { setBusy(false) }
  }

  const resetArena = () => {
    setStarted(false); setSubmitted(false); setSeconds(START_SECONDS); setResult(null); setCode(problem?.starterCode || "")
  }

  if (loading) return <div className="cv-page"><p className="text-[var(--cv-muted)]">Loading coding arena...</p></div>

  return <div className="cv-page max-w-[1400px]">
    <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
      <div><p className="cv-kicker">REAL-TIME PRACTICE</p><h1 className="text-4xl font-black mt-2">Live Coding Arena</h1><p className="text-[var(--cv-muted)] mt-2 max-w-2xl">A timed workspace powered by the same problems and Java execution engine used by CodeVerse.</p></div>
      <div className={`px-5 py-3 rounded-2xl border font-mono text-xl font-black ${seconds < 300 ? 'border-red-500/40 text-red-500 bg-red-500/5' : 'border-violet-500/30 text-violet-500 bg-violet-500/5'}`}>⏱ {formatted}</div>
    </div>

    <div className="grid lg:grid-cols-[320px_1fr] gap-5">
      <aside className="cv-panel h-fit">
        <div className="flex justify-between items-center"><p className="font-bold">Challenge Bank</p><span className="text-xs text-[var(--cv-muted)]">{problems.length} problems</span></div>
        <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); resetArena() }} className="cv-input mt-4 text-sm">
          {problems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div className="mt-5 p-4 rounded-2xl bg-[var(--cv-surface-2)] border border-[var(--cv-border)]">
          <p className="text-xs text-[var(--cv-muted)]">Arena rules</p>
          <ul className="text-xs leading-6 mt-2 text-[var(--cv-muted)]"><li>• 45 minute session</li><li>• Run visible tests freely</li><li>• Submit against hidden tests</li><li>• Score your approach after submission</li></ul>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4"><button onClick={() => setStarted(true)} className="cv-primary-btn !py-2.5 text-xs">{started ? "Session Active" : "Start Session"}</button><button onClick={resetArena} className="cv-secondary-btn !py-2.5 text-xs">Reset</button></div>
      </aside>

      <section className="grid xl:grid-cols-2 gap-5 min-w-0">
        <div className="cv-panel min-h-[650px] overflow-y-auto">
          {problem ? <><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-black">{problem.title}</h2><DifficultyBadge difficulty={problem.difficulty}/></div><p className="text-xs text-violet-500 font-bold mt-2">{problem.topic} · {problem.estimatedTimeMinutes || 30} min</p><p className="text-sm leading-7 text-[var(--cv-muted)] mt-6 whitespace-pre-wrap">{problem.description}</p><h3 className="font-bold mt-7 mb-3">Examples</h3>{(problem.visibleTestCases || []).map((tc,i)=><div key={i} className="rounded-xl bg-[var(--cv-surface-2)] border border-[var(--cv-border)] p-3 mb-3 text-xs"><p className="text-[var(--cv-muted)]">Input</p><pre className="mt-1 overflow-x-auto">{tc.input}</pre><p className="text-[var(--cv-muted)] mt-2">Output</p><pre className="mt-1 overflow-x-auto">{tc.expectedOutput}</pre></div>)}</> : <p className="text-[var(--cv-muted)]">Select a challenge.</p>}
        </div>
        <div className="cv-code-window min-h-[650px] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--cv-border)] flex items-center justify-between"><span className="text-xs text-[var(--cv-muted)]">Main.java · Java</span><span className="text-xs text-cyan-500 font-bold">● ARENA</span></div>
          <div className="flex-1 min-h-[420px]"><Editor height="100%" language="java" theme="vs-dark" value={code} onChange={(v) => setCode(v || "")} options={{minimap:{enabled:false},fontSize:14,automaticLayout:true}}/></div>
          <div className="p-3 border-t border-[var(--cv-border)] flex flex-wrap gap-2"><button disabled={!started || busy} onClick={() => run(false)} className="cv-secondary-btn !py-2.5 text-xs">{busy ? "Running..." : "▶ Run Tests"}</button><button disabled={!started || busy || submitted} onClick={() => run(true)} className="cv-primary-btn !py-2.5 text-xs">{submitted ? "✓ Submitted" : "Submit Solution"}</button></div>
          {result && <div className="max-h-52 overflow-y-auto p-4 border-t border-[var(--cv-border)] bg-[var(--cv-surface-2)]">{result.compileError ? <pre className="text-xs text-red-500 whitespace-pre-wrap">{result.compileError}</pre> : <><p className={`font-bold text-sm ${result.status === 'PASSED' ? 'text-green-500' : 'text-red-500'}`}>{result.status === 'PASSED' ? '✓ All tests passed' : '✗ Tests need attention'}</p><p className="text-xs text-[var(--cv-muted)] mt-1">{result.passedTestCount}/{result.totalTestCount} tests · {result.runtimeMs}ms</p>{result.testResults?.map((tr) => <div key={tr.testNumber} className="text-xs mt-2">{tr.passed ? '✓' : '✗'} Test {tr.testNumber} {tr.hidden ? '🔒' : ''}</div>)}</>}</div>}
        </div>
      </section>
    </div>
  </div>
}
