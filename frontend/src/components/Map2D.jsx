function Map2d({ rooms = [], highlightedRoom = null, onRoomClick }) {

    const roomData = [
        // ── SOCIAL COMMONS ── Floor 0
        { code: 'SC-F0-EG', x: 25,  y: 50,  w: 120, h: 60, label: 'Egypt',            building: 'Social Commons',      floor: 0 },
        { code: 'SC-F0-FC', x: 155, y: 50,  w: 100, h: 60, label: 'Food Court',        building: 'Social Commons',      floor: 0 },
        { code: 'SC-F0-WR', x: 265, y: 50,  w:  50, h: 60, label: 'Washrooms',         building: 'Social Commons',      floor: 0 },
        // ── SOCIAL COMMONS ── Floor 1
        { code: 'SC-F1-MO', x: 25,  y: 50,  w: 100, h: 60, label: 'Morocco',           building: 'Social Commons',      floor: 1 },
        { code: 'SC-F1-AL', x: 135, y: 50,  w: 100, h: 60, label: 'Algeria',           building: 'Social Commons',      floor: 1 },
        { code: 'SC-F1-FC', x: 245, y: 50,  w:  80, h: 60, label: 'Food Court',        building: 'Social Commons',      floor: 1 },
        { code: 'SC-F1-ET', x: 25,  y: 120, w: 160, h: 60, label: 'Ethiopia',          building: 'Social Commons',      floor: 1 },
        { code: 'SC-F1-WR', x: 195, y: 120, w:  50, h: 60, label: 'Washrooms',         building: 'Social Commons',      floor: 1 },
        // ── SOCIAL COMMONS ── Floor 2
        { code: 'SC-F2-VD', x: 25,  y: 50,  w:  60, h: 60, label: 'Vendors',           building: 'Social Commons',      floor: 2 },
        { code: 'SC-F2-FC', x: 95,  y: 50,  w:  80, h: 60, label: 'Food Court',        building: 'Social Commons',      floor: 2 },
        { code: 'SC-F2-LS', x: 185, y: 50,  w:  60, h: 60, label: 'Loading/Storage',   building: 'Social Commons',      floor: 2 },
        { code: 'SC-F2-WR', x: 255, y: 50,  w:  60, h: 60, label: 'Washrooms',         building: 'Social Commons',      floor: 2 },
        { code: 'SC-F2-DJ', x: 25,  y: 120, w: 100, h: 60, label: 'Djibouti',          building: 'Social Commons',      floor: 2 },
        { code: 'SC-F2-SS', x: 135, y: 120, w: 100, h: 60, label: 'South Sudan',       building: 'Social Commons',      floor: 2 },
        { code: 'SC-F2-BT', x: 245, y: 120, w:  70, h: 60, label: 'Bibi Titi',         building: 'Social Commons',      floor: 2 },

        // ── ENTERPRISE COMMONS ── Floor 0
        { code: 'EC-F0-LE', x: 25,  y: 50,  w: 120, h: 60, label: 'Lesotho',           building: 'Enterprise Commons',  floor: 0 },
        { code: 'EC-F0-FL', x: 155, y: 50,  w: 100, h: 60, label: 'Fab Lab',           building: 'Enterprise Commons',  floor: 0 },
        { code: 'EC-F0-WR', x: 265, y: 50,  w:  50, h: 60, label: 'Washrooms',         building: 'Enterprise Commons',  floor: 0 },
        // ── ENTERPRISE COMMONS ── Floor 1
        { code: 'EC-F1-AN', x: 25,  y: 50,  w: 100, h: 60, label: 'Angola',            building: 'Enterprise Commons',  floor: 1 },
        { code: 'EC-F1-NA', x: 135, y: 50,  w: 100, h: 60, label: 'Namibia',           building: 'Enterprise Commons',  floor: 1 },
        { code: 'EC-F1-UG', x: 245, y: 50,  w: 100, h: 60, label: 'Uganda',            building: 'Enterprise Commons',  floor: 1 },
        { code: 'EC-F1-WR', x: 355, y: 50,  w:  50, h: 60, label: 'Washrooms',         building: 'Enterprise Commons',  floor: 1 },
        // ── ENTERPRISE COMMONS ── Floor 2
        { code: 'EC-F2-FG', x: 25,  y: 50,  w: 120, h: 60, label: 'Fab Lab Gallery',   building: 'Enterprise Commons',  floor: 2 },
        { code: 'EC-F2-BU', x: 155, y: 50,  w: 100, h: 60, label: 'Burundi',           building: 'Enterprise Commons',  floor: 2 },
        { code: 'EC-F2-KE', x: 265, y: 50,  w: 100, h: 60, label: 'Kenya',             building: 'Enterprise Commons',  floor: 2 },
        { code: 'EC-F2-WR', x: 375, y: 50,  w:  50, h: 60, label: 'Washrooms',         building: 'Enterprise Commons',  floor: 2 },

        // ── LEARNING COMMONS ── Floor 0
        { code: 'LC-F0-LC', x: 25,  y: 50,  w: 130, h: 60, label: 'Leadership Center', building: 'Learning Commons',    floor: 0 },
        { code: 'LC-F0-WC', x: 165, y: 50,  w: 100, h: 60, label: 'Wellness Center',   building: 'Learning Commons',    floor: 0 },
        { code: 'LC-F0-BE', x: 275, y: 50,  w: 100, h: 60, label: 'Benin',             building: 'Learning Commons',    floor: 0 },
        { code: 'LC-F0-SH', x: 25,  y: 120, w: 100, h: 60, label: 'Sahel',             building: 'Learning Commons',    floor: 0 },
        { code: 'LC-F0-ES', x: 135, y: 120, w: 100, h: 60, label: 'Eswatini',          building: 'Learning Commons',    floor: 0 },
        { code: 'LC-F0-WR', x: 245, y: 120, w:  50, h: 60, label: 'Washrooms',         building: 'Learning Commons',    floor: 0 },
        // ── LEARNING COMMONS ── Floor 1
        { code: 'LC-F1-RC', x: 25,  y: 50,  w: 120, h: 60, label: 'Resource Center',   building: 'Learning Commons',    floor: 1 },
        { code: 'LC-F1-GN', x: 155, y: 50,  w: 100, h: 60, label: 'Guinea',            building: 'Learning Commons',    floor: 1 },
        { code: 'LC-F1-GL', x: 25,  y: 120, w: 150, h: 60, label: 'Gambia & Liberia',  building: 'Learning Commons',    floor: 1 },
        { code: 'LC-F1-MM', x: 185, y: 120, w: 150, h: 60, label: 'Mozambique & Malawi',building:'Learning Commons',    floor: 1 },
        { code: 'LC-F1-WR', x: 345, y: 50,  w:  50, h: 60, label: 'Washrooms',         building: 'Learning Commons',    floor: 1 },
        // ── LEARNING COMMONS ── Floor 2
        { code: 'LC-F2-RE', x: 25,  y: 50,  w:  80, h: 60, label: 'Reception',         building: 'Learning Commons',    floor: 2 },
        { code: 'LC-F2-AD', x: 115, y: 50,  w:  80, h: 60, label: 'Administration',    building: 'Learning Commons',    floor: 2 },
        { code: 'LC-F2-SW', x: 205, y: 50,  w: 100, h: 60, label: 'Staff Work Hive',   building: 'Learning Commons',    floor: 2 },
        { code: 'LC-F2-CO', x: 25,  y: 120, w: 100, h: 60, label: 'Congo',             building: 'Learning Commons',    floor: 2 },
        { code: 'LC-F2-GA', x: 135, y: 120, w: 100, h: 60, label: 'Gabon',             building: 'Learning Commons',    floor: 2 },
        { code: 'LC-F2-WR', x: 245, y: 120, w:  50, h: 60, label: 'Washrooms',         building: 'Learning Commons',    floor: 2 },
    ]

    const buildingColour = {
        'Social Commons': '#8B0000',
        'Enterprise Commons': '#1B5E20',
        'Learning Commons':   '#003087',
    }

    const getAvailability = (code) => {
        const room = rooms.find(r => r.code === code)
        if (!room) return true
        return room.is_available
    }

    const grouped = {}
    roomData.forEach(room => {
        if (!grouped[room.building]) grouped[room.building] = {}
        if (!grouped[room.building][room.floor]) grouped[room.building][room.floor] = []
        grouped[room.building][room.floor].push(room)
    })

    const FLOOR_HEIGHT = 210
    const FLOOR_LABEL_HEIGHT = 24
    const BUILDING_LABEL_HEIGHT = 32
    const SECTION_PADDING = 16

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {Object.entries(grouped).map(([building, floors]) => {

        const colour = buildingColour[building] || '#334155'
        const floorCount = Object.keys(floors).length
        const svgHeight = floorCount * FLOOR_HEIGHT + BUILDING_LABEL_HEIGHT + SECTION_PADDING

        return (
            <div key={building}>

                {/* Building title */}
                <div style={{
                background: colour,
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                fontWeight: '600',
                fontSize: '15px'
                }}>
                {building}
                </div>

                {/* SVG for this building */}
                <svg
                viewBox={`0 0 820 ${svgHeight}`}
                style={{
                    width: '100%',
                    height: 'auto',
                    background: '#f8fafc',
                    borderRadius: '0 0 8px 8px',
                    border: `1px solid ${colour}`,
                    borderTop: 'none'
                }}
                >
                {Object.entries(floors)
                    .sort((a, b) => Number(b[0]) - Number(a[0])) // floor 2 at top, 0 at bottom
                    .map(([floor, floorRooms], floorIndex) => {

                    // y offset for this floor section
                    const yOffset = floorIndex * FLOOR_HEIGHT + BUILDING_LABEL_HEIGHT

                    return (
                        <g key={floor}>

                        {/* Floor label background */}
                        <rect
                            x={0} y={yOffset}
                            width={820} height={FLOOR_LABEL_HEIGHT}
                            fill={colour + '22'}
                        />

                        {/* Floor label text */}
                        <text
                            x={12} y={yOffset + 16}
                            fontSize={12}
                            fontWeight="600"
                            fill={colour}
                        >
                            {floor === '0' ? 'Ground Floor' : `Floor ${floor}`}
                        </text>

                        {/* Rooms on this floor */}
                        {floorRooms.map(room => {
                            const isAvailable = getAvailability(room.code)
                            const isHighlighted = highlightedRoom === room.code
                            const roomY = yOffset + FLOOR_LABEL_HEIGHT + room.y

                            return (
                            <g
                                key={room.code}
                                onClick={() => onRoomClick && onRoomClick(room.code)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Room rectangle */}
                                <rect
                                x={room.x}
                                y={roomY}
                                width={room.w}
                                height={room.h}
                                fill={isAvailable ? '#dcfce7' : '#fee2e2'}
                                stroke={
                                    isHighlighted ? '#1d4ed8'
                                    : isAvailable  ? '#16a34a'
                                    : '#dc2626'
                                }
                                strokeWidth={isHighlighted ? 3 : 1.5}
                                rx={6}
                                />

                                {/* Room name */}
                                <text
                                x={room.x + room.w / 2}
                                y={roomY + room.h / 2 - 8}
                                textAnchor="middle"
                                fontSize={10}
                                fontWeight="500"
                                fill="#1e293b"
                                >
                                {room.label}
                                </text>

                                {/* Availability badge */}
                                <text
                                x={room.x + room.w / 2}
                                y={roomY + room.h / 2 + 10}
                                textAnchor="middle"
                                fontSize={9}
                                fill={isAvailable ? '#16a34a' : '#dc2626'}
                                >
                                {isAvailable ? 'Available' : 'Booked'}
                                </text>

                                {/* Room code below */}
                                <text
                                x={room.x + room.w / 2}
                                y={roomY + room.h - 6}
                                textAnchor="middle"
                                fontSize={8}
                                fill="#94a3b8"
                                >
                                {room.code}
                                </text>

                            </g>
                            )
                        })}

                        </g>
                    )
                    })}

                </svg>
            </div>
            )
        })}

        </div>
    )
}

export default Map2d