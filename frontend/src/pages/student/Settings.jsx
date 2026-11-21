
import { useEffect, useState } from "react"
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../../api/profileApi"
import { useTheme } from "../../context/ThemeContext"

function Settings() {
  const [email, setEmail] = useState("")
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" })
  const [emailLoading, setEmailLoading] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  })
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [fontSize, setFontSize] = useState(
    localStorage.getItem("srhcodeverse_editor_fontsize") || "14"
  )
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    getProfile()
      .then((res) => setEmail(res.data.email || ""))
      .catch(() => {})
  }, [])

  const handleEmailUpdate = async (e) => {
    e.preventDefault()
    setEmailMsg({ type: "", text: "" })
    setEmailLoading(true)

    try {
      await updateProfile({ email })
      setEmailMsg({ type: "success", text: "Email updated successfully." })
    } catch (err) {
      setEmailMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update email.",
      })
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
      setPasswordMsg({
        type: "success",
        text: "Password changed successfully.",
      })
      setPasswordForm({ currentPassword: "", newPassword: "" })
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password.",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleFontSizeChange = (value) => {
    setFontSize(value)
    localStorage.setItem("srhcodeverse_editor_fontsize", value)
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-forge-500)] focus:ring-2 focus:ring-violet-500/20"

  const messageClass = (type) =>
    `mb-3 rounded-lg px-3 py-2 text-sm ${
      type === "success"
        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        : "border border-red-500/20 bg-red-500/10 text-red-400"
    }`

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-forge-500)]">
          PREFERENCES
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Manage your account and personalize your workspace.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-6">
          {/* Email settings */}
          <form
            onSubmit={handleEmailUpdate}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Email address
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Manage the email associated with your account.
              </p>
            </div>

            {emailMsg.text && (
              <p className={messageClass(emailMsg.type)} role="status">
                {emailMsg.text}
              </p>
            )}

            <label
              htmlFor="settings-email"
              className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />

            <button
              type="submit"
              disabled={emailLoading}
              className="mt-4 rounded-xl bg-[var(--color-forge-500)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-forge-600)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {emailLoading ? "Saving..." : "Save email"}
            </button>
          </form>

          {/* Password settings */}
          <form
            onSubmit={handlePasswordChange}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 shadow-sm sm:p-6"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Change password
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Choose a strong password to keep your account secure.
              </p>
            </div>

            {passwordMsg.text && (
              <p className={messageClass(passwordMsg.type)} role="status">
                {passwordMsg.text}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
                >
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className={inputClass}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="mt-5 rounded-xl bg-[var(--color-forge-500)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-forge-600)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordLoading ? "Changing..." : "Update password"}
            </button>
          </form>
        </div>

        <div className="min-w-0 space-y-6">
          {/* Appearance settings */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Appearance
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Make CodeVerse feel comfortable for you.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] p-4">
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  Color theme
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Currently using {theme === "dark" ? "Dark" : "Light"} mode
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="cv-theme-toggle shrink-0"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                <span className="text-xs">
                  {theme === "dark" ? "Dark" : "Light"}
                </span>
                <span className="cv-toggle-track">
                  <span className="cv-toggle-thumb" />
                </span>
              </button>
            </div>
          </section>

          {/* Editor preferences */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Editor preferences
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Customize the code editor text size.
              </p>
            </div>

            <label
              htmlFor="editor-font-size"
              className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Editor font size
            </label>
            <select
              id="editor-font-size"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className={inputClass}
            >
              <option value="12">12 px — Compact</option>
              <option value="14">14 px — Default</option>
              <option value="16">16 px — Comfortable</option>
              <option value="18">18 px — Large</option>
              <option value="20">20 px — Extra large</option>
            </select>
            <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
              This preference is saved in this browser.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

export default Settings
