import { ArrowLeft, ArrowRight } from "lucide-react"

/**
 * Card-style previous/next lesson navigation. The caller owns navigation
 * logic; this component only renders the controls and their disabled states.
 */
export default function LessonNav({
  previous,
  next,
  onPrevious,
  onNext,
}) {
  const hasPrevious = Boolean(previous)
  const hasNext = Boolean(next)

  return (
    <div className="cv-lesson-nav">
      <button
        type="button"
        disabled={!hasPrevious}
        onClick={onPrevious}
        className="cv-lesson-nav-card"
      >
        <span className="cv-lesson-nav-label">
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          Previous lesson
        </span>
        <span className="cv-lesson-nav-title">
          {hasPrevious ? previous : "No previous lesson"}
        </span>
      </button>

      <button
        type="button"
        disabled={!hasNext}
        onClick={onNext}
        className="cv-lesson-nav-card cv-lesson-nav-next"
      >
        <span className="cv-lesson-nav-label">
          Next lesson
          <ArrowRight size={15} strokeWidth={2} className="cv-lesson-nav-icon" aria-hidden="true" />
        </span>
        <span className="cv-lesson-nav-title">
          {hasNext ? next : "You are at the last lesson"}
        </span>
      </button>
    </div>
  )
}
