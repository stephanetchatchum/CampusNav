import { useState, useEffect, useRef } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import nodesData from '../../../campus-data/nodes.json'

const VIEW = { CAMPUS: 'campus', BUILDING: 'building' }

const W = 900
const H = 600

const BUILDINGS = {
    'Social Commons': {
        colour: '#8B0000',
        lightColour: '#fee2e2',
        outline: [
        [498, 345], [575, 363], [586, 332], [623, 343],
        [631, 300], [555, 273], [544, 303], [509, 297]
        ],
        centre: { x: 564, y: 320 },
        floors: [2, 1, 0],
        label: 'Social Commons',
    },
    'Enterprise Commons': {
        colour: '#1B5E20',
        lightColour: '#dcfce7',
        outline: [
        [542, 417], [607, 439], [616, 406], [636, 411],
        [649, 367], [608, 356], [595, 388], [558, 378],
        [552, 390]
        ],
        centre: { x: 597, y: 398 },
        floors: [2, 1, 0],
        label: 'Enterprise Commons',
    },
    'Learning Commons': {
        colour: '#003087',
        lightColour: '#dbeafe',
        outline: [
        [431, 351], [422, 391], [461, 403], [458, 426],
        [451, 445], [510, 464], [520, 422], [500, 413],
        [505, 396], [510, 382], [511, 370], [497, 365],
        [477, 361]
        ],
        centre: { x: 475, y: 403 },
        floors: [2, 1, 0],
        label: 'Learning Commons',
    },
}

const ROADS = [
    { x1: 184, y1: 219, x2: 207, y2: 238, width: 12, color: '#cbd5e1' },
    { x1: 207, y1: 238, x2: 280, y2: 215, width: 12, color: '#cbd5e1' },
    { x1: 280, y1: 215, x2: 405, y2: 202, width: 10, color: '#cbd5e1' },
    { x1: 405, y1: 202, x2: 546, y2: 282, width: 10, color: '#cbd5e1' },
    { x1: 207, y1: 238, x2: 212, y2: 269, width: 8, color: '#cbd5e1' },
    { x1: 237, y1: 276, x2: 212, y2: 269, width: 8, color: '#cbd5e1' },
    { x1: 254, y1: 248, x2: 237, y2: 276, width: 8, color: '#cbd5e1' },
    { x1: 285, y1: 237, x2: 254, y2: 248, width: 8, color: '#cbd5e1' },
    { x1: 368, y1: 263, x2: 285, y2: 237, width: 8, color: '#cbd5e1' },
    { x1: 429, y1: 279, x2: 368, y2: 263, width: 8, color: '#cbd5e1' },
    { x1: 427, y1: 302, x2: 429, y2: 279, width: 8, color: '#cbd5e1' },
    { x1: 427, y1: 302, x2: 444, y2: 319, width: 8, color: '#cbd5e1' },
    { x1: 444, y1: 319, x2: 487, y2: 346, width: 8, color: '#cbd5e1' },
    { x1: 444, y1: 319, x2: 406, y2: 323, width: 8, color: '#cbd5e1' },
    { x1: 406, y1: 323, x2: 453, y2: 348, width: 8, color: '#cbd5e1' },
    { x1: 453, y1: 348, x2: 419, y2: 350, width: 8, color: '#cbd5e1' },
    { x1: 419, y1: 350, x2: 406, y2: 394, width: 8, color: '#cbd5e1' },
    { x1: 406, y1: 394, x2: 443, y2: 412, width: 8, color: '#cbd5e1' },
    { x1: 443, y1: 412, x2: 439, y2: 452, width: 8, color: '#cbd5e1' },
    { x1: 439, y1: 452, x2: 521, y2: 470, width: 8, color: '#cbd5e1' },
    { x1: 521, y1: 470, x2: 535, y2: 429, width: 8, color: '#cbd5e1' },
    { x1: 535, y1: 429, x2: 519, y2: 411, width: 8, color: '#cbd5e1' },
    { x1: 519, y1: 411, x2: 536, y2: 370, width: 8, color: '#cbd5e1' },
    { x1: 536, y1: 370, x2: 487, y2: 346, width: 8, color: '#cbd5e1' },
    { x1: 536, y1: 370, x2: 586, y2: 377, width: 8, color: '#cbd5e1' },
    { x1: 586, y1: 377, x2: 597, y2: 354, width: 8, color: '#cbd5e1' },
    { x1: 535, y1: 429, x2: 602, y2: 447, width: 8, color: '#cbd5e1' },
]

const GREEN_AREAS = [
    { x: 141, y: 295, w: 255, h: 214, rx: 12 },
    { x: 647, y: 303, w: 164, h: 201, rx: 12 },
    { x: 395, y: 467, w: 255, h: 41, rx: 12 },
    { x: 647, y: 144, w: 166, h: 158, rx: 12 },
    { x: 393, y: 409, w: 36, h: 60, rx: 12 },
    { x: 538, y: 449, w: 106, h: 17, rx: 12 },
]

const NODE_TRANSFORM = {
    'Social Commons-2': { scaleX: 0.7, scaleY: 0.7, offsetX: 1, offsetY: 80 },
    'Social Commons-1': { scaleX: 0.65, scaleY: 0.6, offsetX: 15, offsetY: -5 },
    'Social Commons-0': { scaleX: 0.6, scaleY: 0.6, offsetX: 45, offsetY: -5 },
}

const FLOOR_WALLS = {
    'Social Commons-2': [
        { points: [[113,141], [209,137]], smooth: false },
        { points: [[211,137], [215,110], [267,110]], smooth: true },
        { points: [[433,175], [433,299]], smooth: false },
        { points: [[435,299], [431,324], [404,328]], smooth: true },
        { points: [[404,330], [406,432], [534,434]], smooth: false },
        { points: [[537,432], [599,427], [596,492]], smooth: true },
        { points: [[597,492], [567,492], [568,594], [593,598]], smooth: false },
        { points: [[595,598], [602,642], [570,656]], smooth: true },
        { points: [[570,654], [571,759]], smooth: false },
        { points: [[571,759], [605,771], [589,809]], smooth: true },
        { points: [[589,812], [558,827], [536,789]], smooth: true },
        { points: [[86,812], [204,814], [204,756], [243,756], [242,463]], smooth: false },
        { points: [[271,684], [271,789], [534,790]], smooth: false },
        { points: [[242,463], [340,462]], smooth: false },
        { points: [[321,381], [245,382], [245,433]], smooth: false },
        { points: [[269,461], [258,438], [236,436], [220,447], [212,461]], smooth: true },
        { points: [[211,462], [57,462], [57,621]], smooth: false },
        { points: [[56,460], [61,441], [83,436]], smooth: true },
        { points: [[82,439], [79,167]], smooth: false },
        { points: [[265,110], [372,106]], smooth: false },
        { points: [[432,174], [441,106], [372,106]], smooth: true },
        { points: [[85,813], [85,649]], smooth: false },
        { points: [[85,720], [152,722], [151,569]], smooth: false },
        { points: [[152,723], [152,815]], smooth: false },
        { points: [[240,624], [85,623], [83,521], [56,522]], smooth: false },
        { points: [[85,543], [215,544], [215,625]], smooth: false },
        { points: [[214,544], [212,461]], smooth: false },
        { points: [[152,463], [152,523]], smooth: false },
        { points: [[119,463], [88,460], [82,423]], smooth: true },
        { points: [[81,303], [214,303]], smooth: false },
        { points: [[269,301], [376,300]], smooth: false },
        { points: [[269,299], [267,324], [240,330]], smooth: true },
        { points: [[240,632], [319,632]], smooth: false },
        { points: [[240,551], [347,554], [347,529]], smooth: false },
        { points: [[347,554], [347,576]], smooth: false },
        { points: [[318,632], [321,380]], smooth: false },
        { points: [[243,755], [242,816], [204,815]], smooth: false },
        { points: [[539,433], [536,462]], smooth: false },
        { points: [[85,652], [61,647], [57,621]], smooth: true },
        { points: [[78,168], [59,164], [51,133], [73,110], [103,117], [110,142]], smooth: true },
        { points: [[406,432], [378,438], [375,482], [404,492]], smooth: true },
        { points: [[433,431], [432,462]], smooth: false },
        { points: [[271,685], [567,687]], smooth: false },
        { points: [[404,595], [422,603], [432,626], [414,629], [404,650], [395,629], [373,627], [382,606], [403,594]], smooth: true },
    ],
}

const FLOOR_DOORS = {
    'Social Commons-2': [
        {x1:245, y1:656, x2:245, y2:688},
        {x1:247, y1:788, x2:274, y2:788},
        {x1:239, y1:436, x2:223, y2:445},
        {x1:243, y1:625, x2:221, y2:626},
        {x1:155, y1:815, x2:187, y2:815},
        {x1:85, y1:562, x2:83, y2:544},
        {x1:76, y1:521, x2:56, y2:521},
        {x1:356, y1:300, x2:372, y2:300},
        {x1:272, y1:301, x2:290, y2:301},
        {x1:193, y1:303, x2:212, y2:303},
        {x1:114, y1:304, x2:130, y2:304},
        {x1:403, y1:596, x2:382, y2:606},
        {x1:319, y1:551, x2:318, y2:526},
        {x1:318, y1:574, x2:319, y2:553},
        {x1:208, y1:814, x2:239, y2:815},
        {x1:318, y1:791, x2:332, y2:789},
        {x1:384, y1:791, x2:401, y2:789},
        {x1:436, y1:792, x2:455, y2:792},
        {x1:474, y1:792, x2:489, y2:791},
        {x1:515, y1:792, x2:533, y2:792},
    ],
}

const FLOOR_STAIRS = {
    'Social Commons-2': [
        {x:539, y:490, w:26, h:138},
    ],
}

function wallPathD(points, smooth) {
    let d = `M ${points[0][0]} ${points[0][1]}`
    if (!smooth || points.length < 3) {
        for (let i = 1; i < points.length; i++) d += ` L ${points[i][0]} ${points[i][1]}`
        return d
    }
    for (let i = 1; i < points.length - 1; i++) {
        const mx = (points[i][0] + points[i + 1][0]) / 2
        const my = (points[i][1] + points[i + 1][1]) / 2
        d += ` Q ${points[i][0]} ${points[i][1]}, ${mx} ${my}`
    }
    const last = points[points.length - 1]
    d += ` L ${last[0]} ${last[1]}`
    return d
}

function doorPaths(d) {
    const dx = d.x2 - d.x1, dy = d.y2 - d.y1
    const doorW = Math.hypot(dx, dy) || 1
    const px = -dy / doorW, py = dx / doorW
    const leafX = d.x1 + px * doorW, leafY = d.y1 + py * doorW
    return {
        gap: `M ${d.x1} ${d.y1} L ${d.x2} ${d.y2}`,
        leaf: `M ${d.x1} ${d.y1} L ${leafX} ${leafY}`,
        arc: `M ${leafX} ${leafY} A ${doorW} ${doorW} 0 0 0 ${d.x2} ${d.y2}`,
    }
}

const NON_BOOKABLE = new Set([
    'SC-F0-WR', 'SC-F0-PR', 'SC-F0-EL',
    'SC-F0-PD-1', 'SC-F0-PD-2', 'SC-F0-PD-3', 'SC-F0-PD-4',
    'SC-F1-WR', 'SC-F1-EL', 'SC-F1-PD-1', 'SC-F1-PD-2', 'SC-F1-PD-3',
    'SC-F2-PD-1', 'SC-F2-EL', 'SC-F2-WR', 'SC-F2-MR', 'SC-F2-ER',
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
    { code: 'SC-F2-BT', x: 378, y: 274, w: 55, h: 50, label: 'Bibi Titi', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-PD-1', x: 220, y: 280, w: 45, h: 45, label: 'POD', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-VD', x: 270, y: 683, w: 297, h: 105, label: 'Vendors', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-FC', x: 324, y: 466, w: 212, h: 189, label: 'Food Court', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-EL', x: 381, y: 439, w: 50, h: 50, label: 'Elevator', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-WR', x: 239, y: 462, w: 83, h: 169, label: 'Washrooms', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-MR', x: 215, y: 463, w: 25, h: 161, label: 'Mechanical Room', building: 'Social Commons', floor: 2 },
    { code: 'SC-F2-ER', x: 543, y: 759, w: 54, h: 59, label: 'Electrical Room', building: 'Social Commons', floor: 2 },
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
    { code: 'LC-F1-WR', x: 345, y: 50, w: 50, h: 60, label: 'Washrooms', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-GM', x: 25, y: 120, w: 100, h: 60, label: 'Gambia', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-LB', x: 135, y: 120, w: 100, h: 60, label: 'Liberia', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-MZ', x: 245, y: 120, w: 100, h: 60, label: 'Mozambique', building: 'Learning Commons', floor: 1 },
    { code: 'LC-F1-MW', x: 355, y: 120, w: 100, h: 60, label: 'Malawi', building: 'Learning Commons', floor: 1 },
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

    useEffect(() => {
        if (currentBuilding && view === VIEW.CAMPUS) {
        enterBuilding(currentBuilding.building, currentBuilding.floor)
        }
    }, [currentBuilding])

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
            {GREEN_AREAS.map((g, i) => (
            <rect
                key={i}
                x={g.x} y={g.y} width={g.w} height={g.h} rx={g.rx}
                fill="#bbf7d0" opacity={0.6}
            />
            ))}

            {ROADS.map((r, i) => (
            <line
                key={i}
                x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                stroke={r.color} strokeWidth={r.width}
                strokeLinecap="round"
            />
            ))}

            <circle cx={284} cy={233} r={8} fill="#f59e0b"/>
            <text x={284} y={218} textAnchor="middle" fontSize={11} fill="#92400e" fontWeight="600">
            Main Entrance
            </text>

            <text x={325} y={218} textAnchor="middle" fontSize={10} fill="#64748b">
            Parking
            </text>

            {Object.entries(BUILDINGS).map(([name, bld]) => (
            <g
                key={name}
                onClick={() => enterBuilding(name)}
                style={{ cursor: 'pointer' }}
            >
                <polygon
                points={bld.outline.map(([x, y]) => `${x},${y}`).join(' ')}
                fill={bld.lightColour}
                stroke={bld.colour}
                strokeWidth={2.5}
                strokeLinejoin="round"
                />

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
            <text x={12} y={20} fontSize={12} fontWeight="600" fill={colour}>
                {activeFloor === 0 ? 'Ground Floor' : `Floor ${activeFloor}`}
            </text>

            <defs>
                <pattern id="stairHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.5" />
                </pattern>
            </defs>

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
                    {room.label === 'Elevator' && (
                    <g transform={`translate(${room.x + room.w / 2}, ${room.y + room.h / 2 - 12})`}>
                        <circle r={9} fill="white" stroke="#475569" strokeWidth={1.2} />
                        <path d="M 0,-5 L 3,-1 L -3,-1 Z" fill="#475569" />
                        <path d="M 0,5 L 3,1 L -3,1 Z" fill="#475569" />
                    </g>
                    )}
                    <text
                    x={room.x + room.w / 2}
                    y={room.y + room.h / 2 - (isNonBookable ? 0 : 8) + (room.label === 'Elevator' ? 14 : 0)}
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

            {(FLOOR_WALLS[`${activeBuilding}-${activeFloor}`] || []).map((w, i) => (
                <path
                    key={`wall-${i}`}
                    d={wallPathD(w.points, w.smooth)}
                    fill="none"
                    stroke="#94a3b8" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
                />
            ))}

            {(FLOOR_DOORS[`${activeBuilding}-${activeFloor}`] || []).map((d, i) => {
                const p = doorPaths(d)
                return (
                    <g key={`door-${i}`}>
                        <path d={p.gap} stroke="#f8fafc" strokeWidth={7} strokeLinecap="round" />
                        <path d={p.leaf} fill="none" stroke="#cbd5e1" strokeWidth={1.5} />
                        <path d={p.arc} fill="none" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 2" />
                    </g>
                )
            })}

            {(FLOOR_STAIRS[`${activeBuilding}-${activeFloor}`] || []).map((s, i) => (
                <g key={`stairs-${i}`}>
                    <rect
                        x={s.x} y={s.y} width={s.w} height={s.h} rx={2}
                        fill="url(#stairHatch)" stroke="#64748b" strokeWidth={1.5}
                    />
                    <g transform={`translate(${s.x + s.w / 2}, ${s.y + s.h / 2})`}>
                        <circle r={11} fill="white" stroke="#475569" strokeWidth={1.2} />
                        <path
                            d="M -6,6 L -6,3 L -3,3 L -3,0 L 0,0 L 0,-3 L 3,-3 L 3,-6 L 6,-6"
                            fill="none" stroke="#475569" strokeWidth={1.4}
                            strokeLinecap="round" strokeLinejoin="round"
                        />
                    </g>
                </g>
            ))}

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