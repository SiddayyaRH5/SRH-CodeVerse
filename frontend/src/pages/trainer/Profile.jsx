import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"

export default function TrainerProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch the trainer profile from the API
    // For demo purposes, we'll use the authenticated user
    setProfile(user)
    setLoading(false)
  }, [])

  if (loading) return <div className="cv-panel animate-pulse h-64" />

  if (!profile) return <p className="text-[var(--color-danger)]">Failed to load profile</p>

  return (
    <div className="cv-trainer-profile cv-page cv-premium-page">
      <div className="flex flex-col lg:flex-row justify-between gap-5 items-start lg:items-end">
        <div>
          <p className="cv-kicker">PROFILE</p>
          <h1 className="text-4xl sm:text-5xl font-black mt-2">Trainer Profile</h1>
          <p className="text-[var(--cv-muted)] mt-3 max-w-2xl">
            Your trainer profile and course management dashboard.
          </p>
        </div>
        <div className="cv-pill">👤 {user?.displayName || "Trainer"}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-8">
        <div className="cv-profile-card cv-panel overflow-hidden rounded-lg border border-[var(--cv-border)] p-4">
          <h3 className="text-lg font-bold">Courses Taught</h3>
          <p className="text-[var(--cv-muted)]">Courses assigned to this trainer</p>
        </div>
        <div className="cv-profile-card cv-panel overflow-hidden rounded-lg border border-[var(--cv-border)] p-4">
          <h3 className="text-lg font-bold">Students</h3>
          <p className="text-[var(--cv-muted)]">Learners under this trainer's guidance</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[var(--cv-muted)]">
          Complete profile details and course management settings are available in the trainer dashboard.
        </p>
      </div>
    </div>
  )
}