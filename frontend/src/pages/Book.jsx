import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { authHeaders } from "../api"

// Rooms confirmed NOT bookable by students — staff offices, pods, and
// shared/public spaces. Confirmed with Stephane, July 2026.
const NOT_STUDENT_BOOKABLE = new Set([
  'Administration',
  'Bibi Titi',        // pod
  'Congo',            // staff office
  'Elevator',
  'Fab Lab Gallery',
  'Food Court',
  'Gabon',            // staff office
  'Guinea',           // pod
  'Leadership Center',
  'POD',
  'Prayer Room',
  'Reception',
  'Resource Center',
  'Sahel',            // pod
  'Staff Work Hive',
  'Vendors',
  'Washrooms',
  'Wellness Center',
])

function Book() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [searchParams] = useSearchParams()

  const bookingFormRef = useRef(null)

  useEffect(() => {
    if (selectedRoom && bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedRoom])

  // Fetch all rooms from the real API when the page loads
  useEffect(() => {
    const fetchRooms = async () => {
      const response = await fetch("http://127.0.0.1:8000/api/rooms/")
      const data = await response.json()
      // Only show rooms students are actually allowed to book
      const bookable = data.filter(r => !NOT_STUDENT_BOOKABLE.has(r.name))
      setRooms(bookable)
      setLoading(false)

      // If arriving from the map with ?room=CODE in the URL, automatically
      // select that room so the booking form opens right away
      const preSelectedCode = searchParams.get('room')
      if (preSelectedCode) {
        const match = bookable.find(r => r.code === preSelectedCode)
        if (match) {
          setSelectedRoom(match)
        }
      }
    }
    fetchRooms()
  }, [])

  const handleBooking = async () => {
    // Basic validation before sending to backend
    if (!date || !startTime || !endTime) {
      setErrorMsg("Please fill in all fields.")
      return
    }
    if (startTime >= endTime) {
      setErrorMsg("End time must be after start time.")
      return
    }

    setSubmitting(true)
    setErrorMsg("")
    setSuccessMsg("")

    const response = await fetch("http://127.0.0.1:8000/api/bookings/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        room: selectedRoom.id,
        date: date,
        start_time: startTime,
        end_time: endTime,
      })
    })

    const data = await response.json()
    setSubmitting(false)

    if (response.ok) {
      setSuccessMsg(`Booking submitted for ${selectedRoom.name} on ${date}! Status: Pending approval.`)
      setSelectedRoom(null)
      setDate("")
      setStartTime("")
      setEndTime("")
    } else {
      setErrorMsg(data.error || "Booking failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF4FA] p-6">
      <h1 className="text-3xl font-bold text-[#003087] mb-2">Book a Room</h1>
      <p className="text-gray-500 mb-6">Select an available room to make a booking</p>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6">
          {successMsg}
        </div>
      )}

      {loading && <p className="text-gray-500">Loading rooms...</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => {
              setSelectedRoom(room)
              setSuccessMsg("")
              setErrorMsg("")
            }}
            className={`bg-white rounded-xl shadow p-4 cursor-pointer border-2 transition
              ${selectedRoom?.id === room.id
                ? 'border-[#003087]'
                : 'border-transparent hover:border-gray-200'}`}
          >
            <h2 className="text-lg font-semibold text-[#003087]">{room.name}</h2>
            <p className="text-gray-400 text-sm">{room.code}</p>
            <p className="text-gray-500 text-sm">Capacity: {room.capacity}</p>
            <span className={`text-sm font-bold ${room.is_available ? 'text-[#00A86B]' : 'text-[#DC2626]'}`}>
              {room.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div ref={bookingFormRef} className="mt-8 bg-white rounded-xl shadow p-6 max-w-lg">
          <h2 className="text-xl font-bold text-[#003087] mb-1">
            Booking: {selectedRoom.name}
          </h2>
          <p className="text-gray-400 text-sm mb-4">{selectedRoom.code}</p>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
              {errorMsg}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:border-[#003087]"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#003087]"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#003087]"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-[#003087] text-white rounded-lg p-3 font-semibold hover:bg-[#002060] transition disabled:opacity-50"
              onClick={handleBooking}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Confirm Booking"}
            </button>
            <button
              className="flex-1 border border-gray-300 text-gray-600 rounded-lg p-3 font-semibold hover:bg-gray-50 transition"
              onClick={() => setSelectedRoom(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Book