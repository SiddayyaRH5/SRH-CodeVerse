import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getDashboard } from "../../api/dashboardApi"
import DifficultyBadge from "../../components/common/DifficultyBadge"
import {
  getBookmarks, toggleBookmark, getNotes, saveNote, getWeeklyGoal, setWeeklyGoal
} from "../../utils/srhStudy"

function FocusTimer() {
  const [mode, setMode] = useState("focus")
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false)
          setMode((current) => current === "focus" ? "break" : "focus")
          return mode === "focus" ? 5 * 60 : 25 * 60
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [running, mode])

  const reset = () => {
    setRunning(false)
    setSeconds(mode === "focus" ? 25 * 60 : 5 * 60)
  }

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0")
  const secs = String(seconds % 60).padStart(2, "0")

  return (
    <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-semibold">Focus Forge ⏱️</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">25-minute deep-work sessions</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-forge-500)]/10 text-[var(--color-forge-500)]">
          {mode === "focus" ? "FOCUS" : "BREAK"}
        </span>
      </div>
      <div className="text-5xl font-mono font-bold text-center py-5 tracking-wider">{minutes}:{secs}</div>
      <div className="flex justify-center gap-2">
        <button onClick={() => setRunning((v) => !v)} className="px-4 py-2 rounded-lg bg-[var(--color-forge-500)] text-white text-sm font-semibold">
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-sm">
          Reset
        </button>
      </div>
    </section>
  )
}

function StudyHub() {
  const [bookmarks, setBookmarks] = useState(getBookmarks())
  const [notes, setNotes] = useState(getNotes())
  const [selectedNote, setSelectedNote] = useState(null)
  const [noteText, setNoteText] = useState("")
  const [goal, setGoal] = useState(getWeeklyGoal())
  const [solved, setSolved] = useState(0)

  useEffect(() => {
    getDashboard().then((res) => setSolved(res.data?.problemsSolved || 0)).catch(() => {})
    const refresh = () => {
      setBookmarks(getBookmarks())
      setNotes(getNotes())
    }
    window.addEventListener("srh-bookmarks-changed", refresh)
    window.addEventListener("srh-notes-changed", refresh)
    return () => {
      window.removeEventListener("srh-bookmarks-changed", refresh)
      window.removeEventListener("srh-notes-changed", refresh)
    }
  }, [])

  const noteCount = Object.keys(notes).length
  const goalProgress = Math.min(100, Math.round((solved / Math.max(goal, 1)) * 100))
  const snippets = useMemo(() => [
    ["Two Pointer", "int left = 0, right = arr.length - 1;\nwhile (left < right) {\n    // compare and move pointers\n}"],
    ["HashMap Frequency", "Map<Integer, Integer> freq = new HashMap<>();\nfor (int value : arr) {\n    freq.merge(value, 1, Integer::sum);\n}"],
    ["Binary Search", "int low = 0, high = arr.length - 1;\nwhile (low <= high) {\n    int mid = low + (high - low) / 2;\n    // update low/high based on condition\n}"],
  ], [])

  const openNote = (problemId) => {
    setSelectedNote(problemId)
    setNoteText(getNotes()[String(problemId)] || "")
  }

  const saveCurrentNote = () => {
    if (selectedNote == null) return
    saveNote(selectedNote, noteText)
    setNotes(getNotes())
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-forge-500)] font-semibold">SRH Learning Suite</p>
        <h1 className="text-3xl font-bold mt-1">Study Hub 🚀</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Your private workspace for focused coding practice.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <FocusTimer />
        <section className="lg:col-span-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold">Weekly Forge Goal 🎯</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Keep a realistic target and build consistency.</p>
            </div>
            <select value={goal} onChange={(e) => { const v = Number(e.target.value); setGoal(v); setWeeklyGoal(v) }}
              className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              {[3,5,7,10,14].map((v) => <option key={v} value={v}>{v} problems</option>)}
            </select>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span>{Math.min(solved, goal)} / {goal} target</span>
            <span className="text-[var(--color-forge-500)] font-semibold">{goalProgress}%</span>
          </div>
          <div className="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-forge-500)] rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-3">Tip: pair one Easy problem with one Medium problem during each focused session.</p>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-semibold">Saved Problems 🔖</h2><p className="text-xs text-[var(--color-text-secondary)]">{bookmarks.length} bookmarked</p></div>
            <Link to="/problems" className="text-xs text-[var(--color-forge-500)] hover:underline">Browse problems →</Link>
          </div>
          {bookmarks.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)] py-6 text-center">Bookmark problems you want to revisit.</p> :
            <div className="space-y-2 max-h-72 overflow-auto">
              {bookmarks.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                  <Link to={`/problems/${p.id}`} className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{p.topic} · {p.estimatedTimeMinutes} min</p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={p.difficulty} />
                    <button onClick={() => toggleBookmark(p)} className="text-lg" title="Remove bookmark">★</button>
                  </div>
                </div>
              ))}
            </div>}
        </section>

        <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="mb-4"><h2 className="font-semibold">Problem Notes 📝</h2><p className="text-xs text-[var(--color-text-secondary)]">{noteCount} saved notes · stored privately in your browser</p></div>
          {bookmarks.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)] py-6 text-center">Open a problem and use Notes to capture your approach.</p> :
            <div className="space-y-2 max-h-72 overflow-auto">
              {bookmarks.map((p) => (
                <button key={p.id} onClick={() => openNote(p.id)} className="w-full text-left p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] hover:border-[var(--color-forge-500)]">
                  <div className="flex justify-between gap-2"><span className="text-sm font-medium truncate">{p.title}</span><span>{notes[String(p.id)] ? "✓" : "＋"}</span></div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{notes[String(p.id)] ? notes[String(p.id)].slice(0, 90) : "Add your approach, mistakes, or key insight."}</p>
                </button>
              ))}
            </div>}
        </section>
      </div>

      {selectedNote != null && (
        <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-forge-500)]/40 rounded-xl p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Note for {bookmarks.find((p) => String(p.id) === String(selectedNote))?.title}</h2>
            <button onClick={() => setSelectedNote(null)} className="text-xs text-[var(--color-text-secondary)]">Close</button>
          </div>
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={5}
            placeholder="Write your approach, edge cases, mistakes, or what you learned..."
            className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg p-3 text-sm resize-y focus:outline-none focus:border-[var(--color-forge-500)]" />
          <div className="flex justify-end mt-3"><button onClick={saveCurrentNote} className="px-4 py-2 bg-[var(--color-forge-500)] text-white rounded-lg text-sm font-semibold">Save Note</button></div>
        </section>
      )}

      <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="mb-4"><h2 className="font-semibold">Java Quick Snippets ⚡</h2><p className="text-xs text-[var(--color-text-secondary)]">Small patterns for revision — not full solutions.</p></div>
        <div className="grid md:grid-cols-3 gap-3">
          {snippets.map(([name, code]) => (
            <div key={name} className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]"><span className="text-sm font-medium">{name}</span>
                <button onClick={() => navigator.clipboard?.writeText(code)} className="text-xs text-[var(--color-forge-500)]">Copy</button>
              </div>
              <pre className="p-3 text-xs overflow-auto font-mono text-[var(--color-text-secondary)]">{code}</pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default StudyHub
