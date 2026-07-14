import { useState, useEffect, useRef } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import nodesData from '../../../campus-data/nodes.json'

const VIEW = { CAMPUS: 'campus', BUILDING: 'building' }

const W = 900
const H = 600

// Outlines below are anchored on the 11 real GPS entrance points (run through
// the same gpsToPixel bounds used below), then expanded/shaped using the
// AMMA floor plans + the labelled satellite reference. Each building's own
// entrance points fall inside its polygon, and adjacent polygons deliberately
// overlap at the Collab Street seams (Social bridges over Learning + Enterprise)
// so there's no rendering gap. Still worth a final visual nudge against
// campus-satellite.png before calling it done — see note below.
const BUILDINGS = {
    'Social Commons': {
        colour: '#8B0000',
        lightColour: '#fee2e2',
        outline: [
        [470, 260], [615, 250], [612, 345], [565, 372], [515, 378], [462, 355], [455, 290]
        ],
        centre: { x: 537, y: 300 },
        floors: [2, 1, 0],
        label: 'Social Commons',
    },
    'Enterprise Commons': {
        colour: '#1B5E20',
        lightColour: '#dcfce7',
        outline: [
        [575, 355], [625, 350], [630, 410], [595, 445], [530, 440], [505, 410], [520, 368]
        ],
        centre: { x: 571, y: 400 },
        floors: [2, 1, 0],
        label: 'Enterprise Commons',
    },
    'Learning Commons': {
        colour: '#003087',
        lightColour: '#dbeafe',
        outline: [
        [475, 310], [545, 370], [555, 400], [520, 445], [460, 460], [430, 435], [410, 385], [430, 325]
        ],
        centre: { x: 478, y: 405 },
        floors: [2, 1, 0],
        label: 'Learning Commons',
    },
}

// KG 65 Ave curving in from the NW, through Main Entrance (283,233), then
// into the complex's NW corner — traced from the satellite reference, four
// short segments approximating the curve since ROADS renders as <line>s.
const ROADS = [
    { x1: 50,  y1: 55,  x2: 170, y2: 125, width: 12, color: '#cbd5e1' },
    { x1: 170, y1: 125, x2: 283, y2: 233, width: 12, color: '#cbd5e1' },
    { x1: 283, y1: 233, x2: 370, y2: 275, width: 10, color: '#cbd5e1' },
    { x1: 370, y1: 275, x2: 450, y2: 295, width: 10, color: '#cbd5e1' },
    // Parking loop near the entrance (visible in the aerial photo)
    { x1: 300, y1: 250, x2: 360, y2: 230, width: 8,  color: '#e2e8f0' },
]

const GREEN_AREAS = [
    // Fields/treeline west of the entrance road, clear of the building bounds (x:410-630, y:250-460)
    { x: 30,  y: 300, w: 370, h: 290, rx: 20 },
    // Forested slope south/southeast of the complex, matching the aerial photo
    { x: 400, y: 465, w: 470, h: 130, rx: 15 },
]

const NODE_TRANSFORM = {
    'Social Commons-2': { scaleX: 0.44, scaleY: 0.56, offsetX: 0, offsetY: 0 },
    'Social Commons-1': { scaleX: 0.63, scaleY: 0.57, offsetX: 0, offsetY: 0 },
    'Social Commons-0': { scaleX: 0.64, scaleY: 0.56, offsetX: 0, offsetY: 0 },
}

const NON_BOOKABLE = new Set([
    'SC-F0-WR', 'SC-F0-PR', 'SC-F0-EL',
    'SC-F0-PD-1', 'SC-F0-PD-2', 'SC-F0-PD-3', 'SC-F0-PD-4',
    'SC-F1-WR', 'SC-F1-EL', 'SC-F1-PD-1', 'SC-F1-PD-2', 'SC-F1-PD-3',
    'SC-F2-PD-1', 'SC-F2-EL', 'SC-F2-WR',
    'EC-F0-WR', 'EC-F1-WR', 'EC-F2-WR',
    'LC-F0-WR', 'LC-F1-WR', 'LC-F2-WR',
])

const ROOM_DATA = [
    // ── SOCIAL COMMONS ── Floor 0
    { code: 'SC-F0-EG', x: 315, y: 700, w: 185, h: 190, label: 'Egypt', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-FC', x: 315, y: 140, w: 180, h: 360, label: 'Food Court', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-WR', x: 150, y: 190, w: 165, h: 130, label: 'Washrooms', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PR', x: 90, y: 220, w: 60, h: 100, label: 'Prayer Room', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-1', x: 480, y: 670, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-2', x: 465, y: 480, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-3', x: 465, y: 290, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-PD-4', x: 465, y: 100, w: 65, h: 65, label: 'POD', building: 'Social Commons', floor: 0 },
    { code: 'SC-F0-EL', x: 100, y: 100, w: 60, h: 60, label: 'Elevator', building: 'Social Commons', floor: 0 },
    // ── SOCIAL COMMONS ── Floor 1
    { code: 'SC-F1-MO', x: 260, y: 810, w: 140, h: 150, label: 'Morocco', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-AL', x: 400, y: 810, w: 170, h: 170, label: 'Algeria', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-FC', x: 220, y: 380, w: 165, h: 220, label: 'Food Court', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-ET', x: 85, y: 40, w: 170, h: 150, label: 'Ethiopia', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-WR', x: 110, y: 350, w: 95, h: 200, label: 'Washrooms', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-1', x: 240, y: 170, w: 50, h: 50, label: 'POD', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-2', x: 390, y: 630, w: 50, h: 50, label: 'POD', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-PD-3', x: 540, y: 785, w: 50, h: 50, label: 'POD', building: 'Social Commons', floor: 1 },
    { code: 'SC-F1-EL', x: 240, y: 320, w: 50, h: 50, label: 'Elevator', building: 'Social Commons', floor: 1 },
    // ── SOCIAL COMMONS ── Floor 2
    { code: 'SC-F2-DJ', x: 90, y: 150, w: 150, h: 155, label: 'Djibouti', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-SS', x: 240, y: 120, w: 185, h: 185, label: 'South Sudan', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-BT', x: 370, y: 280, w: 55, h: 50, label: 'Bibi Titi', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-PD-1', x: 220, y: 280, w: 45, h: 45, label: 'POD', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-VD', x: 270, y: 683, w: 285, h: 100, label: 'Vendors', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-FC', x: 320, y: 463, w: 210, h: 170, label: 'Food Court', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-EL', x: 370, y: 440, w: 50, h: 50, label: 'Elevator', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-WR', x: 240, y: 463, w: 79, h: 170, label: 'Washrooms', building: 'Social Commons', floor: 2 },
    // ── ENTERPRISE COMMONS ── Floor 0
    { code: 'EC-F0-LE', x: 25, y: 50, w: 120, h: 60, label: 'Lesotho', building: 'Enterprise Commons', floor: 0 },
    { code: 'EC-F0-FL', x: 155, y: 50, w: 100, h: 60, label: 'Fab Lab', building: 'Enterprise Commons', floor: 0 },
    { code: 'EC-F0-WR', x: 265, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Enterprise Commons', floor: 0 },
    // ── ENTERPRISE COMMONS ── Floor 1
    { code: 'EC-F1-AN', x: 25, y: 50, w: 100, h: 60, label: 'Angola', building: 'Enterprise Commons', floor: 1 },
    { code: 'EC-F1-NA', x: 135, y: 50, w: 100, h: 60, label: 'Namibia', building: 'Enterprise Commons', floor: 1 },
    { code: 'EC-F1-UG', x: 245, y: 50, w: 100, h: 60, label: 'Uganda', building: 'Enterprise Commons', floor: 1 },
    { code: 'EC-F1-WR', x: 355, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Enterprise Commons', floor: 1 },
    // ── ENTERPRISE COMMONS ── Floor 2
    { code: 'EC-F2-FG', x: 25, y: 50, w: 120, h: 60, label: 'Fab Lab Gallery', building: 'Enterprise Commons', floor: 2 },
    { code: 'EC-F2-BU', x: 155, y: 50, w: 100, h: 60, label: 'Burundi', building: 'Enterprise Commons', floor: 2 },
    { code: 'EC-F2-KE', x: 265, y: 50, w: 100, h: 60, label: 'Kenya', building: 'Enterprise Commons', floor: 2 },
    { code: 'EC-F2-WR', x: 375, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Enterprise Commons', floor: 2 },
    // ── LEARNING COMMONS ── Floor 0
    { code: 'LC-F0-LC', x: 25, y: 50, w: 130, h: 60, label: 'Leadership Center', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-WC', x: 165, y: 50, w: 100, h: 60, label: 'Wellness Center', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-BE', x: 275, y: 50, w: 100, h: 60, label: 'Benin', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-SH', x: 25, y: 120, w: 100, h: 60, label: 'Sahel', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-ES', x: 135, y: 120, w: 100, h: 60, label: 'Eswatini', building: 'Learning Commons', floor: 0 },
    { code: 'LC-F0-WR', x: 245, y: 120, w: 50, h: 60, label: 'Washrooms', building: 'Learning Commons', floor: 0 },
    // ── LEARNING COMMONS ── Floor 1
    { code: 'LC-F1-RC', x: 25, y: 50, w: 120, h: 60, label: 'Resource Center', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-GN', x: 155, y: 50, w: 100, h: 60, label: 'Guinea', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-GL', x: 25, y: 120, w: 150, h: 60, label: 'Gambia & Liberia', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-MM', x: 185, y: 120, w: 150, h: 60, label: 'Mozambique & Malawi', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-WR', x: 345, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Learning Commons', floor: 1 },
    // ── LEARNING COMMONS ── Floor 2
    { code: 'LC-F2-RE', x: 25, y: 50, w: 80, h: 60, label: 'Reception', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-AD', x: 115, y: 50, w: 80, h: 60, label: 'Administration', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-SW', x: 205, y: 50, w: 100, h: 60, label: 'Staff Work Hive', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-CO', x: 25, y: 120, w: 100, h: 60, label: 'Congo', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-GA', x: 135, y: 120, w: 100, h: 60, label: 'Gabon', building: 'Learning Commons', floor: 2 },
    { code: 'LC-F2-WR', x: 245, y: 120, w: 50, h: 60, label: 'Washrooms', building: 'Learning Commons', floor: 2 },
]

function CampusMap({
    rooms = [],
    highlightedRoom = null,
    navigationPath = [],
    currentNodeId = null,
    settingPosition = false,
    onRoomClick,
    onNodeClick,
}) {
    const [view, setView] = useState(VIEW.CAMPUS)
    const [activeBuilding, setActiveBuilding] = useState(null)
    const [activeFloor, setActiveFloor] = useState(2)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    const { position, currentBuilding } = useGeolocation()

    // Auto-enter building when GPS crosses entrance geofence
    useEffect(() => {
        if (currentBuilding && view === VIEW.CAMPUS) {
        enterBuilding(currentBuilding.building, currentBuilding.floor)
        }
    }, [currentBuilding])

    // Auto-switch floor when geofence detects floor change
    useEffect(() => {
        if (
        currentBuilding &&
        view === VIEW.BUILDING &&
        activeBuilding === currentBuilding.building
        ) {
        setActiveFloor(currentBuilding.floor)
        }
    }, [currentBuilding])

    const enterBuilding = (buildingName, floor = 2) => {
        setActiveBuilding(buildingName)
        setActiveFloor(floor)
        setView(VIEW.BUILDING)
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    const exitBuilding = () => {
        setView(VIEW.CAMPUS)
        setActiveBuilding(null)
        setZoom(1)
        setPan({x: 0, y: 0})
    }

    const getAvailability = (code) => {
        const room = rooms.find(r => r.code === code)
        if (!room) return null
        return room.is_available
    }

    const getFloorNodes = (buildingName, floorNum) => {
        const key = `${buildingName}-${floorNum}`
        const t = NODE_TRANSFORM[key] || { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
        return nodesData
        .filter(n => n.building === buildingName && n.floor === floorNum)
        .map(n => ({
            ...n,
            x: Math.round(n.x * t.scaleX + t.offsetX),
            y: Math.round(n.y * t.scaleY + t.offsetY),
        }))
    }

    // Pan and zoom handlers
    const handleWheel = (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(z => Math.min(Math.max(z * delta, 0.5), 5))
    }

    const handleMouseDown = (e) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }

    const handleMouseMove = (e) => {
        if (!isDragging) return
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }

    const handleMouseUp = () => setIsDragging(false)

    // Convert GPS coordinates to pixel position on campus canvas
    const gpsToPixel = (lat, lng) => {
        const LAT_TOP    = -1.9288
        const LAT_BOTTOM = -1.9318
        const LNG_LEFT   = 30.1508
        const LNG_RIGHT  = 30.1548
        return {
        x: ((lng - LNG_LEFT)   / (LNG_RIGHT  - LNG_LEFT))   * W,
        y: ((lat - LAT_TOP)    / (LAT_BOTTOM - LAT_TOP))    * H,
        }
    }

    // ── CAMPUS VIEW ────────────────────────────────────────────────────────
    const renderCampusView = () => (
        <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
            width: '100%', height: 'auto',
            cursor: isDragging ? 'grabbing' : 'grab',
            borderRadius: '12px',
            background: '#f1f5f9',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Satellite overlay removed now that outlines are anchored on real
                GPS coordinates. To spot-check alignment, temporarily add back:
                <image href="/campus-satellite.png" x={0} y={0} width={W} height={H}
                       opacity={0.4} preserveAspectRatio="xMidYMid meet" /> */}

            {/* Green areas — trees and grass */}
            {GREEN_AREAS.map((g, i) => (
            <rect
                key={i}
                x={g.x} y={g.y} width={g.w} height={g.h} rx={g.rx}
                fill="#bbf7d0" opacity={0.6}
            />
            ))}

            {/* Roads and paths */}
            {ROADS.map((r, i) => (
            <line
                key={i}
                x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                stroke={r.color} strokeWidth={r.width}
                strokeLinecap="round"
            />
            ))}

            {/* School entrance marker — position matches MAIN-ENT (-1.929967, 30.152060) via gpsToPixel */}
            <circle cx={284} cy={233} r={8} fill="#f59e0b"/>
            <text x={284} y={218} textAnchor="middle" fontSize={11} fill="#92400e" fontWeight="600">
            Main Entrance
            </text>

            {/* Parking label */}
            <text x={330} y={218} textAnchor="middle" fontSize={10} fill="#64748b">
            Parking
            </text>

            {/* Building polygons */}
            {Object.entries(BUILDINGS).map(([name, bld]) => (
            <g
                key={name}
                onClick={() => enterBuilding(name)}
                style={{ cursor: 'pointer' }}
            >
                {/* Building filled polygon */}
                <polygon
                points={bld.outline.map(([x, y]) => `${x},${y}`).join(' ')}
                fill={bld.lightColour}
                stroke={bld.colour}
                strokeWidth={2.5}
                strokeLinejoin="round"
                />

                {/* Building name */}
                <text
                x={bld.centre.x}
                y={bld.centre.y - 8}
                textAnchor="middle"
                fontSize={12}
                fontWeight="700"
                fill={bld.colour}
                >
                {bld.label.split(' ')[0]}
                </text>
                <text
                x={bld.centre.x}
                y={bld.centre.y + 8}
                textAnchor="middle"
                fontSize={11}
                fill={bld.colour}
                >
                {bld.label.split(' ').slice(1).join(' ')}
                </text>

                {/* Tap hint */}
                <text
                x={bld.centre.x}
                y={bld.centre.y + 24}
                textAnchor="middle"
                fontSize={9}
                fill={bld.colour}
                opacity={0.6}
                >
                tap to enter
                </text>
            </g>
            ))}

            {/* GPS dot on campus */}
            {position && (() => {
            const { x, y } = gpsToPixel(position.lat, position.lng)
            return (
                <g>
                <circle cx={x} cy={y} r={18} fill="#1d4ed8" opacity={0.12}/>
                <circle cx={x} cy={y} r={9}  fill="#1d4ed8"/>
                <circle cx={x} cy={y} r={4}  fill="white"/>
                </g>
            )
            })()}

        </g>
        </svg>
    )

    // ── BUILDING / FLOOR VIEW ──────────────────────────────────────────────
    const renderBuildingView = () => {
        const bldData = BUILDINGS[activeBuilding]
        if (!bldData) return null
        const colour = bldData.colour
        const floorRooms = ROOM_DATA.filter(
        r => r.building === activeBuilding && r.floor === activeFloor
        )
        const floorNodes = getFloorNodes(activeBuilding, activeFloor)

        return (
        <div>
            {/* Building header */}
            <div style={{
            background: colour, color: 'white',
            padding: '10px 16px', borderRadius: '10px 10px 0 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                onClick={exitBuilding}
                style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    color: 'white', borderRadius: '6px',
                    padding: '4px 10px', cursor: 'pointer', fontSize: '13px'
                }}
                >
                ← Campus
                </button>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>
                {activeBuilding}
                </span>
            </div>
            {/* Floor switcher */}
            <div style={{ display: 'flex', gap: '6px' }}>
                {bldData.floors.map(f => (
                <button
                    key={f}
                    onClick={() => setActiveFloor(f)}
                    style={{
                    width: '32px', height: '32px', borderRadius: '6px',
                    border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '13px',
                    background: activeFloor === f ? 'white' : 'rgba(255,255,255,0.2)',
                    color: activeFloor === f ? colour : 'white'
                    }}
                >
                    {f}
                </button>
                ))}
            </div>
            </div>

            {/* Floor SVG */}
            <svg
            viewBox="0 0 820 1000"
            style={{
                width: '100%', height: 'auto',
                background: '#f8fafc',
                borderRadius: '0 0 10px 10px',
                border: `1px solid ${colour}`,
                borderTop: 'none',
            }}
            >
            {/* Floor label */}
            <text x={12} y={20} fontSize={12} fontWeight="600" fill={colour}>
                {activeFloor === 0 ? 'Ground Floor' : `Floor ${activeFloor}`}
            </text>

            {/* Navigation path */}
            {navigationPath.length > 1 && (() => {
                const key = `${activeBuilding}-${activeFloor}`
                const t = NODE_TRANSFORM[key] || { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }
                const scaledPath = navigationPath
                .filter(p => p.floor === activeFloor)
                .map(p => ({
                    x: Math.round(p.x * t.scaleX + t.offsetX),
                    y: Math.round(p.y * t.scaleY + t.offsetY),
                }))
                if (scaledPath.length < 2) return null
                return (
                <polyline
                    points={scaledPath.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={3}
                    strokeDasharray="8 6"
                />
                )
            })()}

            {/* Rooms */}
            {floorRooms.map(room => {
                const isNonBookable = NON_BOOKABLE.has(room.code)
                const isAvailable = isNonBookable ? null : getAvailability(room.code)
                const isHighlighted = highlightedRoom === room.code
                const fillColour = isNonBookable
                ? '#e2e8f0'
                : (isAvailable === null ? '#e2e8f0' : (isAvailable ? '#dcfce7' : '#fee2e2'))
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
                    x={room.x} y={room.y}
                    width={room.w} height={room.h}
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
                    {!isNonBookable && isAvailable !== null && (
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

            {/* Tappable nodes when setting position */}
            {settingPosition && floorNodes
                .filter(n => ['junction','staircase','building_entry','entrance'].includes(n.type))
                .map(n => (
                <g
                    key={`pos-${n.id}`}
                    onClick={() => onNodeClick && onNodeClick(n.id)}
                    style={{ cursor: 'pointer' }}
                >
                    <circle cx={n.x} cy={n.y} r={16} fill="#7c3aed" opacity={0.15}/>
                    <circle cx={n.x} cy={n.y} r={8}  fill="#7c3aed" opacity={0.85}/>
                    <text
                    x={n.x} y={n.y - 14}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#7c3aed"
                    >
                    {n.id.split('-').slice(2).join('-')}
                    </text>
                </g>
                ))
            }

            {/* Current position dot */}
            {currentNodeId && floorNodes
                .filter(n => n.id === currentNodeId)
                .map(n => (
                <g key="current-pos">
                    <circle cx={n.x} cy={n.y} r={16} fill="#1d4ed8" opacity={0.15}/>
                    <circle cx={n.x} cy={n.y} r={9}  fill="#1d4ed8"/>
                    <circle cx={n.x} cy={n.y} r={4}  fill="white"/>
                    <text
                    x={n.x} y={n.y - 18}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="600"
                    fill="#1d4ed8"
                    >
                    You
                    </text>
                </g>
                ))
            }

            </svg>
        </div>
        )
    }

    // ── MAIN RENDER ────────────────────────────────────────────────────────
    return (
        <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
        {view === VIEW.CAMPUS ? renderCampusView() : renderBuildingView()}
        </div>
    )
}

export default CampusMap