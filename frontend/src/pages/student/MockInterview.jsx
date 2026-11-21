import { useEffect, useMemo, useState } from "react"

const BANK = {
  Java: [
    ["What is the difference between == and .equals() in Java?", ["== compares references for objects, while equals() can compare values.", "Both always compare values.", "equals() only works for primitives.", "== is used only for strings."], 0],
    ["Which collection gives average O(1) key lookup?", ["ArrayList", "HashMap", "LinkedList", "TreeSet"], 1],
    ["What is method overloading?", ["Same method name with different parameters", "Same method in different classes only", "Changing a variable type", "Overriding a final method"], 0],
  ],
  DSA: [
    ["What is the average time complexity of binary search on a sorted array?", ["O(n)", "O(log n)", "O(n log n)", "O(1)"], 1],
    ["Which structure is ideal for BFS?", ["Stack", "Queue", "Heap", "Set"], 1],
    ["What is the typical complexity of HashSet membership?", ["O(1) average", "O(n²)", "O(log n) always", "O(n log n) always"], 0],
  ],
  SQL: [
    ["Which clause filters grouped rows?", ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], 2],
    ["Which JOIN keeps all rows from the left table?", ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"], 1],
    ["What does COUNT(*) count?", ["Only non-null IDs", "Rows", "Columns", "Distinct values only"], 1],
  ],
  "Spring Boot": [
    ["Which annotation marks a class as a REST controller?", ["@Entity", "@Service", "@RestController", "@Repository"], 2],
    ["What is dependency injection used for?", ["Hard-code dependencies", "Provide required collaborators to a class", "Create database tables", "Compile Java faster"], 1],
    ["Which layer commonly owns business rules?", ["Controller", "Service", "DTO", "Repository"], 1],
  ],
  React: [
    ["What hook stores local component state?", ["useState", "useMemo", "useRef only", "useRoute"], 0],
    ["What is a controlled input?", ["An input whose value is driven by React state", "An input with no events", "A server-only input", "A CSS component"], 0],
    ["Why use a key when rendering a list?", ["Help React identify list items", "Encrypt data", "Create CSS", "Fetch API data"], 0],
  ],
  HR: [
    ["Tell me about a project you are proud of.", ["Use STAR: situation, task, action, result", "Only describe the technology names", "Give a one-word answer", "Skip the result"], 0],
    ["How do you handle a bug you cannot immediately solve?", ["Reproduce, isolate, inspect evidence, test one hypothesis at a time", "Change everything at once", "Ignore it", "Delete the feature"], 0],
    ["Why should a team hire you as a fresher?", ["Connect your skills, projects, learning ability and examples", "Say you need no training", "Only discuss salary", "Avoid project examples"], 0],
  ],
}

export default function MockInterview() {
  const [category, setCategory] = useState("Java")
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [seconds, setSeconds] = useState(15 * 60)
  const questions = BANK[category]
  const finished = index >= questions.length
  const score = useMemo(() => questions.length ? Math.round((questions.reduce((sum, q, i) => sum + (answers[i] === q[2] ? 1 : 0), 0) / questions.length) * 100) : 0, [answers, questions])

  useEffect(() => {
    if (!started || finished || seconds <= 0) return
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [started, finished, seconds])

  const begin = () => { setStarted(true); setIndex(0); setAnswers({}); setSeconds(15 * 60) }
  const choose = (option) => setAnswers((a) => ({ ...a, [index]: option }))
  const next = () => setIndex((i) => i + 1)
  const reset = () => { setStarted(false); setIndex(0); setAnswers({}); setSeconds(15 * 60) }
  const time = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`

  return <div className="cv-page">
    <div className="flex flex-wrap justify-between items-end gap-4"><div><p className="cv-kicker">INTERVIEW PREP</p><h1 className="text-4xl font-black mt-2">Mock Interview Studio</h1><p className="text-[var(--cv-muted)] mt-2 max-w-2xl">Practice a focused technical round, track your score and learn where to improve.</p></div>{started && !finished && <div className="font-mono text-xl font-black text-violet-500">⏱ {time}</div>}</div>
    {!started ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-9">{Object.keys(BANK).map((name) => <button key={name} onClick={() => setCategory(name)} className={`cv-panel text-left hover:-translate-y-1 transition ${category === name ? 'border-violet-500/50 shadow-violet-500/10' : ''}`}><span className="text-3xl">{name === 'Java' ? '☕' : name === 'DSA' ? '🧠' : name === 'SQL' ? '▦' : name === 'Spring Boot' ? '🌱' : name === 'React' ? '⚛' : '🎤'}</span><h2 className="text-xl font-black mt-5">{name}</h2><p className="text-xs text-[var(--cv-muted)] mt-1">{BANK[name].length} questions · 15 min</p><div className="mt-5 text-violet-500 text-sm font-bold">Select round →</div></button>)}<div className="md:col-span-2 xl:col-span-3 cv-section-panel rounded-3xl p-7 mt-2"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold text-violet-500">SELECTED</p><h2 className="text-2xl font-black mt-1">{category} Mock Interview</h2><p className="text-sm text-[var(--cv-muted)] mt-1">{BANK[category].length} questions · timed practice · instant score</p></div><button onClick={begin} className="cv-primary-btn">Start Interview →</button></div></div></div> : finished || seconds === 0 ? <div className="cv-panel mt-9 text-center py-12"><div className="w-20 h-20 mx-auto rounded-3xl grid place-items-center bg-gradient-to-br from-violet-600 to-cyan-500 text-white text-3xl">✓</div><p className="cv-kicker mt-6">ROUND COMPLETE</p><h2 className="text-4xl font-black mt-2">{score}%</h2><p className="text-[var(--cv-muted)] mt-2">You scored {Math.round(score / 10)} / 10 readiness points in the {category} round.</p><div className="max-w-xl mx-auto grid sm:grid-cols-3 gap-3 mt-8 text-left"><div className="rounded-2xl bg-[var(--cv-surface-2)] p-4"><b>Score</b><p className="text-xs text-[var(--cv-muted)] mt-1">{score}% accuracy</p></div><div className="rounded-2xl bg-[var(--cv-surface-2)] p-4"><b>Time</b><p className="text-xs text-[var(--cv-muted)] mt-1">{seconds === 0 ? 'Time expired' : 'Completed'}</p></div><div className="rounded-2xl bg-[var(--cv-surface-2)] p-4"><b>Next step</b><p className="text-xs text-[var(--cv-muted)] mt-1">Review weak concepts</p></div></div><button onClick={reset} className="cv-primary-btn mt-8">Take Another Round</button></div> : <div className="grid lg:grid-cols-[1fr_300px] gap-5 mt-8"><section className="cv-panel"><div className="flex justify-between text-xs text-[var(--cv-muted)]"><span>Question {index + 1} / {questions.length}</span><span>{Object.keys(answers).length} answered</span></div><div className="h-2 rounded-full bg-[var(--cv-surface-2)] mt-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all" style={{width:`${((index + 1)/questions.length)*100}%`}}/></div><h2 className="text-2xl font-black mt-9 leading-tight">{questions[index][0]}</h2><div className="grid gap-3 mt-7">{questions[index][1].map((option,i) => <button key={option} onClick={() => choose(i)} className={`text-left p-4 rounded-2xl border transition ${answers[index] === i ? 'border-violet-500 bg-violet-500/10' : 'border-[var(--cv-border)] hover:border-violet-400/50 bg-[var(--cv-surface-2)]'}`}><span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-[var(--cv-surface)] mr-3 text-xs font-bold">{String.fromCharCode(65+i)}</span>{option}</button>)}</div><div className="flex justify-between mt-8"><button onClick={reset} className="cv-secondary-btn">Exit</button><button disabled={answers[index] === undefined} onClick={next} className="cv-primary-btn">{index === questions.length - 1 ? 'Finish Interview' : 'Next Question →'}</button></div></section><aside className="cv-panel h-fit"><p className="font-bold">Interview Coach</p><div className="space-y-3 mt-4 text-xs text-[var(--cv-muted)]"><div className="p-3 rounded-xl bg-[var(--cv-surface-2)]">💡 Explain your reasoning before jumping to the final answer.</div><div className="p-3 rounded-xl bg-[var(--cv-surface-2)]">🎯 For technical questions, mention complexity when relevant.</div><div className="p-3 rounded-xl bg-[var(--cv-surface-2)]">🗣️ For HR questions, use a concrete project example.</div></div></aside></div>}
  </div>
}
