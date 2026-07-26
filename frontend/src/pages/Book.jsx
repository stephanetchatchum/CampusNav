import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { NOT_STUDENT_BOOKABLE } from "../data/nonBookableRooms"
import { BASE_URL } from "../api"

function Book() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRooms = async () => {
      const response = await fetch(`${BASE_URL}/rooms/`)
      const data = await response.json()
      setRooms(data.filter(r => !NOT_STUDENT_BOOKABLE.has(r.name)))
      setLoading(false)
    }
    fetchRooms()
  }, [])

  return (
    <div className="min-h-screen bg-[#EFF4FA] p-6">
      <h1 className="text-3xl font-bold text-[#003087] mb-2">Book a Room</h1>
      <p className="text-gray-500 mb-6">Select a room to see availability and book a time</p>

      {loading && <p className="text-gray-500">Loading rooms...</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => navigate(`/book/${room.code}`)}
            className="bg-white rounded-xl shadow p-4 cursor-pointer border-2 border-transparent hover:border-[#003087] transition"
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
    </div>
  )
}

export default Book