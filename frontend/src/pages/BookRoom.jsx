import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { authFetch, BASE_URL, canBook, canSeeAvailability } from "../api"
import { NOT_STUDENT_BOOKABLE } from "../data/nonBookableRooms"
import DayTimeline from "../components/DayTimeline"

function pad(n) {
  return n.toString().padStart(2, "0")
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTime12(t) {
  if (!t) return ""
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  return `${hour12}:${pad(m)} ${ampm}`
}

const selectClass =
  "min-h-11 rounded-lg border border-slate-300 bg-white px-2 focus:border-[#003087] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003087]/30"

function TimePicker({ value, onChange, label }) {
  const parse = (v) => {
    if (!v) return { hour12: "", minute: "", ampm: "AM" }
    const [h, m] = v.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    let hour12 = h % 12
    if (hour12 === 0) hour12 = 12
    return { hour12: pad(hour12), minute: pad(m), ampm }
  }

  const { hour12, minute, ampm } = parse(value)

  const emit = (h12, m, ap) => {
    if (!h12 || m === "") return
    let h = parseInt(h12, 10) % 12
    if (ap === "PM") h += 12
    onChange(`${pad(h)}:${pad(parseInt(m, 10))}`)
  }

  const hourOptions = Array.from({ length: 12 }, (_, i) => pad(i + 1))
  const minuteOptions = Array.from({ length: 60 }, (_, i) => pad(i))

  return (
    <div className="flex gap-1.5">
      <select aria-label={`${label} hour`} value={hour12} onChange={e => emit(e.target.value, minute || "00", ampm)} className={selectClass}>
        <option value="">HH</option>
        {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <select aria-label={`${label} minute`} value={minute} onChange={e => emit(hour12 || "12", e.target.value, ampm)} className={selectClass}>
        <option value="">MM</option>
        {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select aria-label={`${label} AM or PM`} value={ampm} onChange={e => emit(hour12 || "12", minute || "00", e.target.value)} className={selectClass}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

function Notice({ children, action, onAction }) {
  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <p className="text-slate-700">{children}</p>
      <button
        onClick={onAction}
        className="mt-5 min-h-12 rounded-lg bg-[#003087] px-6 font-semibold text-white hover:bg-[#002060] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F]"
      >
        {action}
      </button>
    </div>
  )
}

function BookRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const today = formatDateInput(new Date())

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(today)
  const [bookedSlots, setBookedSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const fetchRoom = async () => {
      const response = await fetch(`${BASE_URL}/rooms/`)
      const data = await response.json()
      setRoom(data.find(r => r.code === code) || null)
      setLoading(false)
    }
    fetchRoom()
  }, [code])

  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true)
    setErrorMsg("")
    const response = await authFetch(
      `${BASE_URL}/bookings/room/${code}/?date=${date}`
    )
    if (response.ok) {
      const data = await response.json()
      const sorted = [...data.booked_slots].sort((a, b) => a.start_time.localeCompare(b.start_time))
      setBookedSlots(sorted)
    } else {
      setBookedSlots([])
    }
    setLoadingSlots(false)
  }, [code, date])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const changeDay = (delta) => {
    const [y, m, d] = date.split("-").map(Number)
    const current = new Date(y, m - 1, d)
    current.setDate(current.getDate() + delta)
    const next = formatDateInput(current)
    if (next < today) return
    setDate(next)
  }

  const overlapsExisting = () => {
    const start = `${startTime}:00`
    const end = `${endTime}:00`
    return bookedSlots.some(b => start < b.end_time && end > b.start_time)
  }

  const handleBooking = async () => {
    setErrorMsg("")
    setSuccessMsg("")

    if (!startTime || !endTime) {
      setErrorMsg("Please choose both a start and end time.")
      return
    }
    if (startTime >= endTime) {
      setErrorMsg("End time must be after start time.")
      return
    }
    if (new Date(`${date}T${startTime}`) < new Date()) {
      setErrorMsg("You can't book a time slot in the past.")
      return
    }
    if (overlapsExisting()) {
      setErrorMsg("That time overlaps with an existing booking. Check the booked times above.")
      return
    }

    setSubmitting(true)

    const response = await authFetch(`${BASE_URL}/bookings/`, {
      method: "POST",
      body: JSON.stringify({ room: room.id, date, start_time: startTime, end_time: endTime })
    })

    const data = await response.json()
    setSubmitting(false)

    if (response.ok) {
      setSuccessMsg(`Booked ${room.name} on ${date}, ${formatTime12(startTime)} to ${formatTime12(endTime)}. Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}.`)
      setStartTime("")
      setEndTime("")
      fetchSlots()
    } else {
      setErrorMsg(data.error || "Booking failed. Please try again.")
    }
  }

  const handleCancelSlot = async (bookingId) => {
    setCancellingId(bookingId)
    const response = await authFetch(`${BASE_URL}/bookings/${bookingId}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" })
    })

    if (response.ok) {
      setSuccessMsg("Booking cancelled. This time is free again.")
      fetchSlots()
    }
    setCancellingId(null)
  }

  if (loading) return <div className="p-8 text-slate-500">Loading room...</div>

  if (!room) {
    return (
      <Notice action="Back to rooms" onAction={() => navigate("/book")}>
        We couldn't find that room. It may have been removed or the link is wrong.
      </Notice>
    )
  }

  if (!canSeeAvailability()) {
    return (
      <Notice action="Sign in" onAction={() => navigate("/login")}>
        Availability is for the ALU community. Sign in with your ALU email to see it.
      </Notice>
    )
  }

  if (NOT_STUDENT_BOOKABLE.has(room.name)) {
    return (
      <Notice action="Back to rooms" onAction={() => navigate("/book")}>
        This room can't be booked by students.
      </Notice>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-gradient-to-b from-[#C9D8F2] via-[#E6EDF9] to-[#F4F7FB] px-4 pb-6 pt-5">
      <button
        onClick={() => navigate("/book")}
        className="min-h-11 text-[#003087] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F]"
      >
        Back to rooms
      </button>

      <h1 className="mt-1 text-3xl font-semibold text-[#0F1B33]">{room.name}</h1>
      <p className="mt-1 text-slate-600">
        {room.building}, floor {room.floor}. Seats {room.capacity}. Room code {room.code}.
      </p>

      {successMsg && (
        <div role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200">
          {successMsg}
        </div>
      )}

      <section className="mt-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => changeDay(-1)}
            disabled={date <= today}
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Previous day
          </button>
          <input
            type="date"
            aria-label="Choose a date"
            value={date}
            min={today}
            onChange={e => e.target.value >= today && setDate(e.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 px-2 focus:border-[#003087] focus:outline-none"
          />
          <button
            onClick={() => changeDay(1)}
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50"
          >
            Next day
          </button>
        </div>

        <h2 className="mb-2 mt-6 font-semibold text-[#0F1B33]">
          {date === today ? "Today" : date}
        </h2>

        {loadingSlots ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            <DayTimeline slots={bookedSlots} isToday={date === today} />
            {bookedSlots.length === 0 ? (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                Nothing booked. The room is free all day.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {bookedSlots.map((slot, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-red-50 p-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200"
                  >
                    <span>
                      {formatTime12(slot.start_time.slice(0, 5))} to {formatTime12(slot.end_time.slice(0, 5))}
                      {slot.is_mine && <span className="ml-2 text-xs font-semibold text-[#003087]">Your booking</span>}
                    </span>
                    {slot.is_mine && canBook() && (
                      <button
                        onClick={() => handleCancelSlot(slot.booking_id)}
                        disabled={cancellingId === slot.booking_id}
                        className="min-h-9 px-2 text-xs font-semibold text-red-800 hover:text-red-950 disabled:opacity-50"
                      >
                        {cancellingId === slot.booking_id ? "Cancelling..." : "Cancel booking"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {canBook() ? (
        <section className="mt-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-[#0F1B33]">Book this room</h2>

          {errorMsg && (
            <div role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
              {errorMsg}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <span className="mb-1 block text-sm font-medium text-slate-700">Start time</span>
              <TimePicker label="Start" value={startTime} onChange={setStartTime} />
            </div>
            <div className="flex-1">
              <span className="mb-1 block text-sm font-medium text-slate-700">End time</span>
              <TimePicker label="End" value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={submitting}
            className="mt-5 min-h-12 w-full rounded-lg bg-[#003087] font-semibold text-white transition hover:bg-[#002060] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5821F] disabled:opacity-50"
          >
            {submitting ? "Booking..." : "Confirm booking"}
          </button>
        </section>
      ) : (
        <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
          You can check availability here. Booking is for current students and staff.
        </p>
      )}
    </div>
  )
}

export default BookRoom