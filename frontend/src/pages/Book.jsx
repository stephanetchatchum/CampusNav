import fakeRooms from '../data/fakeRooms'

function Book() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">Book a Room</h1>
      <div className="grid grid-cols-3 gap-4">
        {fakeRooms.map(room => (
          <div key={room.id} className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold">{room.name}</h2>
            <p className="text-gray-500">{room.code}</p>
            <p className="text-gray-500">Capacity: {room.capacity}</p>
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