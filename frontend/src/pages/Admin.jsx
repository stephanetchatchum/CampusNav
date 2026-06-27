import fakeRooms from '../data/fakeRooms'

function Admin() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">Admin Panel</h1>
      <table className="w-full border-collapse bg-white shadow rounded-lg">
        <thead>
          <tr className="bg-[#003087] text-white">
            <th className="p-4 text-left">Room</th>
            <th className="p-4 text-left">Code</th>
            <th className="p-4 text-left">Capacity</th>
            <th className="p-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {fakeRooms.map(room => (
            <tr key={room.id} className="border-t">
              <td className="p-4">{room.name}</td>
              <td className="p-4">{room.code}</td>
              <td className="p-4">{room.capacity}</td>
              <td className={`p-4 font-bold ${room.is_available ? 'text-[#00A86B]' : 'text-[#DC2626]'}`}>
                {room.is_available ? 'Available' : 'Unavailable'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Admin