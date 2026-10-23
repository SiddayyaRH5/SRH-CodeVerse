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
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="max-w-2xl">
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-forge-500)] flex items-center justify-center text-2xl font-bold text-white">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile.username}</h2>
              <span className="text-xs text-[var(--color-forge-500)] font-medium">{profile.role}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isTrainer ? (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5">
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">Problems Created</p>
              <p className="text-2xl font-bold text-[var(--color-forge-500)]">{profile.problemsCreated}</p>
            </div>
          ) : (
            <>
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">Problems Solved</p>
                <p className="text-2xl font-bold">{profile.problemsSolved}</p>
              </div>
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5">
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-[var(--color-forge-500)]">{profile.forgeStreakCurrent} 🔥</p>
              </div>
            </>
          )}
        </div>
      </div>

      {!isTrainer && (
        <div className="mt-6">
            <ActivityHeatmap />
        </div>
        )}
    </div>
  )
}

export default Profile