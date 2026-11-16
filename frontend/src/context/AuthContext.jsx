import { createContext, useContext, useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { clearCache } from "../utils/cache"
import { setUnauthorizedHandler } from "../api/axiosInstance"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem("srhcodeverse_token")
    const username = localStorage.getItem("srhcodeverse_username")
    const role = localStorage.getItem("srhcodeverse_role")

    if (token && username && role) {
      setUser({ token, username, role })
    }
    setLoading(false)
  }, [])

  const login = (authResponse) => {
    clearCache()
    localStorage.setItem("srhcodeverse_token", authResponse.token)
    localStorage.setItem("srhcodeverse_username", authResponse.username)
    localStorage.setItem("srhcodeverse_role", authResponse.role)
    setUser(authResponse)
  }

  const logout = () => {
  localStorage.removeItem("srhcodeverse_token")
    localStorage.removeItem("srhcodeverse_username")
    localStorage.removeItem("srhcodeverse_role")
    clearCache()
    setUser(null)
}

  // Keep the latest logout/location available to the unauthorized handler
  // without re-registering it on every render.
  const logoutRef = useRef(logout)
  const locationRef = useRef(location)
  useEffect(() => {
    logoutRef.current = logout
    locationRef.current = location
  })

  // Centralised handling for expired or invalid sessions. The axios layer
  // clears stored credentials and the response cache, then calls this handler
  // exactly once so the UI state is reset and the user lands on the login page.
  useEffect(() => {
    return setUnauthorizedHandler(() => {
      logoutRef.current()

      const pathname = locationRef.current?.pathname ?? ""
      // Never redirect away from the login page or the OAuth callback.
      if (pathname === "/login" || pathname.startsWith("/oauth/callback")) return

      navigate("/login?reason=session-expired", { replace: true })
    })
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
