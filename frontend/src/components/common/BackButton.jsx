import { ArrowLeft } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

/**
 * Consistent back-navigation control used across pages.
 *
 * - `to`: renders a React Router Link to an explicit, known-safe destination.
 * - `onClick`: renders a button and delegates to the caller.
 * - neither: falls back to browser history only when an in-app previous entry
 *   exists; otherwise navigates to `fallbackTo`.
 */
export default function BackButton({
  children = "Back",
  to,
  onClick,
  className = "",
  fallbackTo = "/",
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const classes = ["cv-back-button", className].filter(Boolean).join(" ")
  const content = (
    <>
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
      <span>{children}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  const handleClick = (event) => {
    if (onClick) {
      onClick(event)
      return
    }
    // A "default" router key means this is the first entry in the session,
    // so browser history has no valid in-app destination to return to.
    if (location.key && location.key !== "default") {
      navigate(-1)
    } else {
      navigate(fallbackTo)
    }
  }

  return (
    <button type="button" className={classes} onClick={handleClick}>
      {content}
    </button>
  )
}
