import { forwardRef } from "react"

/**
 * Consistent page container.
 *
 * Provides the standard max-width, horizontal padding and vertical rhythm used
 * across every SRH CodeVerse page. Use this instead of ad-hoc
 * `max-w-7xl px-4 py-8` wrappers so spacing stays predictable.
 */
const PageContainer = forwardRef(function PageContainer(
  { as: Component = "div", className = "", children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
})

export default PageContainer
