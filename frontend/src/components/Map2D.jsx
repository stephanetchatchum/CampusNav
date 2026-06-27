function Map2d({ rooms = [], highlightedRoom = null, onRoomClick }) {

    const roomData = [
        { code: 'SC-F2-SS', x: 50, y: 50, w: 120, h: 80, label: 'South Sudan'},
        { code: 'SC-F2-DJ', x: 200, y: 50, w: 120, h: 80, label: 'Djibouti'},
    ]

    const getAvailability = (code) => {
        const room = rooms.find(r => r.code === code)
        if (!room) return true
        return room.is_available
    }

    return (
        <div style={{ width: '100%', overflow: 'auto'}}>
            {/* the SVG canvas — think of this as the map background */}
            <svg
                viewBox="0 0 600 400"
                style={{
                    width: '100%',
                    height: 'auto',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                }}
            >
                {/* Campus outline — a simple border representing the building */}
                <rect
                    x="20" y="20" width="560" height="360"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    rx="4"
                />

                {/* Floor label */}
                <text x="30" y="45" fontSize="12" fill="#64748b">
                    Ground Floor
                </text>

                {/* Draw each room as a rectangle */}
                {roomData.map((room) => {
                    const isAvailable = getAvailability(room.code)
                    const isHighlighted = highlightedRoom === room.code

                    return (
                        <g
                        key={room.code}
                        onClick={() => onRoomClick && onRoomClick(room.code)}
                        style={{ cursor: 'pointer' }}
                        >
                        {/* room rectangle */}
                        <rect
                            x={room.x}
                            y={room.y}
                            width={room.w}
                            height={room.h}
                            // green if available, red if booked
                            fill={isAvailable ? '#dcfce7' : '#fee2e2'}
                            // thicker border if this room is highlighted (selected)
                            stroke={isHighlighted ? '#1d4ed8' : (isAvailable ? '#16a34a' : '#dc2626')}
                            strokeWidth={isHighlighted ? 3 : 1.5}
                            rx="4"
                        />

                        {/* room name text */}
                        <text
                            x={room.x + room.w / 2}
                            y={room.y + room.h / 2 - 6}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="500"
                            fill="#1e293b"
                        >
                            {room.label}
                        </text>

                        {/* availability badge text below the room name */}
                        <text
                            x={room.x + room.w / 2}
                            y={room.y + room.h / 2 + 10}
                            textAnchor="middle"
                            fontSize="10"
                            fill={isAvailable ? '#16a34a' : '#dc2626'}
                        >
                            {isAvailable ? 'Available' : 'Booked'}
                        </text>
                        </g>
                    )
                })}

                
            </svg>
        </div>
    )
}

export default Map2d