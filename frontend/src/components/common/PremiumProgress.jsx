/** Animated, accessible progress bar driven only by real backend values. */
export default function PremiumProgress({ value = 0, label, tone = "violet" }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="w-full">
      {(label !== undefined || label !== null) && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--cv-muted)]">
          {label !== undefined && label !== null && <span>{label}</span>}
          <span className="font-bold">{safe}%</span>
        </div>
      )}
      <div
        className="cv-premium-progress h-2 w-full overflow-hidden rounded-full bg-[var(--cv-surface-2)]"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === "string" ? label : "Progress"}
      >
        <span style={{ width: `${safe}%` }} className={tone === "cyan" ? "!bg-gradient-to-r !from-cyan-500 !to-blue-500" : ""} />
      </div>
    </div>
  )
}
