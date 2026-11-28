import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

/**
 * Compact accessible selector. Uses a button + listbox pattern so option
 * presentation is consistent across platforms while keeping native keyboard
 * semantics (arrows, Home/End, Enter, Escape, Tab).
 *
 * Native <select> remains appropriate for long forms and mobile-first flows;
 * use this component for compact toolbar/filter controls.
 */
export default function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  disabled = false,
  className = "",
  placeholder = "Select...",
}) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const baseId = useId()

  const selectedIndex = options.findIndex((o) => String(o.value) === String(value))
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    const rect = rootRef.current?.getBoundingClientRect()
    if (rect) setDropUp(window.innerHeight - rect.bottom < 280 && rect.top > 280)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open || !listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex, open])

  const commit = (index) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  const handleKeyDown = (event) => {
    if (disabled || options.length === 0) return
    if (event.key === "Escape") {
      setOpen(false)
      return
    }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault()
        setOpen(true)
      }
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % options.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((i) => (i - 1 + options.length) % options.length)
    } else if (event.key === "Home") {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === "End") {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      commit(activeIndex)
    } else if (event.key === "Tab") {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`cv-select${dropUp ? " cv-select--drop-up" : ""} ${className}`.trim()}>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={open ? `${baseId}-option-${activeIndex}` : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className="cv-select-trigger"
      >
        <span className="cv-select-value">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className={`cv-select-chevron${open ? " is-open" : ""}`}
        />
      </button>

      {open && (
        <ul ref={listRef} role="listbox" aria-label={label} className="cv-select-menu">
          {options.map((option, index) => {
            const isSelected = String(option.value) === String(value)
            return (
              <li
                key={`${baseId}-option-${index}`}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                data-active={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  commit(index)
                }}
                className={`cv-select-option${isSelected ? " is-selected" : ""}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={13} strokeWidth={2} aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
