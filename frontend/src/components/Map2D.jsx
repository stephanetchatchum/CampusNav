// Map2D.jsx — owned by Stephane
//
// ARCHITECTURE NOTE:
// Each building shows ONE floor at a time, with a floor switcher (like
// elevator buttons) to change floors. Room positions below are EXACTLY
// what was positioned against the real floor plan photos — untouched.

import { useState } from 'react'
import scFloor2 from '../assets/SC-F2-1-CP.jpg'
import scFloor1 from '../assets/SC-F1-CP.jpg'
import scFloor0 from '../assets/SC-F0-CP.jpg'

const roomData = [
    // ── SOCIAL COMMONS ── Floor 0
    { code: 'SC-F0-EG', x: 315,  y: 700,  w: 185, h: 190, label: 'Egypt',            building: 'Social Commons',      floor: 0 },
    { code: 'SC-F0-FC', x: 315, y: 140,  w: 180, h: 360, label: 'Food Court',        building: 'Social Commons',      floor: 0 },
    { code: 'SC-F0-WR', x: 150, y: 190,  w:  165, h: 130, label: 'Washrooms',         building: 'Social Commons',      floor: 0 },
    { code: 'SC-F0-PR', x: 90, y: 220,  w:  60, h: 100, label: 'Prayer Room',         building: 'Social Commons',      floor: 0 },
    { code: 'SC-F0-PD-1', x: 480, y: 670,  w: 65, h: 65, label: 'POD',       building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-2', x: 465, y: 480,  w: 65, h: 65, label: 'POD',       building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-3', x: 465, y: 290,  w: 65, h: 65, label: 'POD',       building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-4', x: 465, y: 100,  w: 65, h: 65, label: 'POD',       building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-EL', x: 100, y: 100,  w: 60, h: 60, label: 'Elevator',       building: 'Social Commons', floor: 0 },
    // ── SOCIAL COMMONS ── Floor 1
    { code: 'SC-F1-MO', x: 260,  y: 810,  w: 140, h: 150, label: 'Morocco',           building: 'Social Commons',      floor: 1 },
    { code: 'SC-F1-AL', x: 400, y: 810,  w: 170, h: 170, label: 'Algeria',           building: 'Social Commons',      floor: 1 },
    { code: 'SC-F1-FC', x: 245, y: 50,  w:  80, h: 60, label: 'Food Court',        building: 'Social Commons',      floor: 1 },
    { code: 'SC-F1-ET', x: 85,  y: 40, w: 170, h: 150, label: 'Ethiopia',          building: 'Social Commons',      floor: 1 },
    { code: 'SC-F1-WR', x: 110, y: 350, w:  95, h: 200, label: 'Washrooms',         building: 'Social Commons',      floor: 1 },
    { code: 'SC-F1-PD-1', x: 240, y: 170,  w: 50, h: 50, label: 'POD',       building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-2', x: 390, y: 630,  w: 50, h: 50, label: 'POD',       building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-3', x: 540, y: 785,  w: 50, h: 50, label: 'POD',       building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-EL', x: 240, y: 320,  w: 50, h: 50, label: 'Elevator',       building: 'Social Commons', floor: 1 },
    // ── SOCIAL COMMONS ── Floor 2
    { code: 'SC-F2-DJ', x: 90,  y: 150,  w: 150, h: 155, label: 'Djibouti',        building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-SS', x: 240, y: 120,  w: 185, h: 185, label: 'South Sudan',     building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-BT', x: 370, y: 280,  w: 55, h: 50, label: 'Bibi Titi',       building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-PD-1', x: 220, y: 280,  w: 45, h: 45, label: 'POD',       building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-VD', x: 270,  y: 683, w:  285, h: 100, label: 'Vendors',         building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-FC', x: 320, y: 463, w: 210, h: 170, label: 'Food Court',      building: 'Social Commons', floor: 2 },        
    { code: 'SC-F2-EL', x: 370, y: 440,  w: 50, h: 50, label: 'Elevator',       building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-WR', x: 240, y: 463, w:  79, h: 170, label: 'Washrooms',       building: 'Social Commons', floor: 2 },

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

// walls and doors — empty for now, you'll add these per floor as you
// study the photos more closely. Keyed by "BuildingName-floorNumber"
const wallsData = {
  'Social Commons-2': [],
  'Social Commons-1': [],
  'Social Commons-0': [],
}
const doorsData = {
  'Social Commons-2': [],
  'Social Commons-1': [],
  'Social Commons-0': [],
}

const buildingColour = {
    'Social Commons': '#8B0000',
    'Enterprise Commons': '#1B5E20',
    'Learning Commons':   '#003087',
}

// background reference images, keyed by "BuildingName-floorNumber"
const floorBackgrounds = {
  'Social Commons-2': scFloor2,
  'Social Commons-1': scFloor1,
  'Social Commons-0': scFloor0,
}

// non-bookable room codes (gray, not clickable, no availability badge)
const NON_BOOKABLE = new Set([
  'SC-F0-WR', 'SC-F1-WR', 'SC-F1-EL', 'SC-F1-PD-1', 'SC-F1-PD-2', 'SC-F1-PD-3',
  'SC-F2-PD-1', 'SC-F2-EL', 'SC-F2-WR',
  'EC-F0-WR', 'EC-F1-WR', 'EC-F2-WR',
  'LC-F0-WR', 'LC-F1-WR', 'LC-F2-WR',
])

function Map2D({ rooms = [], highlightedRoom = null, navigationPath = [], onRoomClick }) {

    // group rooms by building then floor — same grouping as before
    const grouped = {}
    roomData.forEach(room => {
        if (!grouped[room.building]) grouped[room.building] = {}
        if (!grouped[room.building][room.floor]) grouped[room.building][room.floor] = []
        grouped[room.building][room.floor].push(room)
    })

    // active floor per building — defaults to the highest floor available
    const defaultFloors = Object.fromEntries(
        Object.entries(grouped).map(([building, floors]) => {
            const highest = Math.max(...Object.keys(floors).map(Number))
            return [building, highest]
        })
    )
    const [activeFloors, setActiveFloors] = useState(defaultFloors)

    const getAvailability = (code) => {
        const room = rooms.find(r => r.code === code)
        if (!room) return true
        return room.is_available
    }

    // VIEWBOX matches the largest floor used so far (Floor 2 / Floor 1 of
    // Social Commons use up to ~y:980). Smaller floors just have empty
    // space below their rooms, which is fine.
    const VIEWBOX_WIDTH = 820
    const VIEWBOX_HEIGHT = 1000

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {Object.entries(grouped).map(([building, floors]) => {

        const colour = buildingColour[building] || '#334155'
        const floorNumbers = Object.keys(floors).map(Number).sort((a, b) => b - a)
        const activeFloor = activeFloors[building]
        const floorRooms = floors[activeFloor] || []
        const bgKey = `${building}-${activeFloor}`
        const bgImage = floorBackgrounds[bgKey]
        const walls = wallsData[bgKey] || []
        const doors = doorsData[bgKey] || []

        return (
            <div key={building}>

                {/* Building title + floor switcher */}
                <div style={{
                    background: colour,
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px 8px 0 0',
                    fontWeight: '600',
                    fontSize: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{building}</span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        {floorNumbers.map(num => (
                            <button
                                key={num}
                                onClick={() => setActiveFloors(prev => ({ ...prev, [building]: num }))}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    background: activeFloor === num ? 'white' : 'rgba(255,255,255,0.2)',
                                    color: activeFloor === num ? colour : 'white'
                                }}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SVG for the ACTIVE floor only */}
                <svg
                    viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                    style={{
                        width: '100%',
                        height: 'auto',
                        background: '#f8fafc',
                        borderRadius: '0 0 8px 8px',
                        border: `1px solid ${colour}`,
                        borderTop: 'none'
                    }}
                >
                    {/* Floor label */}
                    <text x={12} y={20} fontSize={12} fontWeight="600" fill={colour}>
                        {activeFloor === 0 ? 'Ground Floor' : `Floor ${activeFloor}`}
                    </text>

                    {/* Background reference image — remove once positions are final */}
                    {bgImage && (
                        <image
                            href={bgImage}
                            x={0}
                            y={0}
                            width={VIEWBOX_WIDTH}
                            height={VIEWBOX_HEIGHT}
                            opacity={0.35}
                            preserveAspectRatio="xMidYMid meet"
                        />
                    )}

                    {/* Walls */}
                    {walls.map((wall, i) => (
                        <line
                            key={`wall-${i}`}
                            x1={wall.x1} y1={wall.y1}
                            x2={wall.x2} y2={wall.y2}
                            stroke="#475569"
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    ))}

                    {/* Doors */}
                    {doors.map((door, i) => (
                        <circle
                            key={`door-${i}`}
                            cx={door.x} cy={door.y}
                            r={4}
                            fill="#f59e0b"
                            opacity={0.6}
                        />
                    ))}

                    {/* Navigation path */}
                    {navigationPath.length > 1 && (
                        <polyline
                            points={navigationPath.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#1d4ed8"
                            strokeWidth={3}
                            strokeDasharray="8 6"
                        />
                    )}

                    {/* Rooms — exact original positions, untouched */}
                    {floorRooms.map(room => {
                        const isNonBookable = NON_BOOKABLE.has(room.code)
                        const isAvailable = isNonBookable ? null : getAvailability(room.code)
                        const isHighlighted = highlightedRoom === room.code

                        const fillColour = isNonBookable
                            ? '#e2e8f0'
                            : (isAvailable ? '#dcfce7' : '#fee2e2')
                        const strokeColour = isNonBookable
                            ? '#94a3b8'
                            : (isHighlighted ? '#1d4ed8' : (isAvailable ? '#16a34a' : '#dc2626'))

                        return (
                            <g
                                key={room.code}
                                onClick={() => !isNonBookable && onRoomClick && onRoomClick(room.code)}
                                style={{ cursor: isNonBookable ? 'default' : 'pointer' }}
                            >
                                <rect
                                    x={room.x}
                                    y={room.y}
                                    width={room.w}
                                    height={room.h}
                                    fill={fillColour}
                                    stroke={strokeColour}
                                    strokeWidth={isHighlighted ? 3 : 1.5}
                                    rx={6}
                                />
                                <text
                                    x={room.x + room.w / 2}
                                    y={room.y + room.h / 2 - (isNonBookable ? 0 : 8)}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fontWeight="500"
                                    fill="#1e293b"
                                >
                                    {room.label}
                                </text>
                                {!isNonBookable && (
                                    <>
                                        <text
                                            x={room.x + room.w / 2}
                                            y={room.y + room.h / 2 + 10}
                                            textAnchor="middle"
                                            fontSize={9}
                                            fill={isAvailable ? '#16a34a' : '#dc2626'}
                                        >
                                            {isAvailable ? 'Available' : 'Booked'}
                                        </text>
                                        <text
                                            x={room.x + room.w / 2}
                                            y={room.y + room.h - 6}
                                            textAnchor="middle"
                                            fontSize={8}
                                            fill="#94a3b8"
                                        >
                                            {room.code}
                                        </text>
                                    </>
                                )}
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

export default Map2D