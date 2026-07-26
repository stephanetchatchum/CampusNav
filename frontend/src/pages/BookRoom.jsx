import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { authFetch, BASE_URL, getUserTier } from "../api"
import { NOT_STUDENT_BOOKABLE } from "../data/nonBookableRooms"

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

function TimePicker({ value, onChange }) {
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
    <div className="flex gap-2">
      <select value={hour12} onChange={e => emit(e.target.value, minute || "00", ampm)} className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#003087]">
        <option value="">HH</option>
        {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <select value={minute} onChange={e => emit(hour12 || "12", e.target.value, ampm)} className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#003087]">
        <option value="">MM</option>
        {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={ampm} onChange={e => emit(hour12 || "12", minute || "00", e.target.value)} className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#003087]">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

function BookRoom() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(formatDateInput(new Date()))
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
    setDate(formatDateInput(current))
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
      setErrorMsg("That time overlaps with an existing booking. Check the taken times above.")
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
      setSuccessMsg(`Booked ${room.name} on ${date}, ${formatTime12(startTime)}–${formatTime12(endTime)}! Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}.`)
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
      setSuccessMsg("Booking cancelled — this time slot is now free.")
      fetchSlots()
    }
    setCancellingId(null)
  }

  if (loading) return <div className="p-8 text-gray-500">Loading room...</div>

  if (!room) {
    return (
      <div className="p-8">
        <p className="text-red-500">Room not found.</p>
        <button onClick={() => navigate("/book")} className="text-[#003087] font-semibold hover:underline mt-2">← Back to all rooms</button>
      </div>
    )
  }

  if (getUserTier() === "guest") {
    return (
      <div className="p-8">
        <p className="text-red-500">Guest accounts can't book rooms. Please sign in with your ALU email.</p>
        <button onClick={() => navigate("/book")} className="text-[#003087] font-semibold hover:underline mt-2">← Back to all rooms</button>
      </div>
    )
  }

  if (NOT_STUDENT_BOOKABLE.has(room.name)) {
    return (
      <div className="p-8">
        <p className="text-red-500">This room is not available for student booking.</p>
        <button onClick={() => navigate("/book")} className="text-[#003087] font-semibold hover:underline mt-2">← Back to all rooms</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EFF4FA] p-6">
      <button onClick={() => navigate("/book")} className="text-[#003087] font-semibold hover:underline mb-4">← Back to all rooms</button>

      <h1 className="text-3xl font-bold text-[#003087] mb-1">{room.name}</h1>
      <p className="text-gray-400 mb-1">{room.code} · {room.building}, Floor {room.floor}</p>
      <p className="text-gray-500 mb-6">Capacity: {room.capacity}</p>

      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6">{successMsg}</div>}

      <div className="bg-white rounded-xl shadow p-6 max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeDay(-1)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">← Previous day</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[#003087]" />
          <button onClick={() => changeDay(1)} className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">Next day →</button>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Already booked on this date</p>
        {loadingSlots ? (
          <p className="text-gray-500 text-sm mb-6">Loading...</p>
        ) : bookedSlots.length === 0 ? (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3 mb-6">Nothing booked yet — the whole day is open.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {bookedSlots.map((slot, i) => (
              <div key={i} className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-2 text-sm font-medium flex justify-between items-center">
                <span>
                  {formatTime12(slot.start_time.slice(0, 5))} – {formatTime12(slot.end_time.slice(0, 5))}
                  {slot.is_mine && <span className="ml-2 text-xs font-semibold text-[#003087]">(You)</span>}
                </span>
                {slot.is_mine && (
                  <button
                    onClick={() => handleCancelSlot(slot.booking_id)}
                    disabled={cancellingId === slot.booking_id}
                    className="text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
                  >
                    {cancellingId === slot.booking_id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">{errorMsg}</div>}

        <p className="text-sm font-semibold text-gray-700 mb-2">Choose your own time</p>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <TimePicker value={startTime} onChange={setStartTime} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <TimePicker value={endTime} onChange={setEndTime} />
          </div>
        </div>

        <button onClick={handleBooking} disabled={submitting} className="w-full bg-[#003087] text-white rounded-lg p-3 font-semibold hover:bg-[#002060] transition disabled:opacity-50">
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  )
}

export default BookRoom