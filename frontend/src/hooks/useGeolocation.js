import { useState, useEffect, useCallback } from "react";

const GEOFENCES = [
    {
        id: 'MAIN-ENT',
        building: null,
        floor: null,
        nodeId: null,
        label: 'Main Campus Entrance',
        lat: -1.929967, lng: 30.152060, radius: 0.00015,
    },
    {
        id: 'SC-ENT-F2',
        building: 'Social Commons',
        floor: 2,
        nodeId: 'SC-F2-ENTRY-10',
        label: 'Social Commons Floor 2 entrance',
        lat: -1.930212, lng: 30.153226, radius: 0.00009,
    },
    {
        id: 'SC-ENT-F1',
        building: 'Social Commons',
        floor: 1,
        nodeId: 'SC-F1-ENTRY-11',
        label: 'Social Commons Floor 1 entrance',
        lat: -1.930439, lng: 30.153378, radius: 0.00009,
    },
    {
        id: 'SC-ENT-F0',
        building: 'Social Commons',
        floor: 0,
        nodeId: 'SC-F0-ENTRY-16',
        label: 'Social Commons Ground entrance',
        lat: -1.930534, lng: 30.153201, radius: 0.00009,
    },
    {
        id: 'EC-ENT-F2-A',
        building: 'Enterprise Commons',
        floor: 2,
        nodeId: 'EC-F2-ENTRY-1',
        label: 'Enterprise Commons Floor 2 entrance A',
        lat: -1.930572, lng: 30.153397, radius: 0.00008,
    },
    {
        id: 'EC-ENT-F2-B',
        building: 'Enterprise Commons',
        floor: 2,
        nodeId: 'EC-F2-ENTRY-1',
        label: 'Enterprise Commons Floor 2 entrance B',
        lat: -1.930622, lng: 30.153378, radius: 0.00008,
    },
    {
        id: 'EC-ENT-F0',
        building: 'Enterprise Commons',
        floor: 0,
        nodeId: 'EC-F0-ENTRY-1',
        label: 'Enterprise Commons Ground entrance',
        lat: -1.930853, lng: 30.153168, radius: 0.00010,
    },
    {
        id: 'LC-ENT-F0-A',
        building: 'Learning Commons',
        floor: 0,
        nodeId: 'LC-F0-ENTRY-1',
        label: 'Learning Commons Ground entrance A',
        lat: -1.930890, lng: 30.152864, radius: 0.00009,
    },
    {
        id: 'LC-ENT-F0-B',
        building: 'Learning Commons',
        floor: 0,
        nodeId: 'LC-F0-ENTRY-2',
        label: 'Learning Commons Ground entrance B (near Benin)',
        lat: -1.930714, lng: 30.152785, radius: 0.00009,
    },
    {
        id: 'LC-ENT-F1',
        building: 'Learning Commons',
        floor: 1,
        nodeId: 'LC-F1-ENTRY-1',
        label: 'Learning Commons Floor 1 entrance (near Mozambique)',
        lat: -1.930741, lng: 30.153168, radius: 0.00009,
    },
    {
        id: 'LC-ENT-F2',
        building: 'Learning Commons',
        floor: 2,
        nodeId: 'LC-F2-ENTRY-1',
        label: 'Learning Commons Floor 2 entrance (near Reception/Gabon)',
        lat: -1.930490, lng: 30.152936, radius: 0.00009,
    },
]


function isInsideGeofence(lat, lng, fence) {
    const dlat = lat - fence.lat
    const dlng = lng - fence.lng
    const distance = Math.sqrt(dlat * dlat + dlng * dlng)
    return distance <= fence.radius
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