import { useEffect, useState } from "react"
import CodeEditor from "../../components/editor/CodeEditor"

const starter = `public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to SRH CodeVerse!");
    }
}`

const STORAGE_KEY = "srh-cv-playground"

export default function Playground() {
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? starter
    } catch {
      return starter
    }
  })

  const [saved, setSaved] = useState(false)
  const [status, setStatus] = useState("")

  const lineCount = code.split("\n").length
  const characterCount = code.length

  useEffect(() => {
    if (!saved) return

    const timeout = window.setTimeout(() => setSaved(false), 1800)
    return () => window.clearTimeout(timeout)
  }, [saved])

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, code)
      setSaved(true)
      setStatus("Your draft has been saved in this browser.")
    } catch {
      setSaved(false)
      setStatus("Could not save your draft. Check your browser storage settings.")
    }
  }

  const reset = () => {
    const confirmed = window.confirm(
      "Reset the editor to the starter Java code? Your current draft will be replaced."
    )

    if (!confirmed) return

    setCode(starter)
    setSaved(false)
    setStatus("Starter code restored. Save Draft to store this version.")
  }

  const clearEditor = () => {
    if (!code) return

    if (!window.confirm("Clear all code from the editor?")) return

    setCode("")
    setSaved(false)
    setStatus("Editor cleared.")
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setStatus("Code copied to clipboard.")
    } catch {
      setStatus("Clipboard access is unavailable in this browser.")
    }
  }

  return (
    <div className="cv-page mx-auto w-full max-w-[1500px] space-y-7">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="cv-kicker flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            ZERO-PRESSURE PRACTICE
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Code Playground
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            Experiment with Java, explore your ideas, and save useful snippets
            before taking on a coding challenge.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="cv-secondary-btn"
          >
            â†º Reset
          </button>

          <button
            type="button"
            onClick={clearEditor}
            className="cv-secondary-btn"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={save}
            className="cv-primary-btn"
          >
            {saved ? "✓ Saved" : "Save Draft"}
          </button>
        </div>
      </header>

      {/* Helpful reminders */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--color-bg-secondary)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            LANGUAGE
          </p>
          <p className="mt-2 text-sm font-semibold">â˜• Java</p>
        </div>

        <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--color-bg-secondary)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            LINES OF CODE
          </p>
          <p className="mt-2 text-sm font-semibold">{lineCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--color-bg-secondary)] p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            CHARACTERS
          </p>
          <p className="mt-2 text-sm font-semibold">
            {characterCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Editor window */}
      <section className="cv-code-window min-w-0 overflow-hidden rounded-2xl border border-[var(--cv-border)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cv-border)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>

            <span className="text-sm font-semibold">Main.java</span>
            <span className="rounded-md bg-violet-500/10 px-2 py-1 text-[10px] font-bold tracking-wider text-violet-500">
              JAVA
            </span>
          </div>

          <button
            type="button"
            onClick={copyCode}
            className="rounded-lg border border-[var(--cv-border)] px-3 py-1.5 text-xs font-medium transition hover:opacity-75"
          >
            Copy code
          </button>
        </div>

        <div className="relative min-h-[480px]">
          <CodeEditor
            height="480px"
            value={code}
            theme="vs-dark"
            onChange={(value) => {
              setCode(value)
              setSaved(false)
              setStatus("")
            }}
            options={{
              fontSize: 14,
              wordWrap: "off",
              scrollBeyondLastLine: false,
              tabSize: 4,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--cv-border)] px-4 py-3 text-xs text-[var(--cv-muted)] sm:px-5">
          <span>Java source Â· Main.java</span>
          <span>{lineCount} lines Â· {characterCount} characters</span>
        </div>
      </section>

      {/* Status and usage notes */}
      {status && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl border border-[var(--cv-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-secondary)]"
        >
          {status}
        </p>
      )}

      <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--color-bg-secondary)] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="text-xl" aria-hidden="true">ðŸ’¡</span>
          <div>
            <h2 className="text-sm font-semibold">Your personal coding space</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
              Drafts are saved in this browser when you select Save Draft.
              They are not automatically synchronized across browsers or
              devices. This playground edits code only; use the Problems
              workspace for server-side execution and test cases.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

