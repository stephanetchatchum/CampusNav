import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PageShell from "../components/PageShell"
import { EVENTS } from "../data/events"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function time12(t) {
  const [h, m] = t.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

function isUpcoming(ev) {
  const end = new Date(`${ev.date}T${ev.end}`)
  return end >= new Date()
}

function DateBadge({ date }) {
  const [, m, d] = date.split("-").map(Number)
  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[#003087] text-white">
      <span className="text-2xl font-semibold leading-none">{d}</span>
      <span className="mt-1 text-sm text-[#F5B97F]">{MONTHS[m - 1]}</span>
    </div>
  )
}

export default function Events() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  const upcoming = EVENTS.filter(isUpcoming).sort((a, b) =>
    `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)
  )

  useEffect(() => {
    if (!selected) return
    const onKey = (e) => e.key === "Escape" && setSelected(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected])

  return (
    <PageShell title="Events" subtitle="What's happening on campus. Tap an event for details.">
      {upcoming.length === 0 && (
        <p className="rounded-xl bg-white p-5 text-slate-600">
          No upcoming events. Check back soon.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {upcoming.map((ev) => (
          <li key={ev.id}>
            <button
              onClick={() => setSelected(ev)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003087] active:bg-slate-50"
            >
              <DateBadge date={ev.date} />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold leading-snug text-[#0F1B33]">{ev.title}</span>
                <span className="mt-0.5 block text-sm text-slate-600">
                  {time12(ev.start)} to {time12(ev.end)}
                </span>
                <span className="block text-sm text-slate-600">{ev.room}</span>
              </span>
              <span className="shrink-0 self-start rounded-full bg-[#EAF0FB] px-2.5 py-1 text-xs font-medium text-[#003087]">
                {ev.category}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-2xl rounded-t-3xl bg-white p-5 pb-8"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#003087]">{selected.title}</h2>
              <button
                onClick={() => setSelected(null)}
                className="min-h-11 shrink-0 px-2 font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-slate-700">
              {selected.date}, {time12(selected.start)} to {time12(selected.end)}
            </p>
            <p className="text-slate-700">{selected.room}</p>
            <p className="mt-4 text-slate-800">{selected.description}</p>
            <button
              onClick={() => navigate(`/?room=${selected.code}`)}
              className="mt-6 min-h-12 w-full rounded-lg bg-[#003087] font-semibold text-white hover:bg-[#002060] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F]"
            >
              Show on map
            </button>
          </div>
        </div>
      )}
    </PageShell>
  )
}