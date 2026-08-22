import { useEffect, useRef, useState } from 'react'
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
  const [permission, setPermission] = useState<LocationPermission>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopDemo = () => {
    if (demoTimer.current !== null) clearInterval(demoTimer.current)
    demoTimer.current = null
  }

  const locate = () => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEMO_LOCATION === 'true') {
      stopDemo()
      setPermission('requesting')
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
    if (!navigator.geolocation) {
      setPermission('unavailable')
      return
    }
    setPermission('requesting')
    setErrorMessage(null)
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
    }
    stopDemo()
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
  }

  useEffect(
    () => () => {
      if (watchId.current !== null) {
        navigator.geolocation?.clearWatch(watchId.current)
      }
      stopDemo()
    },
    [],
  )

  return { position, permission, errorMessage, locate }
}

export function gpsToLocalMeters(origin: Coordinate, coordinate: Coordinate): MapPoint {
  return localPointFromGps(origin, coordinate, 1)
}

export function distanceInMeters(
  position: GeolocationPosition | null,
  business: Business,
  attraction: Attraction,
) {
  if (!position) return null
  const userPoint = gpsToLocalMeters(business.mapOrigin, {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  })
  return distanceBetweenPoints(
    userPoint,
    getAttractionMapPoint(business, attraction),
    business.mapScaleMeters,
  )
}
