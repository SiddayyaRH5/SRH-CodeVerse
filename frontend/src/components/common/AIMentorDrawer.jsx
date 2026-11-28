import { useEffect, useRef, useState } from "react"
import { Bot, CircleAlert, RotateCcw, Send, Sparkles, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useMentorContext } from "../../context/useMentorContext"
import { analyzeCode } from "../../utils/mentorGuidance"

const QUICK_ACTIONS = [
  ["Explain problem", "concept"],
  ["Give me a hint", "hint"],
  ["Debug my code", "debug"],
  ["Time complexity", "optimize"],
]

/**
 * Global mentor entry point. There is no AI backend configured in this build,
 * so replies are derived locally from the current problem/code/result. The UI
 * keeps a pending/error contract so a real secure backend can replace the
 * local adapter without changing the interface.
 */
export default function AIMentorDrawer() {
  const { user } = useAuth()
  const { context } = useMentorContext()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [lastQuestion, setLastQuestion] = useState("")
  const inputRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    inputRef.current?.focus()
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const buildReply = (question, mode) => {
    const analysis = analyzeCode(context.code || "", context.problem || null, context.result || null)
    const prefix = mode === "debug" && context.result?.compileError
      ? "Start with the compiler error. "
      : mode === "optimize"
        ? "Correctness first, then optimize. "
        : ""
    const tips = analysis.tips.length ? ` ${analysis.tips.join(" ")}` : ""
    return `${prefix}${analysis.title}. ${analysis.body}${tips}`
  }

  const send = (question, mode = "hint") => {
    const text = (question || input).trim()
    if (!text) return
    setError("")
    setLastQuestion(text)
    setMessages((current) => [...current, { id: `${Date.now()}-u`, role: "user", text }])
    setInput("")
    setPending(true)
    try {
      // Local adapter. No network call, no key, no fake AI response.
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-m`, role: "mentor", text: buildReply(text, mode) },
      ])
    } catch {
      setError("Local guidance could not be generated. Please try again.")
    } finally {
      setPending(false)
    }
  }

  const retry = () => {
    if (lastQuestion) send(lastQuestion)
  }

  if (!user) return null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Code Mentor"
        aria-expanded={open}
        className="cv-mentor-fab"
      >
        <Bot size={22} strokeWidth={2} aria-hidden="true" />
        <span className="cv-mentor-fab-dot" aria-hidden="true" />
      </button>

      {open && (
        <aside className="cv-mentor-drawer" role="dialog" aria-modal="false" aria-label="AI Code Mentor">
          <header className="cv-mentor-drawer-header">
            <span className="cv-mentor-icon"><Sparkles size={18} strokeWidth={2} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold">AI Code Mentor</h2>
              <p className="text-[11px] text-[var(--cv-muted)]">Local contextual guidance</p>
            </div>
            <button type="button" onClick={close} aria-label="Close AI Code Mentor" className="cv-icon-btn">
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          <div className="cv-mentor-drawer-body" aria-live="polite">
            <p className="cv-mentor-bubble cv-mentor-bubble--mentor">
              Ask about your current problem, code or last submission. Guidance is generated locally from your work.
            </p>
            {messages.map((message) => (
              <p
                key={message.id}
                className={`cv-mentor-bubble cv-mentor-bubble--${message.role}`}
              >
                {message.text}
              </p>
            ))}
            {pending && <p className="text-xs text-[var(--cv-muted)]">Preparing guidance…</p>}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400" role="alert">
                <span className="inline-flex items-center gap-1.5"><CircleAlert size={14} aria-hidden="true" /> {error}</span>
                <button type="button" onClick={retry} className="mt-2 inline-flex items-center gap-1 font-bold underline">
                  <RotateCcw size={12} aria-hidden="true" /> Retry
                </button>
              </div>
            )}
          </div>

          <div className="cv-mentor-drawer-actions">
            {QUICK_ACTIONS.map(([label, mode]) => (
              <button key={mode} type="button" className="cv-mentor-mode" onClick={() => send(label, mode)}>
                {label}
              </button>
            ))}
          </div>

          <div className="cv-mentor-drawer-input">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  send(input)
                }
              }}
              rows={2}
              aria-label="Message the AI Code Mentor"
              placeholder="Ask a question… Enter to send, Shift+Enter for a new line"
              className="cv-input !min-h-[64px] !py-2 !text-xs"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || pending}
              aria-label="Send message"
              className="cv-toolbar-button cv-toolbar-button--primary inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} strokeWidth={2} aria-hidden="true" />
              Send
            </button>
          </div>
          <p className="cv-mentor-notice px-4 pb-4">
            No AI service is connected in this deployment. No API keys are used and the mentor never runs or submits code.
          </p>
        </aside>
      )}
    </>
  )
}
