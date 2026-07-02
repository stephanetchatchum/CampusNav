import { useState, useEffect } from 'react'
import Map2D from '../components/Map2D'

const API = 'http://127.0.0.1:8000/api'

function Home() {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [navigationPath, setNavigationPath] = useState([])
  const [currentNode, setCurrentNode] = useState(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [settingPosition, setSettingPosition] = useState(false)
  const [floorChanges, setFloorChanges] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API}/rooms/`)
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(err => console.error('Failed to fetch rooms:', err))
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
      setError('Please set your position first — tap the 📍 button then tap a node on the map')
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

  const stopNavigation = () => {
    setIsNavigating(false)
    setNavigationPath([])
    setFloorChanges([])
    setSelectedRoom(null)
    setError(null)
  }

  const selectedRoomData = rooms.find(r => r.code === selectedRoom)

  return (
    <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b' }}>
          CampusNav
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Current node indicator */}
          {currentNode && !isNavigating && (
            <span style={{
              fontSize: '11px', color: '#64748b', padding: '4px 8px',
              background: '#f1f5f9', borderRadius: '6px'
            }}>
              📍 {currentNode}
            </span>
          )}
          {/* Set position button */}
          {!isNavigating && (
            <button
              onClick={() => setSettingPosition(!settingPosition)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: settingPosition ? '#7c3aed' : '#e2e8f0',
                color: settingPosition ? 'white' : '#475569',
                fontWeight: '600', cursor: 'pointer', fontSize: '13px'
              }}
            >
              {settingPosition ? '👆 Tap a node...' : '📍 Set position'}
            </button>
          )}
          {/* Stop navigation button */}
          {isNavigating && (
            <button
              onClick={stopNavigation}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: '#dc2626', color: 'white',
                fontWeight: '600', cursor: 'pointer', fontSize: '13px'
              }}
            >
              ✕ Stop navigation
            </button>
          )}
        </div>
      </div>

      {/* Position setting hint */}
      {settingPosition && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#f3e8ff', border: '1px solid #d8b4fe',
          color: '#7c3aed', fontSize: '13px', fontWeight: '500'
        }}>
          Purple dots show junction nodes — tap one to set your position
        </div>
      )}

      {/* No position set warning */}
      {!currentNode && !settingPosition && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#fff7ed', border: '1px solid #fed7aa',
          color: '#c2410c', fontSize: '13px'
        }}>
          Tap <strong>📍 Set position</strong> then tap a node on the map before navigating
        </div>
      )}

      {/* Search bar — hidden during active navigation */}
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
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>
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
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#fee2e2', color: '#dc2626', fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* Navigation status bar */}
      {isNavigating && selectedRoomData && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '12px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <span style={{ fontWeight: '600', color: '#1d4ed8', fontSize: '14px' }}>
              Navigating to {selectedRoomData.name}
            </span>
            <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>
              {navigationPath.length} steps
            </span>
          </div>
          {floorChanges.length > 0 && (
            <span style={{ fontSize: '12px', color: '#7c3aed' }}>
              ⬆ Floor change via {floorChanges[0].type}
            </span>
          )}
        </div>
      )}

      {/* Map */}
      <Map2D
        rooms={rooms}
        highlightedRoom={selectedRoom}
        navigationPath={navigationPath}
        currentNodeId={currentNode}
        settingPosition={settingPosition}
        onRoomClick={handleRoomSelect}
        onNodeClick={handleNodeClick}
      />

      {/* Room detail panel */}
      {selectedRoom && selectedRoomData && !isNavigating && (
        <div style={{
          marginTop: '12px', padding: '16px', background: 'white',
          borderRadius: '8px', border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
            {selectedRoomData.name}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '10px' }}>
            {selectedRoomData.code} · Floor {selectedRoomData.floor} · Capacity {selectedRoomData.capacity}
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
          </div>
        </div>
      )}

    </div>
  )
}

export default Home