import { useEffect, useRef, useState } from 'react'
import type {
  Attraction,
  Business,
  Coordinate,
  LocationPermission,
  MapPoint,
} from '../domain/types'
import { distanceBetweenPoints, localPointFromGps } from '../domain/use-cases'

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [permission, setPermission] = useState<LocationPermission>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)

  const locate = () => {
    if (!navigator.geolocation) {
      setPermission('unavailable')
      return
    }
    setPermission('requesting')
    setErrorMessage(null)
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
    }
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
  return distanceBetweenPoints(userPoint, attraction.position, business.mapScaleMeters)
}
