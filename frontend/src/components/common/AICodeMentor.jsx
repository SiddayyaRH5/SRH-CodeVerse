import { useMemo, useState } from "react"
import { Bot, ChevronDown, Lightbulb, Send, Sparkles } from "lucide-react"
import { analyzeCode } from "../../utils/mentorGuidance"

/**
 * Local mentoring heuristics. There is no AI service connected to this
 * deployment, so every response is derived from the actual code, problem and
 * submission result supplied by the page. Nothing is fabricated.
 */
const MODES = [
  ["hint", "Get a hint"],
  ["debug", "Debug"],
  ["optimize", "Optimize"],
  ["concept", "Explain"],
]

export default function AICodeMentor({ code, problem, result }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState("hint")
  const [question, setQuestion] = useState("")
  const [thread, setThread] = useState([])
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
    const text = question.trim()
    if (!text) return
    // Guidance stays tied to the real code/result; no answer is invented.
    setThread((current) => [
      ...current.slice(-4),
      { id: `${Date.now()}-${current.length}`, question: text, guidance: answer },
    ])
    setQuestion("")
  }

  return (
    <section className="cv-mentor mt-5">
      <button
        type="button"
        className="cv-mentor-header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-3 text-left">
          <span className="cv-mentor-icon"><Bot size={19} strokeWidth={2} aria-hidden="true" /></span>
          <span>
            <span className="block text-sm font-bold">AI Code Mentor</span>
            <span className="block text-[11px] text-[var(--cv-muted)]">Local hints, debugging and optimization guidance</span>
          </span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className={`text-violet-500 transition-transform${open ? " rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="cv-mentor-panel">
          <div className="mb-3 flex flex-wrap gap-2">
            {MODES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className="cv-mentor-mode"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="cv-mentor-message">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles size={15} strokeWidth={2} aria-hidden="true" className="text-violet-500" />
              {answer.title}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--cv-muted)]">{answer.body}</p>
            <ul className="mt-3 space-y-2">
              {answer.tips.map((tip, index) => (
                <li key={index} className="flex gap-2 text-xs text-[var(--cv-muted)]">
                  <Lightbulb size={13} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-cyan-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submitQuestion()}
              className="cv-input !min-h-[42px] !py-2 !text-xs"
              placeholder="Ask a question about your approach..."
              aria-label="Ask the mentor a question"
            />
            <button
              type="button"
              onClick={submitQuestion}
              disabled={!question.trim()}
              className="cv-toolbar-button cv-toolbar-button--primary inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} strokeWidth={2} aria-hidden="true" />
              Ask
            </button>
          </div>

          {thread.length > 0 && (
            <div className="cv-mentor-thread mt-3" aria-live="polite">
              {thread.map((item) => (
                <div key={item.id} className="space-y-2">
                  <p className="cv-mentor-bubble cv-mentor-bubble--user">{item.question}</p>
                  <p className="cv-mentor-bubble cv-mentor-bubble--mentor">
                    <strong>{item.guidance.title}.</strong> {item.guidance.tips[0] || item.guidance.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="cv-mentor-notice">
            Guidance is generated locally from your code, problem and latest result. No AI service is connected, no API keys are used, and the mentor never runs or submits code.
          </p>
        </div>
      )}
    </section>
  )
}
