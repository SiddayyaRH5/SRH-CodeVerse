import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { exchangeOAuthCode } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

function isAuthResponse(value) {
  return value
    && typeof value.token === "string"
    && value.token.length > 0
    && typeof value.username === "string"
    && value.username.length > 0
    && typeof value.role === "string"
    && value.role.length > 0
}

function OAuthCallback() {
  const [error, setError] = useState("")
  const hasStartedRef = useRef(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    let code
    try {
      const callbackUrl = new URL(window.location.href)
      code = callbackUrl.searchParams.get("code")

      if (callbackUrl.searchParams.has("code")) {
        callbackUrl.searchParams.delete("code")
        const remainingQuery = callbackUrl.searchParams.toString()
        const cleanUrl = `${callbackUrl.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${callbackUrl.hash}`
        window.history.replaceState(window.history.state, "", cleanUrl)
      }
    } catch {
      setError("We couldn't complete sign-in. Please return to the login page and try again.")
      return
    }

    if (!code || !code.trim()) {
      setError("This sign-in link is missing its code. Please return to the login page and try again.")
      return
    }

    const completeSignIn = async () => {
      try {
        const response = await exchangeOAuthCode(code)
        if (!response.ok) {
          setError(response.status === 400 || response.status === 401
            ? "This sign-in link is invalid or expired. Please return to the login page and try again."
            : "We couldn't complete sign-in. Please return to the login page and try again.")
          return
        }

        let authResponse
        try {
          authResponse = await response.json()
        } catch {
          setError("We couldn't complete sign-in. Please return to the login page and try again.")
          return
        }

        if (!isAuthResponse(authResponse)) {
          setError("We couldn't complete sign-in. Please return to the login page and try again.")
          return
        }

        login(authResponse)
        navigate(
          authResponse.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard",
          { replace: true },
        )
      } catch {
        setError("We couldn't reach the sign-in service. Please return to the login page and try again.")
      }
    }

    void completeSignIn()
  }, [login, navigate])

  return (
    <main className="cv-auth-callback cv-premium-page flex min-h-[60vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-8 text-center shadow-xl">
        {error ? (
          <>
            <h1 className="text-2xl font-bold">Sign-in couldn't be completed</h1>
            <p className="mt-3 text-sm text-[var(--cv-muted)]" role="alert">{error}</p>
            <Link
              to="/login"
              className="cv-primary-btn mt-6 inline-flex justify-center"
            >
              Return to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Completing sign-in</h1>
            <p className="mt-3 text-sm text-[var(--cv-muted)]" role="status" aria-live="polite">
              Please wait while we securely sign you in...
            </p>
          </>
        )}
      </section>
    </main>
  )
}

export default OAuthCallback
