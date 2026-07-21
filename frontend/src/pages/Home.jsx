import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CampusMap from '../components/CampusMap'
import { useGeolocation } from '../hooks/useGeolocation'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// Assumed walking pace in metres/second, used to convert each step's real
// distance (from the backend) into how long the dot should take to reach
// it. ~1.2 m/s is a typical unhurried adult walking speed.
const WALKING_SPEED_MPS = 1.2
// Floor so a step with distance_to_next of 0 (two co-located nodes, e.g.
// a door right at a junction) still gets a moment on screen rather than
// flashing past instantly.
const MIN_STEP_MS = 600

// Turns a step's raw node info into something readable in a prompt --
// infrastructure nodes (stairs/elevator/entrance) mostly have unhelpful
// IDs as labels (e.g. "SC-F2-STAIRS-33"), so name the type instead where
// that's more useful than the literal label.
function describeStep(node) {
  if (!node) return null
  if (node.type === 'staircase') return 'the stairs'
  if (node.type === 'elevator') return 'the elevator'
  if (node.type === 'building_entry') return 'the building entrance'
  return node.label
}

// Small inline icons replacing emoji -- drawn to match the map's own
// line-icon language (elevator/stairs badges) rather than generic
// pictograms, so the chrome and the map read as one designed system.
const IconPin = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12 21.5C12 21.5 5.5 14.5 5.5 9.5C5.5 5.91 8.41 3 12 3C15.59 3 18.5 5.91 18.5 9.5C18.5 14.5 12 21.5 12 21.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.3" fill={color} />
  </svg>
)

const IconClose = ({ size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 5 L19 19 M19 5 L5 19" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
)

const IconArrowUp = ({ size = 11, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12 19 V5 M5 11 L12 4 L19 11" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// GPS status is a plain dot, not a satellite pictogram -- the same
// "small coloured circle means status" convention used for room
// availability elsewhere in the app, so it reads as one system.
const StatusDot = ({ color }) => (
  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
)

function Home() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [roomsLoadError, setRoomsLoadError] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [navigationPath, setNavigationPath] = useState([])
  const [currentNode, setCurrentNode] = useState(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [settingPosition, setSettingPosition] = useState(false)
  const [floorChanges, setFloorChanges] = useState([])
  const [error, setError] = useState(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  // NEW: remembers what the current route is actually headed to, so a
  // correction tap (see handleMapClick) knows what to recalculate towards
  // -- independent of whether the original target was a named room or an
  // arbitrary tapped point.
  const [destination, setDestination] = useState(null)
  // Explicit opt-in for "the dot is wrong, I'm actually here" -- when
  // true, the NEXT map tap is treated as a position correction instead
  // of a new destination. Mirrors how settingPosition already works.
  const [correctingPosition, setCorrectingPosition] = useState(false)
  const { position, currentBuilding, error: gpsError } = useGeolocation()

  useEffect(() => {
    if (currentBuilding && !currentNode) {
      setCurrentNode(currentBuilding.nodeId)
    }
  }, [currentBuilding, currentNode])

  useEffect(() => {
    fetch(`${API}/rooms/`)
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`)
        return res.json()
      })
      .then(data => {
        setRooms(data)
        setRoomsLoadError(false)
      })
      .catch(err => {
        console.error('Failed to fetch rooms:', err)
        setRoomsLoadError(true)
      })
  }, [])

  // Reads QR-code deep links on load: ?room=CODE shows that room's status
  // immediately (the same detail panel a normal search opens), ?position=
  // NODE_ID sets that as your current position directly, skipping "Set
  // position -> tap a node" entirely. Both are meant to be scanned with
  // the phone's own camera app -- a QR code is just a URL, so nothing in
  // CampusNav itself needs to know how to scan anything. Runs once on
  // mount, then cleans the URL so a page refresh doesn't re-trigger it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomParam = params.get('room')
    const positionParam = params.get('position')

    if (!roomParam && !positionParam) return

    if (roomParam) {
      setSelectedRoom(roomParam)
    }
    if (positionParam) {
      setCurrentNode(positionParam)
    }

    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  const filteredRooms = searchQuery
    ? rooms.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleRoomSelect = async (roomCode) => {
    setSelectedRoom(roomCode)
    setSearchQuery('')
    setError(null)

    if (!currentNode) {
      return
    }

    try {
      const res = await fetch(`${API}/navigate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_node: currentNode, to_room: roomCode })
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setNavigationPath([])
        return
      }

      setNavigationPath(data.path)
      setFloorChanges(data.floor_changes || [])
      setCurrentStepIndex(0)
      setDestination({ type: 'room', code: roomCode })
      setIsNavigating(true)

    } catch (err) {
      setError('Could not connect to navigation server')
      console.error(err)
    }
  }

  // A normal map tap ALWAYS means "take me here" -- whether or not a
  // route is already active. No hidden second meaning depending on state,
  // which is what made this confusing for anyone unfamiliar with the app:
  // there was previously no visual cue distinguishing "tap = new
  // destination" from "tap = I'm actually here", so a guest tapping to
  // change where they're headed could silently get treated as a position
  // correction instead. Correction now requires the explicit opt-in below
  // (correctingPosition), the same pattern "Set position" already uses.
  const handleMapClick = async (x, y, building, floor) => {
    setError(null)

    if (correctingPosition && isNavigating && destination) {
      setCorrectingPosition(false)
      try {
        const body = {
          from_point: { x, y, floor, building },
          ...(destination.type === 'room'
            ? { to_room: destination.code }
            : { to_point: destination.point }),
        }
        const res = await fetch(`${API}/navigate/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()

        if (data.error) {
          setError(data.error)
          return
        }

        setNavigationPath(data.path)
        setFloorChanges(data.floor_changes || [])
        setCurrentStepIndex(0)
        setCurrentNode(data.start)

      } catch (err) {
        setError('Could not connect to navigation server')
        console.error(err)
      }
      return
    }

    setSelectedRoom(null)
    setSearchQuery('')

    if (!currentNode) {
      return
    }

    try {
      const res = await fetch(`${API}/navigate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_node: currentNode,
          to_point: { x, y, floor, building }
        })
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setNavigationPath([])
        return
      }

      setNavigationPath(data.path)
      setFloorChanges(data.floor_changes || [])
      setCurrentStepIndex(0)
      setDestination({ type: 'point', point: { x, y, floor, building } })
      setIsNavigating(true)

    } catch (err) {
      setError('Could not connect to navigation server')
      console.error(err)
    }
  }

  const handleNodeClick = (nodeId) => {
    if (settingPosition) {
      setCurrentNode(nodeId)
      setSettingPosition(false)
      setNavigationPath([])
      setIsNavigating(false)
      setSelectedRoom(null)
      setError(null)
    }
  }

  // Manual "skip ahead" -- kept available for anyone walking faster than
  // the timer assumes, or who's just confident about the next step. Not
  // required for normal use any more, since the effect below advances on
  // its own; this just lets you jump the queue early if you want to.
  const handleConfirmStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex >= navigationPath.length) return
    setCurrentStepIndex(nextIndex)
    setCurrentNode(navigationPath[nextIndex].id)
  }

  const hasArrived = isNavigating && currentStepIndex === navigationPath.length - 1

  // Auto-advances the current step on a timer sized to that step's real
  // walking distance, so the dot moves on its own at a normal pace --
  // no tap required under normal conditions. currentStepIndex is a
  // dependency, so every time it changes (whether from this timer or the
  // manual skip-ahead button), the cleanup below clears the old timer
  // before a fresh one is scheduled for the new step. If you're off
  // track, tapping the map (handleMapClick, above) recalculates and
  // resets this from the real point instead of waiting the old timer out.
  useEffect(() => {
    if (!isNavigating || hasArrived) return
    const currentStep = navigationPath[currentStepIndex]
    if (!currentStep) return

    const durationMs = Math.max(
      MIN_STEP_MS,
      (currentStep.distance_to_next / WALKING_SPEED_MPS) * 1000
    )

    const timer = setTimeout(() => {
      const nextIndex = currentStepIndex + 1
      if (nextIndex < navigationPath.length) {
        setCurrentStepIndex(nextIndex)
        setCurrentNode(navigationPath[nextIndex].id)
      }
    }, durationMs)

    return () => clearTimeout(timer)
  }, [isNavigating, currentStepIndex, navigationPath, hasArrived])

  const stopNavigation = () => {
    setIsNavigating(false)
    setNavigationPath([])
    setFloorChanges([])
    setSelectedRoom(null)
    setError(null)
    setCurrentStepIndex(0)
    setDestination(null)
    setCorrectingPosition(false)
  }

  const selectedRoomData = rooms.find(r => r.code === selectedRoom)
  const nextStepNode = isNavigating ? navigationPath[currentStepIndex + 1] : null
  
  return (
    <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b' }}>
          CampusNav
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {currentNode && !isNavigating && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', color: '#64748b', padding: '4px 8px',
              background: '#f1f5f9', borderRadius: '6px'
            }}>
              <IconPin size={10} color="#64748b" /> <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{currentNode}</span>
            </span>
          )}

          {position && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', color: '#16a34a', padding: '4px 8px',
              background: '#dcfce7', borderRadius: '6px'
            }}>
              <StatusDot color="#16a34a" /> GPS active
            </span>
          )}
          {gpsError && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', color: '#dc2626', padding: '4px 8px',
              background: '#fee2e2', borderRadius: '6px'
            }}>
              <StatusDot color="#dc2626" /> No GPS
            </span>
          )}

          {!isNavigating && (
            <button
              onClick={() => setSettingPosition(!settingPosition)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: settingPosition ? '#7c3aed' : '#e2e8f0',
                color: settingPosition ? 'white' : '#475569',
                fontWeight: '600', cursor: 'pointer', fontSize: '13px'
              }}
            >
              {settingPosition ? 'Tap a node...' : (<><IconPin size={12} /> Set position</>)}
            </button>
          )}
          {isNavigating && (
            <button
              onClick={stopNavigation}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: '#dc2626', color: 'white',
                fontWeight: '600', cursor: 'pointer', fontSize: '13px'
              }}
            >
              <IconClose size={11} /> Stop navigation
            </button>
          )}
        </div>
      </div>

      {settingPosition && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#f3e8ff', border: '1px solid #d8b4fe',
          color: '#7c3aed', fontSize: '13px', fontWeight: '500'
        }}>
          Purple dots show junction nodes. Tap one to set your position.
        </div>
      )}

      {!currentNode && !settingPosition && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#fff7ed', border: '1px solid #fed7aa',
          color: '#c2410c', fontSize: '13px'
        }}>
          Tap <strong>Set position</strong> then tap a node on the map before navigating.
          Lost? Look for a QR code posted nearby and scan it with your phone's camera.
          No app steps needed, it sets your position instantly.
        </div>
      )}

      {!isNavigating && roomsLoadError && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#fee2e2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: '13px'
        }}>
          Couldn't load the room list. Search won't find anything until this is fixed. Check that the backend server is running.
        </div>
      )}

      {!isNavigating && (
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search for a room..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', fontSize: '15px',
              borderRadius: '8px', border: '1px solid #cbd5e1',
              boxSizing: 'border-box', outline: 'none'
            }}
          />
          {filteredRooms.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100, maxHeight: '240px', overflowY: 'auto'
            }}>
              {filteredRooms.map(room => (
                <div
                  key={room.code}
                  onClick={() => handleRoomSelect(room.code)}
                  style={{
                    padding: '10px 16px', cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div>
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>
                      {room.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {room.code}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                    background: room.is_available ? '#dcfce7' : '#fee2e2',
                    color: room.is_available ? '#16a34a' : '#dc2626'
                  }}>
                    {room.is_available ? 'Available' : 'Booked'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {searchQuery && filteredRooms.length === 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100, padding: '14px 16px',
              fontSize: '13px', color: '#94a3b8',
            }}>
              No rooms match "{searchQuery}". Check the spelling, or this room may not be mapped yet.
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#fee2e2', color: '#dc2626', fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* Navigation status bar -- auto-advances on its own now; the button
          here is an optional skip-ahead, not a required confirmation. */}
      {isNavigating && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '12px',
          background: hasArrived ? '#f0fdf4' : '#eff6ff',
          border: hasArrived ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: hasArrived ? 0 : '6px',
          }}>
            <div>
              <span style={{
                fontWeight: '600', fontSize: '14px',
                color: hasArrived ? '#16a34a' : '#1d4ed8',
              }}>
                {hasArrived
                  ? `You've arrived at ${selectedRoomData ? selectedRoomData.name : 'your destination'}`
                  : `Navigating to ${selectedRoomData ? selectedRoomData.name : 'selected point'}`}
              </span>
              <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>
                step {currentStepIndex + 1} of {navigationPath.length}
              </span>
            </div>
            {floorChanges.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#7c3aed' }}>
                <IconArrowUp size={10} color="#7c3aed" /> Floor change via {floorChanges[0].type}
              </span>
            )}
          </div>

          {!hasArrived && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#334155' }}>
                  Heading to {describeStep(nextStepNode)}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setCorrectingPosition(c => !c)}
                    style={{
                      padding: '5px 12px', borderRadius: '8px',
                      border: correctingPosition ? 'none' : '1px solid #bfdbfe',
                      background: correctingPosition ? '#7c3aed' : 'white',
                      color: correctingPosition ? 'white' : '#1d4ed8',
                      fontWeight: '500', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {correctingPosition ? 'Tap the map...' : "I'm somewhere else"}
                  </button>
                  <button
                    onClick={handleConfirmStep}
                    style={{
                      padding: '5px 12px', borderRadius: '8px', border: '1px solid #bfdbfe',
                      background: 'white', color: '#1d4ed8',
                      fontWeight: '500', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    Skip ahead
                  </button>
                </div>
              </div>
              {correctingPosition && (
                <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '4px', fontWeight: '500' }}>
                  Tap where you actually are on the map below
                </div>
              )}
            </>
          )}
        </div>
      )}

      <CampusMap
        rooms={rooms}
        highlightedRoom={selectedRoom}
        navigationPath={navigationPath}
        currentNodeId={currentNode}
        settingPosition={settingPosition}
        onRoomClick={handleRoomSelect}
        onNodeClick={handleNodeClick}
        onMapClick={handleMapClick}
      />

      {selectedRoom && selectedRoomData && !isNavigating && (
        <div style={{
          marginTop: '12px', padding: '16px', background: 'white',
          borderRadius: '8px', border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
            {selectedRoomData.name}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '10px' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{selectedRoomData.code}</span> · Floor {selectedRoomData.floor} · Capacity {selectedRoomData.capacity}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
              background: selectedRoomData.is_available ? '#dcfce7' : '#fee2e2',
              color: selectedRoomData.is_available ? '#16a34a' : '#dc2626'
            }}>
              {selectedRoomData.is_available ? 'Available now' : 'Currently booked'}
            </span>
            {currentNode && (
              <button
                onClick={() => handleRoomSelect(selectedRoomData.code)}
                style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: '500', border: 'none', cursor: 'pointer',
                  background: '#1d4ed8', color: 'white'
                }}
              >
                Navigate here
              </button>
            )}
            {selectedRoomData.is_available && (
              <button
                onClick={() => navigate(`/book?room=${selectedRoomData.code}`)}
                style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: '500', border: 'none', cursor: 'pointer',
                  background: '#16a34a', color: 'white'
                }}
              >
                Book this room
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default Home