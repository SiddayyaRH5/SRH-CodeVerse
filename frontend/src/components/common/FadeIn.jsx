import { useEffect, useRef, useState } from "react"

/**
 * Fade-in wrapper that respects `prefers-reduced-motion`.
 *
 * Triggers once when the element enters the viewport. Adds no layout shift:
 * the element keeps its box; only opacity changes.
 */
function FadeIn({ children, delay = 0, className = "", immediate = false }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(immediate)

  useEffect(() => {
    if (immediate) return undefined

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReduced) {
      setVisible(true)
      return undefined
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisible(true)
      return undefined
    }

    const node = ref.current
    if (!node) {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delay)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [delay, immediate])

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-500 ease-out motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default FadeIn
