import { useState, useEffect } from "react"
import { getProfile } from "../../api/profileApi"
import { useAuth } from "../../context/AuthContext"
import ActivityHeatmap from "../../components/common/ActivityHeatmap"

function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[var(--color-text-secondary)]">Loading profile...</p>
  if (error) return <p className="text-[var(--color-danger)]">{error}</p>

  const isTrainer = profile.role === "TRAINER"

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-forge-500)]">YOUR SPACE</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Your coding journey, progress, and activity in one place.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <section className="min-w-0 lg:col-span-2">
        <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-violet-900/20">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile.username}</h2>
              <span className="text-xs text-[var(--color-forge-500)] font-medium">{profile.role}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 border-t border-[var(--color-border)] pt-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[var(--color-text-secondary)]">Email</p>
              <p>{profile.email}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)]">Joined</p>
              <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isTrainer ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-sm">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Problems Created</p>
              <p className="text-2xl font-bold text-[var(--color-forge-500)]">{profile.problemsCreated}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-sm">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">Problems Solved</p>
                <p className="text-2xl font-bold">{profile.problemsSolved}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-sm">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-[var(--color-forge-500)]">{profile.forgeStreakCurrent} 🔥</p>
              </div>
            </>
          )}
        </div>
        </section>

        {!isTrainer && (
          <section className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 shadow-sm sm:p-6 lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="text-lg font-bold">Activity</h2><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Your consistency, one day at a time.</p></div>
            </div>
            <div className="w-full min-w-0 overflow-x-auto pb-2"><div className="min-w-[760px]"><ActivityHeatmap /></div></div>
          </section>
        )}
      </div>
    </main>
  )
}

export default Profile