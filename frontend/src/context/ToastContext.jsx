import { createContext, useContext, useState, useCallback } from "react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ toast, onClose }) {
  const colors = {
    success: "border-[var(--color-success)] text-[var(--color-success)]",
    error: "border-[var(--color-danger)] text-[var(--color-danger)]",
    info: "border-[var(--color-forge-500)] text-[var(--color-forge-500)]",
  }

  return (
    <div
      className={`bg-[var(--color-bg-secondary)] border ${colors[toast.type]} rounded-lg px-4 py-3 text-sm shadow-lg flex items-center gap-3 min-w-[240px] animate-[fadeIn_0.2s_ease]`}
    >
      <span className="flex-1 text-[var(--color-text-primary)]">{toast.message}</span>
      <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
        ✕
      </button>
    </div>
  )
}

export function useToast() {
  return useContext(ToastContext)
}