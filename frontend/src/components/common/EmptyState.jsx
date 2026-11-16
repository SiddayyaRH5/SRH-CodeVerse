import { Link } from "react-router-dom"

/**
 * A single, consistent empty state used across list, table and panel screens.
 *
 * It never renders placeholder records — only an honest explanation and, when
 * supplied, a real action the user can take.
 */
function EmptyState({
  icon = "{}",
  title,
  description,
  actionLabel,
  actionTo,
  action,
  className = "",
}) {
  const resolvedAction = action ?? (
    actionTo && actionLabel ? (
      <Link
        to={actionTo}
        className="cv-primary-btn !px-4 !py-2.5 text-sm"
      >
        {actionLabel}
      </Link>
    ) : null
  )

  return (
    <div className={`px-6 py-14 text-center ${className}`}>
      <div
        aria-hidden="true"
        className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--cv-surface-2)] font-mono text-lg font-black text-[var(--cv-subtle)]"
      >
        {icon}
      </div>

      <h2 className="mt-5 text-lg font-bold">{title}</h2>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--cv-muted)]">
          {description}
        </p>
      )}

      {resolvedAction && <div className="mt-6 flex justify-center">{resolvedAction}</div>}
    </div>
  )
}

export default EmptyState
