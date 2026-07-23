import { useState, useEffect } from "react"
import { authFetch } from "../api"

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    const fetchBookings = async () => {
      const response = await authFetch("http://127.0.0.1:8000/api/bookings/mine/")
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

  const statusColor = (status) => {
    if (status === "approved") return "text-[#00A86B] bg-green-50 border-green-200"
    if (status === "cancelled") return "text-[#DC2626] bg-red-50 border-red-200"
    return "text-[#F5821F] bg-orange-50 border-orange-200"
  }

  const isPast = (booking) => new Date(`${booking.date}T${booking.end_time}`) < new Date()

  const handleCancel = async (id) => {
    setCancellingId(id)
    const response = await authFetch(`http://127.0.0.1:8000/api/bookings/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" })
    })
    if (response.ok) {
      const updated = await response.json()
      setBookings(prev => prev.map(b => b.id === id ? updated : b))
    }
    setCancellingId(null)
  }

  return (
    <div className="p-8 bg-[#EFF4FA] min-h-screen">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">My Bookings</h1>

      {loading && <p className="text-gray-500">Loading your bookings...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && bookings.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          You have no bookings yet.{" "}
          <a href="/book" className="text-[#003087] font-semibold hover:underline">Book a room</a>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-[#003087]">{booking.room_name}</p>
              <p className="text-gray-500 text-sm">{booking.date} · {booking.start_time} – {booking.end_time}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold border rounded-full px-4 py-1 ${statusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              {booking.status !== "cancelled" && !isPast(booking) && (
                <button
                  onClick={() => handleCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyBookings