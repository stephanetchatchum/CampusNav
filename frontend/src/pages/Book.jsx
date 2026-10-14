import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { NOT_STUDENT_BOOKABLE } from "../data/nonBookableRooms"
import { BASE_URL, isLoggedIn, canSeeAvailability } from "../api"

function Gate({ loggedIn }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <h1 className="text-2xl font-semibold text-[#003087]">Rooms</h1>
      <p className="mt-3 text-slate-600">
        {loggedIn
          ? "Room availability is for the ALU community. Sign in with your ALU email to see it."
          : "Sign in with your ALU email to see which rooms are free."}
      </p>
      <button
        onClick={() => navigate("/login")}
        className="mt-6 min-h-12 rounded-lg bg-[#003087] px-6 font-semibold text-white hover:bg-[#002060] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F]"
      >
        {loggedIn ? "Switch account" : "Sign in"}
      </button>
    </div>
  )
}

export default function Book() {
  const allowed = canSeeAvailability()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [building, setBuilding] = useState("All")

  useEffect(() => {
    if (!allowed) return
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/rooms/`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setRooms(data.filter((r) => !NOT_STUDENT_BOOKABLE.has(r.name)))
      } catch {
        setError("Couldn't load rooms. Check your connection and refresh.")
      }
      setLoading(false)
    }
    load()
  }, [allowed])

  const buildings = useMemo(
    () => ["All", ...new Set(rooms.map((r) => r.building))],
    [rooms]
  )

  const visible = rooms.filter(
    (r) =>
      (building === "All" || r.building === building) &&
      r.name.toLowerCase().includes(query.trim().toLowerCase())
  )

  if (!allowed) return <Gate loggedIn={isLoggedIn()} />

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-gradient-to-b from-[#C9D8F2] via-[#E6EDF9] to-[#F4F7FB] px-4 pb-6 pt-6">
      <h1 className="text-2xl font-semibold text-[#003087]">Rooms</h1>
      <p className="mt-1 text-slate-600">
        Free or in use right now. Tap a room to see its whole day.
      </p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a room"
        aria-label="Search for a room"
        className="mt-5 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 focus:border-[#003087] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003087]/30"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {buildings.map((b) => (
          <button
            key={b}
            aria-pressed={building === b}
            onClick={() => setBuilding(b)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F] ${
              building === b
                ? "bg-[#003087] text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {loading && <p className="mt-8 text-slate-500">Loading rooms...</p>}
      {error && (
        <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="mt-8 text-slate-500">
          No rooms match "{query}". Try a shorter name or pick another building.
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2.5">
        {visible.map((room) => (
          <li key={room.id}>
            <button
              onClick={() => navigate(`/book/${room.code}`)}
              className="flex min-h-[72px] w-full overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003087] active:bg-slate-50"
            >
              <span
                className={`w-1.5 shrink-0 ${room.is_available ? "bg-emerald-500" : "bg-[#C62828]"}`}
              />
              <span className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block text-lg font-semibold text-[#0F1B33]">
                    {room.name}
                  </span>
                  <span className="block text-sm text-slate-500">
                    {room.building}, floor {room.floor}. Seats {room.capacity}.
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
                    room.is_available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {room.is_available ? "Free now" : "In use now"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}