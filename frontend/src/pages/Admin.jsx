import { useState, useEffect } from "react"
import { authFetch } from "../api"

function Admin() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")

  // Fetch all bookings when the page loads
  useEffect(() => {
    const fetchBookings = async () => {
      const response = await authFetch("http://127.0.0.1:8000/api/bookings/all/")
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      } else {
        setError("Could not load bookings. Are you logged in as admin?")
      }
      setLoading(false)
    }
    fetchBookings()
  }, [])

  // Approve or cancel a booking and update the list immediately
  const updateStatus = async (id, newStatus) => {
    setActionError("")
    const response = await authFetch(`http://127.0.0.1:8000/api/bookings/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus })
    })
    if (response.ok) {
      const updated = await response.json()
      setBookings(prev => prev.map(b => b.id === id ? updated : b))
    } else {
      const data = await response.json()
      setActionError(data.error || "Could not update this booking.")
    }
  }

  // Status badge colour
  const statusStyle = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700 border-green-200"
    if (status === "cancelled") return "bg-red-100 text-red-700 border-red-200"
    return "bg-orange-100 text-orange-700 border-orange-200"
  }

  return (
    <div className="min-h-screen bg-[#EFF4FA] p-6">
      <h1 className="text-3xl font-bold text-[#003087] mb-2">Admin Panel</h1>
      <p className="text-gray-500 mb-6">Manage all room bookings across campus</p>

      {loading && <p className="text-gray-500">Loading bookings...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
          {actionError}
        </div>
      )}
      {!loading && bookings.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          No bookings yet.
        </div>
      )}

      {/* Bookings table */}
      {bookings.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#003087] text-white text-left">
                <th className="p-4">Room</th>
                <th className="p-4">User</th>
                <th className="p-4">Date</th>
                <th className="p-4">Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium text-[#003087]">{booking.room_name}</td>
                  <td className="p-4 text-gray-600">{booking.user_email}</td>
                  <td className="p-4 text-gray-600">{booking.date}</td>
                  <td className="p-4 text-gray-600">{booking.start_time} – {booking.end_time}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold border rounded-full px-3 py-1 ${statusStyle(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {/* Only show Approve button if not already approved */}
                      {booking.status !== "approved" && (
                        <button
                          onClick={() => updateStatus(booking.id, "approved")}
                          className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition"
                        >
                          Approve
                        </button>
                      )}
                      {/* Only show Cancel button if not already cancelled */}
                      {booking.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(booking.id, "cancelled")}
                          className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Admin