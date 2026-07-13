import { useState, useEffect, useCallback } from "react";

const GEOFENCES = [
    // ── SOCIAL COMMONS FLOOR 2 ──────────────────────────────────
    {
        id: 'SC-ENT-F2-MAIN',
        building: 'Social Commons',
        floor: 2,
        nodeId: 'SC-F2-ENTRY-10',
        label: 'Social Commons Floor 2 — parking entrance',
        lat_min: -1.930354, lat_max: -1.930154,
        lng_min: 30.153128, lng_max: 30.153328,
    },

    // ── SOCIAL COMMONS FLOOR 1 ──────────────────────────────────
    {
        id: 'SC-ENT-F1-A',
        building: 'Social Commons',
        floor: 1,
        nodeId: 'SC-F1-ENTRY-11',
        label: 'Social Commons Floor 1 — entrance A',
        lat_min: -1.930454, lat_max: -1.930254,  // update on campus walk
        lng_min: 30.153128, lng_max: 30.153328,
    },
    {
        id: 'SC-ENT-F1-B',
        building: 'Social Commons',
        floor: 1,
        nodeId: 'SC-F1-ENTRY-13',
        label: 'Social Commons Floor 1 — entrance B (elevator side)',
        lat_min: -1.930454, lat_max: -1.930254,  // update on campus walk
        lng_min: 30.153228, lng_max: 30.153428,
    },

    // ── SOCIAL COMMONS FLOOR 0 ──────────────────────────────────
    {
        id: 'SC-ENT-F0-A',
        building: 'Social Commons',
        floor: 0,
        nodeId: 'SC-F0-ENTRY-16',
        label: 'Social Commons Ground — entrance A',
        lat_min: -1.930454, lat_max: -1.930254,  // update on campus walk
        lng_min: 30.153128, lng_max: 30.153328,
    },
    {
        id: 'SC-ENT-F0-B',
        building: 'Social Commons',
        floor: 0,
        nodeId: 'SC-F0-ENTRY-18',
        label: 'Social Commons Ground — entrance B',
        lat_min: -1.930554, lat_max: -1.930354,  // update on campus walk
        lng_min: 30.153128, lng_max: 30.153328,
    },
    {
        id: 'SC-ENT-F0-C',
        building: 'Social Commons',
        floor: 0,
        nodeId: 'SC-F0-ENTRY-21',
        label: 'Social Commons Ground — entrance C',
        lat_min: -1.930654, lat_max: -1.930454,  // update on campus walk
        lng_min: 30.153128, lng_max: 30.153328,
    },
    {
        id: 'SC-ENT-F0-D',
        building: 'Social Commons',
        floor: 0,
        nodeId: 'SC-F0-ENTRY-24',
        label: 'Social Commons Ground — entrance D',
        lat_min: -1.930754, lat_max: -1.930554,  // update on campus walk
        lng_min: 30.153128, lng_max: 30.153328,
    },

    // ── ENTERPRISE COMMONS ───────────────────────────────────────
    // Add after EC nodes are built
    {
        id: 'EC-ENT-F2-MAIN',
        building: 'Enterprise Commons',
        floor: 2,
        nodeId: 'EC-F2-ENTRY-1',  // update when EC nodes done
        label: 'Enterprise Commons Floor 2 entrance',
        lat_min: -1.930706, lat_max: -1.930506,
        lng_min: 30.153330, lng_max: 30.153530,
    },

    // ── LEARNING COMMONS ─────────────────────────────────────────
    // Add after LC nodes are built
    {
        id: 'LC-ENT-F0-MAIN',
        building: 'Learning Commons',
        floor: 0,
        nodeId: 'LC-F0-ENTRY-1',  // update when LC nodes done
        label: 'Learning Commons Ground entrance',
        lat_min: -1.930806, lat_max: -1.930606,
        lng_min: 30.153430, lng_max: 30.153630,
    },
]

function isInsideGeofence(lat, lng, fence) {
    return(
        lat >= fence.lat_min &&
        lat <= fence.lat_max &&
        lng >= fence.lng_min &&
        lng <= fence.lng_max
    )
}

export function useGeolocation() {
    const [position, setPosition] = useState(null)        // { lat, lng, accuracy }
    const [currentBuilding, setCurrentBuilding] = useState(null)  // geofence object
    const [error, setError] = useState(null)
    const [watching, setWatching] = useState(false)

    const checkGeofences = useCallback((lat, lng) => {
        for (const fence of GEOFENCES) {
        if (isInsideGeofence(lat, lng, fence)) {
            return fence
        }
        }
        return null
    }, [])

    useEffect(() => {
        if (!navigator.geolocation) {
        setError('Geolocation not supported on this device')
        return
        }

        setWatching(true)

        // Watch position continuously
        const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            const accuracy = pos.coords.accuracy

            setPosition({ lat, lng, accuracy })

            // Check if inside any building geofence
            const fence = checkGeofences(lat, lng)
            setCurrentBuilding(fence || null)
        },
        (err) => {
            setError(err.message)
            setWatching(false)
        },
        {
            enableHighAccuracy: true,
            maximumAge: 2000,      // accept cached position up to 2 seconds old
            timeout: 10000,
        }
        )

        // Cleanup on unmount
        return () => {
        navigator.geolocation.clearWatch(watchId)
        setWatching(false)
        }
    }, [checkGeofences])

    return { position, currentBuilding, error, watching }
}