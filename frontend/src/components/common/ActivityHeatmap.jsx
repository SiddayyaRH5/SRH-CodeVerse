import { useEffect, useMemo, useState } from "react"
import { getActivity } from "../../api/activityApi"

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function getColor(count) {
  if (count === 0) return "var(--color-bg-tertiary)"
  if (count === 1) return "#166534"
  if (count <= 3) return "#15803d"
  if (count <= 6) return "#22c55e"
  return "#4ade80"
}

function ActivityHeatmap({ fetchFn }) {
  // Current year
  const year = new Date().getFullYear()

  const [days, setDays] = useState([])
  const [hovered, setHovered] = useState(null)

  // ================= FETCH ACTIVITY =================

  useEffect(() => {
    const fetcher = fetchFn || getActivity
    fetcher()
      .then((res) => {
        setDays(res.data.days || [])
      })
      .catch(() => {
        setDays([])
      })
  }, [fetchFn])

  // ================= ACTIVITY MAP =================

  const activityMap = useMemo(() => {
    const map = {}

    days.forEach((day) => {
      map[day.date] = day.count
    })

    return map
  }, [days])

  // ================= CREATE HEATMAP GRID =================

  const { weeks } = useMemo(() => {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)

    /*
      Move start backwards to Sunday
      so every week has 7 days.
    */
    const gridStart = new Date(start)

    gridStart.setDate(
      gridStart.getDate() - gridStart.getDay()
    )

    /*
      Move end forwards to Saturday
      so every week has 7 days.
    */
    const gridEnd = new Date(end)

    gridEnd.setDate(
      gridEnd.getDate() + (6 - gridEnd.getDay())
    )

    const allDays = []

    const current = new Date(gridStart)

    while (current <= gridEnd) {
      const date = new Date(current)

      const dateString =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")

      allDays.push({
        date: dateString,

        count:
          activityMap[dateString] || 0,

        month: date.getMonth(),

        dayOfWeek: date.getDay(),

        year: date.getFullYear(),
      })

      current.setDate(
        current.getDate() + 1
      )
    }

    // Split into weeks
    const result = []

    for (
      let i = 0;
      i < allDays.length;
      i += 7
    ) {
      result.push(
        allDays.slice(i, i + 7)
      )
    }

    return {
      weeks: result,
    }
  }, [activityMap, year])

  // ================= ACTIVE DAYS =================

  const activeDays = days.filter(
    (day) => day.count > 0
  ).length

  // ================= MOUSE ENTER =================

  const handleMouseEnter = (day, e) => {
    const rect =
      e.currentTarget.getBoundingClientRect()

    setHovered({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })

    e.currentTarget.style.transform =
      "scale(1.2)"
  }

  // ================= MOUSE LEAVE =================

  const handleMouseLeave = (e) => {
    setHovered(null)

    e.currentTarget.style.transform =
      "scale(1)"
  }

  // ================= RENDER =================

  return (
    <div
      className="w-full rounded-lg border p-5 relative"
      style={{
        backgroundColor:
          "var(--color-bg-secondary)",

        borderColor:
          "var(--color-border)",
      }}
    >
      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold"
          style={{
            color:
              "var(--color-text-primary)",
          }}
        >
          Activity 🔥
        </h3>

        <span
          className="text-xs"
          style={{
            color:
              "var(--color-text-secondary)",
          }}
        >
          {activeDays} active days
        </span>
      </div>

      {/* ================= HEATMAP ================= */}

      <div className="w-full overflow-x-auto">
        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "32px 1fr",

            columnGap: "8px",

            minWidth: "720px",
          }}
        >
          <div />

          {/* ================= MONTHS ================= */}

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                `repeat(${weeks.length}, 1fr)`,

              position: "relative",

              height: "20px",
            }}
          >
            {weeks.map(
              (week, weekIndex) => {
                const firstDay = week[0]

                if (!firstDay) {
                  return (
                    <div
                      key={weekIndex}
                    />
                  )
                }

                /*
                  If the first day of this week
                  belongs to previous/next year,
                  don't show a month label.
                */
                if (
                  firstDay.year !== year
                ) {
                  return (
                    <div
                      key={weekIndex}
                    />
                  )
                }

                const currentMonth =
                  firstDay.month

                const previousWeek =
                  weeks[weekIndex - 1]

                let previousMonth = null

                if (
                  previousWeek &&
                  previousWeek[0] &&
                  previousWeek[0].year === year
                ) {
                  previousMonth =
                    previousWeek[0].month
                }

                const showMonth =
                  weekIndex === 0 ||
                  currentMonth !==
                    previousMonth

                return (
                  <div
                    key={weekIndex}
                    style={{
                      position:
                        "relative",

                      fontSize:
                        "12px",

                      color:
                        "var(--color-text-secondary)",
                    }}
                  >
                    {showMonth && (
                      <span
                        style={{
                          position:
                            "absolute",

                          left: 0,

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {
                          MONTH_LABELS[
                            currentMonth
                          ]
                        }
                      </span>
                    )}
                  </div>
                )
              }
            )}
          </div>

          {/* ================= WEEKDAY LABELS ================= */}

          <div
            style={{
              display: "flex",

              flexDirection:
                "column",

              gap: "4px",
            }}
          >
            {[
              "Sun",
              "",
              "Tue",
              "",
              "Thu",
              "",
              "Sat",
            ].map(
              (label, index) => (
                <div
                  key={index}
                  style={{
                    height: "12px",

                    lineHeight:
                      "12px",

                    fontSize:
                      "12px",

                    color:
                      "var(--color-text-secondary)",
                  }}
                >
                  {label}
                </div>
              )
            )}
          </div>

          {/* ================= ACTIVITY CELLS ================= */}

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                `repeat(${weeks.length}, 1fr)`,

              gap: "4px",
            }}
          >
            {weeks.map(
              (week, weekIndex) => (
                <div
                  key={weekIndex}
                  style={{
                    display: "flex",

                    flexDirection:
                      "column",

                    gap: "4px",
                  }}
                >
                  {week.map(
                    (day) => (
                      <div
                        key={day.date}
                        style={{
                          width: "100%",

                          maxWidth:
                            "13px",

                          aspectRatio: "1",

                          borderRadius:
                            "3px",

                          backgroundColor:
                            getColor(
                              day.count
                            ),

                          cursor:
                            "pointer",

                          transition:
                            "transform 0.15s ease",
                        }}
                        onMouseEnter={(
                          e
                        ) =>
                          handleMouseEnter(
                            day,
                            e
                          )
                        }
                        onMouseLeave={
                          handleMouseLeave
                        }
                      />
                    )
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ================= LEGEND ================= */}

      <div
        className="flex items-center justify-end gap-2 mt-5"
        style={{
          fontSize: "12px",

          color:
            "var(--color-text-secondary)",
        }}
      >
        <span>
          Less
        </span>

        {[0, 1, 3, 6, 10].map(
          (count) => (
            <div
              key={count}
              style={{
                width: "13px",

                height: "13px",

                borderRadius: "3px",

                backgroundColor:
                  getColor(count),
              }}
            />
          )
        )}

        <span>
          More
        </span>
      </div>

      {/* ================= CUSTOM TOOLTIP ================= */}

      {hovered && (
        <div
          className="fixed z-50 px-2 py-1 rounded shadow-lg pointer-events-none text-xs"
          style={{
            backgroundColor:
              "var(--color-bg-tertiary)",

            border:
              "1px solid var(--color-border)",

            color:
              "var(--color-text-primary)",

            left: hovered.x,

            top:
              hovered.y - 36,

            transform:
              "translateX(-50%)",
          }}
        >
          <span className="font-medium">
            {hovered.day.count}
          </span>{" "}
          submission
          {hovered.day.count !== 1
            ? "s"
            : ""}{" "}
          on{" "}
          {hovered.day.date}
        </div>
      )}
    </div>
  )
}

export default ActivityHeatmap