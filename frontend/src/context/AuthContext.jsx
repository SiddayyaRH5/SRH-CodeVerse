import { createContext, useContext, useState, useEffect } from "react"
import { clearCache } from "../utils/cache"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}