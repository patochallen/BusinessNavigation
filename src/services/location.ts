import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  Attraction,
  Business,
  Coordinate,
  LocationPermission,
  MapPoint,
} from '../domain/types'
import {
  distanceBetweenPoints,
  getAttractionMapPoint,
  localPointFromGps,
} from '../domain/use-cases'

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [permission, setPermission] = useState<LocationPermission>(() => {
    if (typeof navigator === 'undefined') return 'idle'
    if (import.meta.env.DEV && import.meta.env.VITE_DEMO_LOCATION === 'true') return 'requesting'
    return navigator.geolocation ? 'requesting' : 'unavailable'
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopDemo = useCallback(() => {
    if (demoTimer.current !== null) clearInterval(demoTimer.current)
    demoTimer.current = null
  }, [])

  const startLocationTracking = useCallback(() => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEMO_LOCATION === 'true') {
      stopDemo()
      const demoPath = [
        { latitude: -32.1342, longitude: -64.4801 },
        { latitude: -32.13415, longitude: -64.47995 },
        { latitude: -32.13405, longitude: -64.47982 },
        { latitude: -32.13395, longitude: -64.4797 },
      ]
      let index = 0
      const emit = () => {
        const coordinate = demoPath[Math.min(index, demoPath.length - 1)]
        setPosition({
          coords: { ...coordinate, accuracy: 5 },
          timestamp: Date.now(),
        } as GeolocationPosition)
        setPermission('ready')
        index += 1
        if (index >= demoPath.length) stopDemo()
      }
      emit()
      demoTimer.current = setInterval(emit, 1500)
      return
    }
    if (!navigator.geolocation) return
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
    }
    // stopDemo()
    watchId.current = navigator.geolocation.watchPosition(
      (next) => {
        setPosition(next)
        setPermission('ready')
      },
      (error) => {
        setPermission(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')
        setErrorMessage(error.message)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [stopDemo])

  const requestPermission = useCallback(async () => {
    setPermission('requesting')
    setErrorMessage(null)
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermission('unavailable')
      setErrorMessage('Geolocation is not available in this browser.')
      return
    }

    // Ask for a fresh location first to trigger the browser prompt when possible.
    const requestOnce = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        })
      })

    try {
      const next = await requestOnce()
      setPosition(next)
      setPermission('ready')
      startLocationTracking()
    } catch (error) {
      const geoError = error as GeolocationPositionError
      setPermission(geoError.code === geoError.PERMISSION_DENIED ? 'denied' : 'unavailable')
      setErrorMessage(geoError.message)
    }
  }, [startLocationTracking])

  useEffect(() => {
    startLocationTracking()
    return () => {
      if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
      stopDemo()
    }
  }, [startLocationTracking, stopDemo])

  return { position, permission, errorMessage, requestPermission }
}

export function gpsToLocalMeters(origin: Coordinate, coordinate: Coordinate): MapPoint {
  return localPointFromGps(origin, coordinate)
}

export function distanceInMeters(
  position: GeolocationPosition | null,
  business: Business,
  attraction: Attraction,
) {
  if (!position) return null
  const userPoint = gpsToLocalMeters(business.mapOrigin, position.coords)
  return distanceBetweenPoints(userPoint, getAttractionMapPoint(business, attraction))
}
