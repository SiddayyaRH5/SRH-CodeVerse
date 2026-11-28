import { useState } from "react"
import { Link } from "react-router-dom"
import { PASSWORD_RESET_UNAVAILABLE, requestPasswordReset } from "../../api/passwordApi"
import { ArrowLeft } from "lucide-react"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    const trimmed = email.trim()
    if (!trimmed) {
      setError("Enter the email address you use for CodeVerse.")
      return
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.")
      return
    }

    setError("")
    setLoading(true)

    try {
      await requestPasswordReset(trimmed)
      setSubmitted(true)
    } catch (err) {
      if (err?.code === PASSWORD_RESET_UNAVAILABLE) {
        setUnavailable(true)
      } else {
        setError(
          err?.response?.data?.message ||
            "We couldn't start a password reset right now. Please try again shortly.",
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="cv-auth-forgot cv-premium-page cv-auth-page relative overflow-hidden">
      <div className="cv-hero-orb cv-orb-purple" aria-hidden="true" />
      <div className="cv-hero-orb cv-orb-cyan" aria-hidden="true" />

      <div className="cv-auth-shell relative z-10">
        <section className="cv-auth-form-side min-w-0">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-400 font-black text-white shadow-lg">
                {"</>"}
              </span>
              <span className="leading-none">
                <b className="block">SRH</b>
                <b className="cv-brand-gradient block">CodeVerse</b>
              </span>
            </Link>

            <span className="text-sm text-[var(--cv-muted)]">
              Remembered it?{" "}
              <Link to="/login" className="font-bold text-violet-500 transition hover:text-cyan-400">
                Back to login
              </Link>
            </span>
          </div>

          <div className="mx-auto w-full max-w-md min-w-0">
            <p className="cv-kicker">PASSWORD RESET</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Reset your <span className="cv-gradient-text">password.</span>
            </h1>
            <p className="mt-3 leading-6 text-[var(--cv-muted)]">
              Enter the email address linked to your CodeVerse account and we&apos;ll send you a
              reset link.
            </p>

            {unavailable ? (
              <div
                role="status"
                className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300"
              >
                <p className="font-semibold">Password reset is not available yet.</p>
                <p className="mt-1 leading-6">
                  The SRH CodeVerse backend does not expose a password-reset endpoint at the
                  moment, so no email was sent. Please contact an administrator to reset your
                  password, or sign in with a different account.
                </p>
              </div>
            ) : submitted ? (
              <div
                role="status"
                className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
              >
                <p className="font-semibold">Reset requested.</p>
                <p className="mt-1 leading-6">
                  If an account exists for {email.trim()}, a password reset link has been sent.
                  Check your inbox for the next steps.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="forgot-password-email"
                    className="mb-2 block text-sm font-medium text-[var(--cv-muted)]"
                  >
                    Email address
                  </label>
                  <input
                    id="forgot-password-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (error) setError("")
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={loading}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={error ? "forgot-password-error" : undefined}
                    className="cv-input block w-full min-w-0 !py-3.5"
                  />
                </div>

                {error && (
                  <div
                    id="forgot-password-error"
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="cv-primary-btn flex w-full items-center justify-center gap-2 !py-4 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                        aria-hidden="true"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send reset link <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-7 text-center text-xs text-[var(--cv-muted)]">
              <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-violet-500 transition hover:text-cyan-400">
                <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
                Return to login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ForgotPassword
