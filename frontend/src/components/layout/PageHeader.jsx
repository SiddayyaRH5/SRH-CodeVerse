/**
 * Consistent page header.
 *
 * Renders a kicker, title, optional description and an actions slot. Keeps
 * heading sizes and spacing identical across pages.
 */
function PageHeader({
  kicker,
  title,
  description,
  actions,
  className = "",
}) {
  return (
    <header className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}>
      <div className="min-w-0">
        {kicker && (
          <p className="cv-kicker">{kicker}</p>
        )}
        {title && (
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        )}
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cv-muted)]">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  )
}

export default PageHeader
