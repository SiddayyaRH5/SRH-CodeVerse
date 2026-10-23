import { useMemo, useState } from "react"

function analyzeCode(code = "", problem = null, result = null) {
  const normalized = code.toLowerCase()
  const signals = []
  const tips = []

  if (!code.trim()) {
    return {
      title: "Start with a small plan",
      body: "Write the simplest approach you can describe in 2–3 sentences, then turn that plan into code.",
      tips: ["Identify the input and output first.", "Choose the data structure before writing the loop.", "Handle one example manually before coding."],
    }
  }

  if (normalized.includes("system.out.println")) signals.push("You are using console output, which is useful for quick debugging.")
  if (normalized.includes("hashmap") || normalized.includes("hashset")) signals.push("A hash-based collection is present; check whether its lookup complexity matches the problem.")
  if (normalized.includes("for ") || normalized.includes("while ")) signals.push("You have an iteration step; trace the loop with the smallest and largest input cases.")
  if (normalized.includes("nested") || (normalized.match(/for\s*\(/g) || []).length > 1) tips.push("Check whether the nested iteration can be reduced with a map, set, two pointers, or sorting.")
  if (normalized.includes("==") && normalized.includes("string")) tips.push("For Java strings, prefer .equals(...) for value comparison rather than ==.")
  if (normalized.includes("scanner")) tips.push("If the judge expects exact input parsing, confirm that you consume whitespace/newlines consistently.")
  if (!normalized.includes("public static void main")) tips.push("For a standalone Java solution, confirm that the required main entry point is present.")

  if (result?.status === "FAILED") {
    tips.unshift("Your latest submission has failing tests. Start with the first failed visible case and compare expected vs actual output.")
  }
  if (result?.status === "COMPILE_ERROR" || result?.compileError) {
    tips.unshift("Fix compilation before optimizing. Read the first compiler message carefully; later messages may be cascading errors.")
  }
  if (result?.status === "PASSED") {
    tips.unshift("Nice work — all tests passed. Now review time complexity and whether the solution is easy to maintain.")
  }

  if (problem?.difficulty === "HARD") tips.push("For a hard problem, write down the invariant or recurrence before attempting optimization.")
  if (problem?.topic) tips.push(`Focus on the core ${problem.topic} concept before reaching for a more complex solution.`)
  if (!tips.length) tips.push("Trace the solution on an empty input, one-element input, and a boundary case.")

  return {
    title: signals[0] || "Your approach is taking shape",
    body: signals.slice(1).join(" ") || "Keep the implementation simple first. Once it is correct, inspect complexity and edge cases.",
    tips: [...new Set(tips)].slice(0, 4),
  }
}

export default function AICodeMentor({ code, problem, result }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState("hint")
  const [question, setQuestion] = useState("")
  const [asked, setAsked] = useState("")
  const analysis = useMemo(() => analyzeCode(code, problem, result), [code, problem, result])

  const answer = mode === "hint"
    ? analysis
    : mode === "debug"
      ? {
          title: result?.compileError ? "Start with the compiler error" : result?.status === "FAILED" ? "Start with the first failing test" : "Run a focused edge-case check",
          body: result?.compileError || (result?.status === "FAILED" ? "Compare the first failed test's expected output with your actual output. Avoid changing multiple parts at once." : "Try empty input, duplicate values, maximum values, and a case where the answer is already obvious."),
          tips: analysis.tips,
        }
      : mode === "optimize"
        ? {
            title: "Optimization checklist",
            body: "Correctness comes first. Then look for repeated work inside loops, unnecessary object creation, and data structures that can improve lookup time.",
            tips: ["Estimate time complexity.", "Estimate extra space.", "Look for repeated searches or conversions.", "Keep the optimized version readable."],
          }
        : {
            title: "Concept coach",
            body: problem?.topic ? `Your current problem is about ${problem.topic}. Explain the idea in your own words before coding; that is the fastest way to build durable understanding.` : "Explain the approach aloud before coding. If you can explain it clearly, the implementation usually becomes much easier.",
            tips: ["Define the invariant.", "Write one worked example.", "Identify the edge case that can break the approach."],
          }

  const submitQuestion = () => {
    if (!question.trim()) return
    setAsked(question.trim())
    setQuestion("")
  }

  return (
    <div className="mt-5 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] via-[var(--cv-surface)] to-cyan-500/[0.05] overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-4 text-left hover:bg-violet-500/[0.04] transition">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg">✦</span>
          <div><p className="font-bold text-sm">AI Code Mentor</p><p className="text-[11px] text-[var(--cv-muted)]">Hints, debugging and optimization guidance</p></div>
        </div>
        <span className="text-violet-500">{open ? "⌃" : "⌄"}</span>
      </button>
      {open && <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {[['hint','💡 Hint'],['debug','🐛 Debug'],['optimize','⚡ Optimize'],['concept','📚 Explain']].map(([value,label]) => <button key={value} onClick={() => setMode(value)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${mode === value ? 'bg-violet-600 text-white border-violet-600' : 'border-[var(--cv-border)] text-[var(--cv-muted)] hover:border-violet-400'}`}>{label}</button>)}
        </div>
        <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4">
          <p className="font-semibold text-sm">{answer.title}</p>
          <p className="text-xs leading-5 text-[var(--cv-muted)] mt-2">{answer.body}</p>
          <ul className="mt-3 space-y-2">{answer.tips.map((tip, i) => <li key={i} className="text-xs text-[var(--cv-muted)] flex gap-2"><span className="text-cyan-500">•</span>{tip}</li>)}</ul>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitQuestion()} className="cv-input !py-2.5 !text-xs" placeholder="Ask: why does my loop fail on duplicates?" />
          <button onClick={submitQuestion} className="cv-primary-btn !px-4 !py-2.5 text-xs">Ask</button>
        </div>
        {asked && <div className="mt-3 rounded-xl bg-[var(--cv-surface-2)] p-3 text-xs"><b>You asked:</b> {asked}<p className="text-[var(--cv-muted)] mt-1">Mentor tip: break the question into the smallest failing case, inspect the relevant state change, then test one hypothesis at a time.</p></div>}
        <p className="text-[10px] text-[var(--cv-subtle)] mt-3">CodeVerse Mentor is designed to guide your reasoning instead of handing you a full solution.</p>
      </div>}
    </div>
  )
}
