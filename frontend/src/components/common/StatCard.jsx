function StatCard({ label, value, accent = false }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5">
      <p className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-[var(--color-forge-500)]" : "text-[var(--color-text-primary)]"}`}>
        {value}
      </p>
    </div>
  )
}

export default StatCard