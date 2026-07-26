import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CampusMap from '../components/CampusMap'
import { useGeolocation } from '../hooks/useGeolocation'
import { NOT_STUDENT_BOOKABLE } from '../data/nonBookableRooms'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// Assumed walking pace in metres/second, used to convert each step's real
// distance (from the backend) into how long the dot should take to reach
// it. ~1.2 m/s is a typical unhurried adult walking speed.
const WALKING_SPEED_MPS = 1.2
// Floor so a step with distance_to_next of 0 (two co-located nodes, e.g.
// a door right at a junction) still gets a moment on screen rather than
// flashing past instantly.
const MIN_STEP_MS = 600

// Motion detection: how often the countdown re-checks whether the phone
// is currently showing walking-like motion, how much recent accelerometer
// history it looks at to decide, and the variance threshold that
// separates "rhythmic walking bounce" from "held still, just sensor
// noise". This can only ever answer "is motion happening", not "is it
// the right direction" -- that needs a compass heading, which the web
// platform doesn't expose, so it isn't attempted here.
const MOTION_CHECK_INTERVAL_MS = 200
const MOTION_WINDOW_MS = 2000
const MOTION_WALKING_STD_DEV_THRESHOLD = 1.0
const MOTION_MIN_SAMPLES = 5

// Formats remaining distance/time for the navigation status bar, matching
// the pace convention used elsewhere (WALKING_SPEED_MPS). Only ever shown
// while a route is active and not yet arrived, so the near-zero case
// below is a defensive fallback rather than something the UI actually
// reaches in normal use.
function formatDistance(meters) {
  if (meters < 1) return 'almost there'
  return Math.round(meters) + 'm'
}
function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return Math.max(1, Math.round(totalSeconds)) + ' sec'
  return '~' + Math.round(totalSeconds / 60) + ' min'
}

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
  // Set once a ?find=<id> link resolves to a real node -- if currentNode
  // isn't known yet at that point, this just waits (see the effect below)
  // rather than failing, since sharing a link before setting your own
  // position is a completely normal thing to do.
  const [pendingFindTarget, setPendingFindTarget] = useState(null)
  // Brief feedback after tapping "Share my location" -- 'sharing' while
  // the request is in flight, 'copied'/'shared' after success, 'error' if
  // it fails. Not a persistent state, just a moment of confirmation.
  const [shareStatus, setShareStatus] = useState(null)
  // Motion tracking (accelerometer) -- whether the person has granted
  // permission (required explicitly on iOS, via a direct button tap) and
  // whether the API exists at all on this device/browser. isMovingRef and
  // motionSamplesRef are refs rather than state because they update many
  // times a second and don't need to trigger a re-render themselves --
  // only the actual step advancing (further below) does.
  const [motionPermissionGranted, setMotionPermissionGranted] = useState(false)
  const [motionSupported, setMotionSupported] = useState(true)
  const isMovingRef = useRef(true)
  const motionSamplesRef = useRef([])
  // True while any navigate() request is in flight -- covers both "finding
  // a fresh route" and "recalculating after a correction", distinguished
  // in the UI by whether isNavigating was already true when the request
  // started (captured per-call below, not read from state mid-flight).
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  // Walking distance to the currently selected room, shown in its detail
  // card before committing to navigate -- null while nothing's selected
  // or no position is set yet, so the UI can tell "no distance available"
  // apart from "distance is exactly 0".
  const [roomDistance, setRoomDistance] = useState(null)
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

  // Reads deep links on load: ?room=CODE shows that room's status
  // immediately (the same detail panel a normal search opens), ?position=
  // NODE_ID sets that as your current position directly, skipping "Set
  // position -> tap a node" entirely, ?find=SHARE_ID resolves a shared
  // location link (see enableShareLocation below) back to the node it
  // points at. All three are meant to be opened via a link someone
  // scanned or was sent -- nothing in CampusNav itself needs to know how
  // that link arrived. Runs once on mount, then cleans the URL so a page
  // refresh doesn't re-trigger any of it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomParam = params.get('room')
    const positionParam = params.get('position')
    const findParam = params.get('find')

    if (!roomParam && !positionParam && !findParam) return

    if (roomParam) {
      setSelectedRoom(roomParam)
    }
    if (positionParam) {
      setCurrentNode(positionParam)
    }
    if (findParam) {
      fetch(`${API}/location/${findParam}/`)
        .then(res => {
          if (!res.ok) throw new Error('Invalid or expired link')
          return res.json()
        })
        .then(data => setPendingFindTarget(data.node_id))
        .catch(err => {
          console.error('Failed to resolve shared location:', err)
          setError("This location link doesn't work anymore.")
        })
    }

    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  // Once a shared-location link has resolved to a real node AND we know
  // where the recipient currently is, navigate there automatically --
  // same as any other destination. If currentNode isn't set yet when the
  // link resolves, this just waits: the effect re-runs once currentNode
  // changes (e.g. after "Set position"), so nothing is lost, it only
  // fires the moment both pieces are actually available.
  useEffect(() => {
    if (!pendingFindTarget || !currentNode) return

    const navigateToSharedLocation = async () => {
      setIsCalculatingRoute(true)
      try {
        const res = await fetch(`${API}/navigate/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from_node: currentNode, to_node: pendingFindTarget })
        })
        const data = await res.json()

        if (data.error) {
          setError(data.error)
          return
        }

        setNavigationPath(data.path)
        setFloorChanges(data.floor_changes || [])
        setCurrentStepIndex(0)
        setDestination({ type: 'node', nodeId: pendingFindTarget })
        setIsNavigating(true)

      } catch (err) {
        setError('Could not connect to navigation server')
        console.error(err)
      } finally {
        setIsCalculatingRoute(false)
        setPendingFindTarget(null)
      }
    }

    navigateToSharedLocation()
  }, [pendingFindTarget, currentNode])

  // Must be called directly from a user gesture (a real button tap, not
  // inside an async chain triggered indirectly) -- iOS requires this
  // exact pattern before it will grant motion sensor access at all.
  const enableMotionTracking = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission()
        setMotionPermissionGranted(result === 'granted')
      } catch (err) {
        console.error('Motion permission request failed:', err)
        setMotionPermissionGranted(false)
      }
    } else if (typeof DeviceMotionEvent !== 'undefined') {
      // Browsers that support DeviceMotionEvent without an explicit
      // permission prompt (most non-iOS browsers) -- just start listening.
      setMotionPermissionGranted(true)
    } else {
      setMotionSupported(false)
    }
  }

  // Tracks whether the phone is currently showing walking-like motion --
  // rhythmic acceleration bounce, as opposed to being held still. This can
  // only answer "is motion happening", never "which direction", so it
  // pauses the auto-advance countdown below rather than trying to
  // estimate position from it.
  useEffect(() => {
    if (!motionPermissionGranted) return

    const handleMotion = (event) => {
      const acc = event.acceleration
      if (!acc || acc.x === null || acc.x === undefined) return
      const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2)
      const now = Date.now()
      motionSamplesRef.current.push({ t: now, magnitude })
      motionSamplesRef.current = motionSamplesRef.current.filter(s => now - s.t <= MOTION_WINDOW_MS)
    }

    window.addEventListener('devicemotion', handleMotion)

    const checkInterval = setInterval(() => {
      const samples = motionSamplesRef.current
      if (samples.length < MOTION_MIN_SAMPLES) {
        // Not enough data yet to judge -- fail open (assume moving)
        // rather than falsely freezing navigation before readings arrive.
        isMovingRef.current = true
        return
      }
      const mags = samples.map(s => s.magnitude)
      const mean = mags.reduce((a, b) => a + b, 0) / mags.length
      const variance = mags.reduce((a, b) => a + (b - mean) ** 2, 0) / mags.length
      isMovingRef.current = Math.sqrt(variance) > MOTION_WALKING_STD_DEV_THRESHOLD
    }, MOTION_CHECK_INTERVAL_MS)

    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      clearInterval(checkInterval)
    }
  }, [motionPermissionGranted])

  const filteredRooms = searchQuery
    ? rooms.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Selecting a room now only shows its info (and fetches a distance
  // preview) rather than immediately starting navigation -- navigation
  // only begins when the person explicitly taps "Navigate here" below.
  // This matters for anyone who just wants to check a room's status or
  // book it without committing to a route right away.
  const handleRoomSelect = async (roomCode) => {
    setSelectedRoom(roomCode)
    setSearchQuery('')
    setError(null)
    setRoomDistance(null)

    if (!currentNode) {
      return
    }

    // Fetches distance for the preview card only -- does not touch
    // navigationPath or isNavigating. A separate, deliberately duplicate
    // call happens in handleNavigateToRoom when actually navigating,
    // rather than caching this response, so that's always correct even
    // if currentNode changes between selecting and navigating.
    try {
      const res = await fetch(`${API}/navigate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_node: currentNode, to_room: roomCode })
      })
      const data = await res.json()
      if (!data.error) {
        setRoomDistance(data.total_distance)
      }
    } catch (err) {
      // Silent here -- this is just a preview number, not worth
      // surfacing an error for; the real navigate attempt (below) still
      // shows its own error normally if something's actually wrong.
      console.error('Failed to fetch room distance preview:', err)
    }
  }

  const handleNavigateToRoom = async (roomCode) => {
    setError(null)
    if (!currentNode) {
      return
    }

    setIsCalculatingRoute(true)
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
    } finally {
      setIsCalculatingRoute(false)
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
      setIsCalculatingRoute(true)
      try {
        const body = {
          from_point: { x, y, floor, building },
          ...(destination.type === 'room'
            ? { to_room: destination.code }
            : destination.type === 'node'
            ? { to_node: destination.nodeId }
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
      } finally {
        setIsCalculatingRoute(false)
      }
      return
    }

    setSelectedRoom(null)
    setSearchQuery('')

    if (!currentNode) {
      return
    }

    setIsCalculatingRoute(true)
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
    } finally {
      setIsCalculatingRoute(false)
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

  // Shares the current position as a link -- saves currentNode on the
  // backend, gets back a short id, builds a URL with it, then hands that
  // to the native share sheet (navigator.share, works on mobile browsers
  // including iOS Safari) if available, or just copies it to the
  // clipboard otherwise (most desktop browsers). Either way the recipient
  // ends up with a link that, once opened, resolves via the effect above
  // and navigates to this exact spot -- reusing the same navigate()
  // pipeline as any other destination, just fed a saved node instead of
  // a room code.
  const handleShareLocation = async () => {
    if (!currentNode) return
    setShareStatus('sharing')
    try {
      const res = await fetch(`${API}/location/share/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: currentNode }),
      })
      const data = await res.json()
      if (data.error) {
        setShareStatus('error')
        return
      }

      const shareUrl = `${window.location.origin}${window.location.pathname}?find=${data.id}`

      if (navigator.share) {
        await navigator.share({ title: 'Find me on CampusNav', url: shareUrl })
        setShareStatus('shared')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShareStatus('copied')
      }
    } catch (err) {
      // navigator.share throws if the person cancels the share sheet --
      // that's a normal dismissal, not a real error, so don't show one.
      if (err.name !== 'AbortError') {
        console.error('Failed to share location:', err)
        setShareStatus('error')
      } else {
        setShareStatus(null)
      }
    }
    setTimeout(() => setShareStatus(null), 3000)
  }

  const hasArrived = isNavigating && currentStepIndex === navigationPath.length - 1

  // Auto-advances the current step on a countdown sized to that step's
  // real walking distance, so the dot moves on its own at a normal pace --
  // no tap required under normal conditions. Unlike a plain setTimeout,
  // this ticks down in small increments (checking motion each tick)
  // rather than firing once at a fixed delay, specifically so it CAN be
  // paused: if motion tracking is enabled and the phone isn't currently
  // showing walking-like movement, the tick is skipped rather than
  // counted, so someone who's stopped doesn't see the dot keep gliding
  // ahead of them. If motion tracking was never enabled (or isn't
  // supported), this falls back to counting down unconditionally, same
  // as before -- it should never require the permission to function, only
  // improve on it. If you're off track, tapping the map (handleMapClick)
  // still recalculates and resets this from the real point regardless.
  useEffect(() => {
    if (!isNavigating || hasArrived) return
    const currentStep = navigationPath[currentStepIndex]
    if (!currentStep) return

    let remainingMs = Math.max(
      MIN_STEP_MS,
      (currentStep.distance_to_next / WALKING_SPEED_MPS) * 1000
    )

    const tick = setInterval(() => {
      const shouldCountDown = !motionPermissionGranted || isMovingRef.current
      if (shouldCountDown) {
        remainingMs -= MOTION_CHECK_INTERVAL_MS
      }
      if (remainingMs <= 0) {
        clearInterval(tick)
        const nextIndex = currentStepIndex + 1
        if (nextIndex < navigationPath.length) {
          setCurrentStepIndex(nextIndex)
          setCurrentNode(navigationPath[nextIndex].id)
        }
      }
    }, MOTION_CHECK_INTERVAL_MS)

    return () => clearInterval(tick)
  }, [isNavigating, currentStepIndex, navigationPath, hasArrived, motionPermissionGranted])

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
  const notBookable = selectedRoomData
    ? NOT_STUDENT_BOOKABLE.has(selectedRoomData.name)
    : false
  const nextStepNode = isNavigating ? navigationPath[currentStepIndex + 1] : null
  const remainingMeters = isNavigating
    ? navigationPath.slice(currentStepIndex).reduce((sum, step) => sum + (step.distance_to_next || 0), 0)
    : 0
  const remainingSeconds = remainingMeters / WALKING_SPEED_MPS
  
  return (
    <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '10px'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b' }}>
          CampusNav
        </h1>
        {/* Status only, nothing tappable -- position, GPS, and motion
            tracking (once already granted) are informational, kept small
            and secondary so the actual buttons below aren't competing
            with them for attention. */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {currentNode && !isNavigating && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', color: '#64748b', padding: '3px 7px',
              background: '#f1f5f9', borderRadius: '5px'
            }}>
              <IconPin size={9} color="#64748b" /> <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{currentNode}</span>
            </span>
          )}

          {position && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', color: '#16a34a', padding: '3px 7px',
              background: '#dcfce7', borderRadius: '5px'
            }}>
              <StatusDot color="#16a34a" /> GPS
            </span>
          )}
          {gpsError && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', color: '#dc2626', padding: '3px 7px',
              background: '#fee2e2', borderRadius: '5px'
            }}>
              <StatusDot color="#dc2626" /> No GPS
            </span>
          )}
          {motionPermissionGranted && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', color: '#16a34a', padding: '3px 7px',
              background: '#dcfce7', borderRadius: '5px'
            }}>
              <StatusDot color="#16a34a" /> Motion
            </span>
          )}
        </div>
      </div>

      {/* Actions row -- the things you actually tap, kept visually
          distinct and larger than the status badges above so they're
          easy to find rather than blending into a row of status text. */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap',
        paddingTop: '10px', marginBottom: '16px',
        borderTop: '1px solid #f1f5f9',
      }}>
        {!isNavigating && (
          <button
            onClick={() => setSettingPosition(!settingPosition)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: settingPosition ? '#7c3aed' : '#e2e8f0',
              color: settingPosition ? 'white' : '#475569',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              flex: '1', justifyContent: 'center', minWidth: '140px',
            }}
          >
            {settingPosition ? 'Tap a node...' : (<><IconPin size={13} /> Set position</>)}
          </button>
        )}
        {isNavigating && (
          <button
            onClick={stopNavigation}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: '#dc2626', color: 'white',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              flex: '1', justifyContent: 'center', minWidth: '140px',
            }}
          >
            <IconClose size={12} /> Stop navigation
          </button>
        )}

        {currentNode && !isNavigating && (
          <button
            onClick={handleShareLocation}
            disabled={shareStatus === 'sharing'}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: '#eff6ff', color: '#1d4ed8',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              flex: '1', justifyContent: 'center', minWidth: '140px',
            }}
          >
            {shareStatus === 'sharing' && 'Sharing...'}
            {shareStatus === 'copied' && 'Link copied!'}
            {shareStatus === 'shared' && 'Shared!'}
            {shareStatus === 'error' && "Couldn't share"}
            {!shareStatus && 'Share my location'}
          </button>
        )}

        {motionSupported && !motionPermissionGranted && (
          <button
            onClick={enableMotionTracking}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: '#f1f5f9', color: '#475569',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              flex: '1', justifyContent: 'center', minWidth: '140px',
            }}
          >
            Enable motion tracking
          </button>
        )}
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

      {!isNavigating && isCalculatingRoute && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          color: '#1d4ed8', fontSize: '13px', display: 'flex',
          alignItems: 'center', gap: '8px',
        }}>
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            border: '2px solid #bfdbfe', borderTopColor: '#1d4ed8',
            animation: 'spin 0.8s linear infinite', display: 'inline-block',
          }} />
          Finding route...
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
                {!hasArrived && ` \u00b7 ${formatDistance(remainingMeters)}, ${formatDuration(remainingSeconds)} left`}
              </span>
            </div>
            {floorChanges.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#7c3aed' }}>
                <IconArrowUp size={10} color="#7c3aed" /> Floor change via {floorChanges[0].type}
              </span>
            )}
          </div>

          {!hasArrived && isCalculatingRoute && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1d4ed8' }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                border: '2px solid #bfdbfe', borderTopColor: '#1d4ed8',
                animation: 'spin 0.8s linear infinite', display: 'inline-block',
              }} />
              Recalculating...
            </div>
          )}

          {!hasArrived && !isCalculatingRoute && (
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
        onNavigateToRoom={handleNavigateToRoom}
        onBookRoom={(code) => navigate(`/book/${code}`)}
      />

      {false && selectedRoom && selectedRoomData && !isNavigating && (
        <div style={{
          marginTop: '12px', padding: '16px', background: 'white',
          borderRadius: '8px', border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
            {selectedRoomData.name}
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '10px' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{selectedRoomData.code}</span> · Floor {selectedRoomData.floor} · Capacity {selectedRoomData.capacity}
            {roomDistance !== null && (
              <> · {formatDistance(roomDistance)} ({formatDuration(roomDistance / WALKING_SPEED_MPS)} walk)</>
            )}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
              background: notBookable ? '#e2e8f0' : (selectedRoomData.is_available ? '#dcfce7' : '#fee2e2'),
              color: notBookable ? '#475569' : (selectedRoomData.is_available ? '#16a34a' : '#dc2626')
            }}>
              {notBookable ? 'Not bookable' : (selectedRoomData.is_available ? 'Available now' : 'Currently booked')}
            </span>
            {currentNode && (
              <button
                onClick={() => handleNavigateToRoom(selectedRoomData.code)}
                style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                  fontWeight: '500', border: 'none', cursor: 'pointer',
                  background: '#1d4ed8', color: 'white'
                }}
              >
                Navigate here
              </button>
            )}
            {!notBookable && selectedRoomData.is_available && (
              <button
                onClick={() => navigate(`/book/${selectedRoomData.code}`)}
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
          {!currentNode && (
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
              Set your position to see walking distance and get directions here.
            </p>
          )}
        </div>
      )}

    </div>
  )
}

export default Home