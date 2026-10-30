
import { useEffect, useState } from "react"

export default function RecommendedVideos({ courseTitle, lessonTitle }) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY

  const [videos, setVideos] = useState([])
  const [activeVideo, setActiveVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchVideos() {
      if (!apiKey) {
        setError("YouTube API key is not configured.")
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")
      setVideos([])
      setActiveVideo(null)

      try {
        const params = new URLSearchParams({
          part: "snippet",
          type: "video",
          q: `${courseTitle} ${lessonTitle} tutorial practical examples`,
          maxResults: "2",
          regionCode: "IN",
          relevanceLanguage: "en",
          safeSearch: "strict",
          videoEmbeddable: "true",
          key: apiKey,
        })

        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?${params}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error?.message || "Unable to fetch YouTube videos."
          )
        }

        const results = (data.items || [])
          .filter((item) => item.id?.videoId)
          .map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            description: item.snippet.description,
            thumbnail:
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.medium?.url,
          }))

        if (!cancelled) {
          setVideos(results)
          if (results.length === 0) {
            setError("No suitable videos were found for this lesson.")
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load videos.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchVideos()

    return () => {
      cancelled = true
    }
  }, [apiKey, courseTitle, lessonTitle])

  return (
    <section className="cv-section-panel rounded-2xl p-5 sm:p-7">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl text-red-500">▶</span>
        <h2 className="text-xl font-black">
          Recommended Learning Videos
        </h2>
      </div>

      <p className="text-sm text-[var(--cv-muted)] mb-5">
        Real YouTube tutorials selected for {lessonTitle}.
      </p>

      {loading && (
        <p className="text-sm text-[var(--cv-muted)]">
          Finding relevant learning videos...
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-[var(--cv-border)] p-4">
          <p className="text-sm text-[var(--cv-muted)]">{error}</p>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
              `${courseTitle} ${lessonTitle} tutorial`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm font-bold text-violet-600"
          >
            Search YouTube instead →
          </a>
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {videos.map((video) => (
            <button
              key={video.id}
              type="button"
              onClick={() => setActiveVideo(video)}
              className={`text-left rounded-xl overflow-hidden border transition-all ${
                activeVideo?.id === video.id
                  ? "border-violet-500 ring-2 ring-violet-500/20"
                  : "border-[var(--cv-border)] hover:border-violet-500"
              }`}
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="bg-red-600 text-white rounded-full w-12 h-12 grid place-items-center text-xl">
                    ▶
                  </span>
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-sm leading-6 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-xs text-[var(--cv-muted)] mt-2">
                  {video.channel}
                </p>
                <span className="text-xs font-bold text-violet-600 mt-3 inline-block">
                  Watch video →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeVideo && (
        <div className="mt-6">
          <div className="flex justify-between items-center gap-3 mb-3">
            <h3 className="font-bold text-sm">
              Now playing: {activeVideo.title}
            </h3>
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="text-sm text-violet-600 font-bold"
            >
              Close
            </button>
          </div>

          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              key={activeVideo.id}
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1`}
              title={activeVideo.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  )
}
