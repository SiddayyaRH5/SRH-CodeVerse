/** Consistent section header used across the premium pages. */
export default function PremiumSection({ eyebrow, title, description, id, className = "", children }) {
  return (
    <section id={id} className={`cv-premium-section ${className}`}>
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        {(eyebrow || title || description) && (
          <header className="mb-8 max-w-3xl">
            {eyebrow && <span className="cv-premium-eyebrow">{eyebrow}</span>}
            {title && <h2 className="cv-premium-title mt-4">{title}</h2>}
            {description && <p className="cv-premium-lead mt-3">{description}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
