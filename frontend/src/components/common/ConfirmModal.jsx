import { useEffect, useId, useRef } from "react"

/**
 * Shared confirmation dialog.
 *
 * Used for destructive or irreversible actions. Provides an accessible
 * dialog role, Escape-to-cancel, initial focus on the confirm button, and a
 * loading state that prevents duplicate submissions.
 */
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = true,
  loading = false,
  confirmDisabled = false,
}) {
  const titleId = useId()
  const messageId = useId()
  const confirmRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    confirmRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        event.stopPropagation()
        onCancel?.()
        return
      }

      if (event.key !== "Tab") return

      // Keep focus inside the dialog.
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => {
        if (!loading) onCancel?.()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="mb-2 text-lg font-semibold">
          {title}
        </h2>
        {message && (
          <p id={messageId} className="mb-6 text-sm text-[var(--color-text-secondary)]">
            {message}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "bg-[var(--color-danger)] hover:opacity-90"
                : "bg-[var(--color-forge-500)] hover:bg-[var(--color-forge-600)]"
            }`}
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
              />
            )}
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
