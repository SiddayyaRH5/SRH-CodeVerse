import { Component } from "react"

/**
 * Catches render-time errors anywhere in its subtree and shows a branded
 * fallback instead of a blank screen.
 *
 * Diagnostics are logged to the console but never include tokens, passwords or
 * any other sensitive value.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.handleRetry = this.handleRetry.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(previousProps) {
    const { resetKeys } = this.props
    if (!this.state.error || !resetKeys) return

    const previous = previousProps.resetKeys ?? []
    const current = resetKeys ?? []
    const changed = current.length !== previous.length || current.some((key, index) => key !== previous[index])
    if (changed) this.handleRetry()
  }

  componentDidCatch(error, errorInfo) {
    // Never log tokens, passwords or request bodies.
    console.error("SRH CodeVerse render error:", {
      name: error?.name,
      message: error?.message,
      componentStack: errorInfo?.componentStack,
    })
  }

  handleRetry() {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const title = this.props.title ?? "Something went wrong"
    const description =
      this.props.description ??
      "This part of CodeVerse could not be displayed. The rest of the app is still available."

    return (
      <div className="cv-auth-page relative overflow-hidden">
        <div className="cv-hero-orb cv-orb-purple" aria-hidden="true" />
        <div className="cv-hero-orb cv-orb-cyan" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 font-black text-white shadow-lg">
            {"</>"}
          </span>

          <p className="cv-kicker mt-8">SRH CODEVERSE</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--cv-muted)]">{description}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="cv-primary-btn !px-5 !py-2.5 text-sm"
            >
              Try again
            </button>
            <a href="/" className="cv-secondary-btn !px-5 !py-2.5 text-sm">
              Return to home
            </a>
          </div>

          {this.props.showDetails !== false && (
            <details className="mt-8 w-full text-left">
              <summary className="cursor-pointer text-xs text-[var(--cv-muted)]">
                Technical details
              </summary>
              <pre className="mt-3 max-h-48 overflow-auto rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 text-left text-xs text-[var(--cv-muted)]">
                {String(error?.message || "Unknown error")}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
