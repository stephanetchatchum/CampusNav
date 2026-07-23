import { useState, useEffect } from 'react'
import Map2D from '../components/Map2D'

function Home() {
    const [rooms, setRooms] = useState([])
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/rooms/')
        .then(res => res.json())
        .then(data => setRooms(data))
        .catch(err => console.error('Failed to fetch rooms:', err))
    }, [])

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.code.toLowerCase().includes(searchQuery.toLowerCase())
    )


    return (
        <div style={{ padding: '20px', maxWidth: "900px", margin: '0 auto' }}>
            {/* page title */}
            <h1 style={{ fontSize: '24px', fontWeight: '600',
                        color: '#1e293b', marginBottom: '16px' }}>
                CampusNav
            </h1>

            {/*Search bar at the top*/}
            <input
                type="text"
                placeholder="Search for a room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                marginBottom: '16px',
                boxSizing: 'border-box'
                }}
            />

            {/* search results dropdown */}
            {searchQuery && (
                <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '16px',
                background: 'white'
                }}>
                {filteredRooms.length === 0 ? (
                    <p style={{ padding: '12px 16px', color: '#64748b' }}>
                    No rooms found
                    </p>
                ) : (
                    filteredRooms.map(room => (
                    <div
                        key={room.code}
                        onClick={() => {
                        setSelectedRoom(room.code)
                        setSearchQuery('')
                        }}
                        style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                        }}
                    >
                        <span style={{ fontWeight: '500' }}>{room.name}</span>
                        <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        background: room.is_available ? '#dcfce7' : '#fee2e2',
                        color: room.is_available ? '#16a34a' : '#dc2626'
                        }}>
                        {room.is_available ? 'Available' : 'Booked'}
                        </span>
                    </div>
                    ))
                )}
                </div>
            )}

            {/* 2D map */}
            <Map2D
                rooms={rooms}
                highlightedRoom={selectedRoom}
                onRoomClick={(code) => setSelectedRoom(code)}
            />

            {/* selected room info panel */}
            {selectedRoom && (
                <div style={{
                marginTop: '16px',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
                }}>
                {(() => {
                    const room = rooms.find(r => r.code === selectedRoom)
                    if (!room) return null
                    return (
                    <>
                        <h2 style={{ fontSize: '18px', fontWeight: '600',
                                    marginBottom: '8px' }}>
                        {room.name}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Code: {room.code} · Floor: {room.floor} ·
                        Building: {room.building} · Capacity: {room.capacity}
                        </p>
                        <span style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        background: room.is_available ? '#dcfce7' : '#fee2e2',
                        color: room.is_available ? '#16a34a' : '#dc2626'
                        }}>
                        {room.is_available ? 'Available now' : 'Currently booked'}
                        </span>
                    </>
                    )
                })()}
                </div>
            )}

        </div>
    )
}

export default Home