import { useCallback, useEffect, useState } from "react"
import { getProfile } from "../../api/profileApi"
import PageContainer from "../../components/layout/PageContainer"
import PageHeader from "../../components/layout/PageHeader"
import EmptyState from "../../components/common/EmptyState"
import { SkeletonCards } from "../../components/common/Skeleton"
import ActivityHeatmap from "../../components/common/ActivityHeatmap"

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getProfile()
      setProfile(response.data)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  if (loading) {
    return (
      <main className="cv-page">
        <PageContainer>
          <SkeletonCards count={3} />
        </PageContainer>
      </main>
    )
  }

  if (error) {
    return (
      <main className="cv-page">
        <PageContainer>
          <EmptyState
            icon="!"
            title={error}
            description="Please check your connection and try again."
            actionLabel="Try again"
            action={loadProfile}
            className="max-w-md mx-auto mt-20"
          />
        </PageContainer>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="cv-page">
        <PageContainer>
          <EmptyState
            icon=""
            title="Profile not found"
            description="Your profile could not be loaded."
            actionLabel="Try again"
            action={loadProfile}
            className="max-w-md mx-auto mt-20"
          />
        </PageContainer>
      </main>
    )
  }

  const isTrainer = profile.role === "TRAINER"

  return (
    <main className="cv-page">
      <PageContainer>
        <PageHeader
          kicker="YOUR SPACE"
          title="Profile"
          description="Your coding journey, progress, and activity in one place."
        />

        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--cv-primary)]">YOUR SPACE</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1>
            <p className="mt-2 text-sm text-[var(--cv-muted)]">Your coding journey, progress, and activity in one place.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <section className="min-w-0 lg:col-span-2">
            <div className="mb-6 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-violet-900/20">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{profile.username}</h2>
                  <span className="text-xs text-[var(--cv-forge-500)] font-medium">{profile.role}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 border-t border-[var(--cv-border)] pt-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[var(--cv-text-secondary)]">Email</p>
                  <p>{profile.email}</p>
                </div>
                <div>
                  <p className="text-[var(--cv-text-secondary)]">Joined</p>
                  <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isTrainer ? (
                <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 shadow-sm">
                  <p className="text-sm text-[var(--cv-text-secondary)] mb-1">Problems Created</p>
                  <p className="text-2xl font-bold text-[var(--cv-forge-500)]">{profile.problemsCreated}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 shadow-sm">
                    <p className="text-sm text-[var(--cv-text-secondary)] mb-1">Problems Solved</p>
                    <p className="text-2xl font-bold">{profile.problemsSolved}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 shadow-sm">
                    <p className="text-sm text-[var(--cv-text-secondary)] mb-1">Current Streak</p>
                    <p className="text-2xl font-bold text-[var(--cv-forge-500)]">{profile.forgeStreakCurrent} 🔥</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {!isTrainer && (
            <section className="min-w-0 rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 shadow-sm sm:p-6 lg:col-span-3">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div><h2 className="text-lg font-bold">Activity</h2><p className="mt-1 text-sm text-[var(--cv-muted)]">Your consistency, one day at a time.</p></div>
              </div>
              <div className="w-full min-w-0 overflow-x-auto pb-2"><div className="min-w-[760px]"><ActivityHeatmap /></div></div>
            </section>
          )}
        </div>
      </PageContainer>
    </main>
  )
}