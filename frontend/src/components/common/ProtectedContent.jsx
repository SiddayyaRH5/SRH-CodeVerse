import { useState } from "react"

function ProtectedContent({ children, className = "" }) {
  const [showWarning, setShowWarning] = useState(false)

  const blockAction = (e) => {
    e.preventDefault()
    setShowWarning(true)
    setTimeout(() => setShowWarning(false), 4000)
  }

  return (
    <div className={`${className} select-none relative`} style={{ userSelect: "none" }}
      onCopy={blockAction} onCut={blockAction} onContextMenu={blockAction}>
      {showWarning && (
        <div className="absolute top-0 right-0 bg-[var(--color-forge-500)] text-white text-xs px-3 py-1 rounded z-10">
          Copying is disabled. Write every line yourself. 🔥
        </div>
      )}
      {children}
    </div>
  )
}
export default ProtectedContent