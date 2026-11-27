/** Compact statistic card built on the shared premium surface. */
export default function PremiumStat({ label, value, hint, icon, accent = "violet" }) {
  return (
    <div className="cv-premium-stat cv-premium-surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--cv-muted)]">{label}</p>
          <p className={`cv-premium-stat-value mt-1 text-2xl font-black ${accent === "cyan" ? "text-cyan-500" : "text-violet-500"}`}>
            {value ?? "—"}
          </p>
          {hint && <p className="mt-1 text-[11px] text-[var(--cv-muted)]">{hint}</p>}
        </div>
        {icon && (
          <span className="cv-premium-stat-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-lg">
            {icon}
          </span>
        )}
      </div>
    </div>
  )
}
