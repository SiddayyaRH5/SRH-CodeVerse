/**
 * Click-to-play poster for lesson videos. Shows course-specific artwork at a
 * true 16:9 ratio with a clear play affordance and real duration only when the
 * lesson supplies it. The actual video URL is untouched and is loaded on click.
 */
export default function LessonPoster({ poster, title, durationMinutes, onPlay }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="cv-premium-poster group relative block aspect-video w-full overflow-hidden rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      aria-label={`Play lesson video: ${title}`}
    >
      {poster && (
        <img
          src={poster}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
      <span className="cv-premium-play absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white/15 text-2xl text-white backdrop-blur-md transition group-hover:scale-110">
        ▶
      </span>
      <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-left">
        <span className="line-clamp-2 text-sm font-bold text-white sm:text-base">{title}</span>
        {durationMinutes > 0 && (
          <span className="rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-white">
            {durationMinutes} min
          </span>
        )}
      </span>
    </button>
  )
}
