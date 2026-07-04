import { useState, useEffect } from "react"
import { authHeaders } from "../api"

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Fetch the logged-in user's bookings when the page loads
    const fetchBookings = async () => {
      const response = await fetch("http://127.0.0.1:8000/api/bookings/mine/", {
        headers: authHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      } else {
        setError("Could not load your bookings. Please try again.")
      }
      setLoading(false)
    }

    fetchBookings()
  }, [])

  // Show a colour badge depending on booking status
  const statusColor = (status) => {
    if (status === "approved") return "text-[#00A86B] bg-green-50 border-green-200"
    if (status === "cancelled") return "text-[#DC2626] bg-red-50 border-red-200"
    return "text-[#F5821F] bg-orange-50 border-orange-200"  // pending
  }

  return (
    <div className="p-8 bg-[#EFF4FA] min-h-screen">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">My Bookings</h1>

      {loading && <p className="text-gray-500">Loading your bookings...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && bookings.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          You have no bookings yet.{" "}
          <a href="/book" className="text-[#003087] font-semibold hover:underline">
            Book a room
          </a>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
            <div>
              {/* Room and date info */}
              <p className="text-lg font-semibold text-[#003087]">Room {booking.room}</p>
              <p className="text-gray-500 text-sm">{booking.date} · {booking.start_time} – {booking.end_time}</p>
            </div>
            {/* Status badge */}
            <span className={`text-sm font-semibold border rounded-full px-4 py-1 ${statusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyBookings