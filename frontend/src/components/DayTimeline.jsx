const toMin = (t) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

const hourLabel = (h) => `${h % 12 || 12}${h >= 12 ? "pm" : "am"}`

// A room's day on one bar: green = free, red = booked by someone else,
// blue = booked by you, orange line = right now (today only).
export default function DayTimeline({ slots, isToday, startHour = 7, endHour = 21 }) {
  const span = (endHour - startHour) * 60
  const pct = (min) => Math.min(100, Math.max(0, ((min - startHour * 60) / span) * 100))

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const showNow = isToday && nowMin >= startHour * 60 && nowMin <= endHour * 60

  const ticks = []
  for (let h = startHour; h <= endHour; h += 2) ticks.push(h)

  const summary = slots.length === 0
    ? "Free all day"
    : `Booked ${slots.length} time${slots.length > 1 ? "s" : ""} today`

  return (
    <div className="mx-3">
      <div
        role="img"
        aria-label={summary}
        className="relative h-11 overflow-hidden rounded-md bg-emerald-50 ring-1 ring-emerald-200"
      >
        {slots.map((s, i) => {
          const left = pct(toMin(s.start_time))
          const width = pct(toMin(s.end_time)) - left
          return (
            <div
              key={i}
              className={`absolute inset-y-0 ${s.is_mine ? "bg-[#003087]" : "bg-[#C62828]"}`}
              style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
            />
          )
        })}
        {showNow && (
          <div
            className="absolute inset-y-0 w-0.5 bg-[#F5821F]"
            style={{ left: `${pct(nowMin)}%` }}
          />
        )}
      </div>

      <div className="relative mt-1 h-4 text-[11px] text-slate-500">
        {ticks.map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2"
            style={{ left: `${pct(h * 60)}%` }}
          >
            {hourLabel(h)}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-emerald-200" /> Free
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-[#C62828]" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-sm bg-[#003087]" /> Yours
        </span>
        {showNow && (
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-0.5 bg-[#F5821F]" /> Now
          </span>
        )}
      </div>
    </div>
  )
}