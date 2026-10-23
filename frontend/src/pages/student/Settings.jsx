import { useState } from "react"
import { getProfile, updateProfile, changePassword } from "../../api/profileApi"
import { useEffect } from "react"
import { useTheme } from "../../context/ThemeContext"

function Settings() {
  const [email, setEmail] = useState("")
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" })
  const [emailLoading, setEmailLoading] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" })
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [fontSize, setFontSize] = useState(localStorage.getItem("srhcodeverse_editor_fontsize") || "14")
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    getProfile().then((res) => setEmail(res.data.email)).catch(() => {})
  }, [])

  const handleEmailUpdate = async (e) => {
    e.preventDefault()
    setEmailMsg({ type: "", text: "" })
    setEmailLoading(true)
    try {
      await updateProfile({ email })
      setEmailMsg({ type: "success", text: "Email updated." })
    } catch (err) {
      setEmailMsg({ type: "error", text: err.response?.data?.message || "Failed to update email" })
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordMsg({ type: "", text: "" })
    setPasswordLoading(true)
    try {
      await changePassword(passwordForm)
      setPasswordMsg({ type: "success", text: "Password changed successfully." })
      setPasswordForm({ currentPassword: "", newPassword: "" })
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.response?.data?.message || "Failed to change password" })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleFontSizeChange = (value) => {
    setFontSize(value)
    localStorage.setItem("srhcodeverse_editor_fontsize", value)
  }

  const inputClass =
    "w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-forge-500)]"

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Email */}
      <form onSubmit={handleEmailUpdate} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3">Email</h2>
        {emailMsg.text && (
          <p className={`text-sm mb-2 ${emailMsg.type === "success" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
            {emailMsg.text}
          </p>
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
        <button
          type="submit"
          disabled={emailLoading}
          className="mt-3 bg-[var(--color-forge-500)] hover:bg-[var(--color-forge-600)] text-white text-sm px-4 py-2 rounded disabled:opacity-50"
        >
          {emailLoading ? "Saving..." : "Save Email"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordChange} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        {passwordMsg.text && (
          <p className={`text-sm mb-2 ${passwordMsg.type === "success" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
            {passwordMsg.text}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <button
          type="submit"
          disabled={passwordLoading}
          className="mt-3 bg-[var(--color-forge-500)] hover:bg-[var(--color-forge-600)] text-white text-sm px-4 py-2 rounded disabled:opacity-50"
        >
          {passwordLoading ? "Changing..." : "Change Password"}
        </button>
      </form>

      <section className="cv-panel mb-6">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Appearance</h2><p className="text-sm text-[var(--cv-muted)] mt-1">Switch between the clean Light theme and cinematic Dark theme.</p></div>
          <button type="button" onClick={toggleTheme} className="cv-theme-toggle" aria-label="Toggle theme">
            <span className="text-xs">{theme === "dark" ? "Dark" : "Light"}</span><span className="cv-toggle-track"><span className="cv-toggle-thumb" /></span>
          </button>
        </div>
      </section>

    </div>
  )
}

export default Settings