/** Consistent premium page header used across module pages. */
export default function PremiumPageHeader({ kicker, title, description, actions, children }) {
  return (
    <header className="cv-premium-header cv-premium-fade-in">
      <div className="min-w-0">
        {kicker && <span className="cv-premium-eyebrow">{kicker}</span>}
        {title && <h1 className="cv-premium-title mt-3">{title}</h1>}
        {description && <p className="cv-premium-lead mt-3">{description}</p>}
        {children}
      </div>
      {actions && <div className="cv-premium-header-actions">{actions}</div>}
    </header>
  )
}
