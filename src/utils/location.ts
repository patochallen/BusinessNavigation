import { Vector3 } from 'three'
import type { Coordinate } from '../domain/types'

// export type LocationPoint = {
//   latitude: number
//   longitude: number
//   altitude?: number | null
// }

export type DistanceAndHeading = {
  distanceMeters: number
  headingDegrees: number
}

const EARTH_RADIUS_METERS = 6371000

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
const toDegrees = (radians: number): number => (radians * 180) / Math.PI

export const getDistanceAndHeadingBetweenLocations = (
  from: Coordinate,
  to: Coordinate,
): DistanceAndHeading => {
  const fromLat = toRadians(from.latitude)
  const fromLng = toRadians(from.longitude)
  const toLat = toRadians(to.latitude)
  const toLng = toRadians(to.longitude)

  const deltaLat = toLat - fromLat
  const deltaLng = toLng - fromLng

  const haversineA =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2
  const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA))
  const distanceMeters = EARTH_RADIUS_METERS * haversineC

  const y = Math.sin(deltaLng) * Math.cos(toLat)
  const x =
    Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng)
  const headingDegrees = (toDegrees(Math.atan2(y, x)) + 360) % 360

  return {
    distanceMeters,
    headingDegrees,
  }
}

export const locToString = (location: Coordinate | null): string => {
  if (!location) return 'N/A'
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
}

export const moveLocation = (
  location: Coordinate,
  distanceMeters: number,
  headingDegrees: number,
): Coordinate => {
  const lat = toRadians(location.latitude)
  const lng = toRadians(location.longitude)
  const heading = toRadians(headingDegrees)

  const newLat = Math.asin(
    Math.sin(lat) * Math.cos(distanceMeters / EARTH_RADIUS_METERS) +
      Math.cos(lat) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(heading),
  )
  const newLng =
    lng +
    Math.atan2(
      Math.sin(heading) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(lat),
      Math.cos(distanceMeters / EARTH_RADIUS_METERS) - Math.sin(lat) * Math.sin(newLat),
    )

  return {
    latitude: toDegrees(newLat),
    longitude: toDegrees(newLng),
    altitude: location.altitude,
  }
}

export const moveLatLng = (
  location: Coordinate,
  distanceMeters: number,
  headingDegrees: number,
): Coordinate => {
  const lat = toRadians(location.latitude)
  const lng = toRadians(location.longitude)
  const heading = toRadians(headingDegrees)

  const newLat = Math.asin(
    Math.sin(lat) * Math.cos(distanceMeters / EARTH_RADIUS_METERS) +
      Math.cos(lat) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(heading),
  )
  const newLng =
    lng +
    Math.atan2(
      Math.sin(heading) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(lat),
      Math.cos(distanceMeters / EARTH_RADIUS_METERS) - Math.sin(lat) * Math.sin(newLat),
    )

  return {
    latitude: toDegrees(newLat),
    longitude: toDegrees(newLng),
  }
}

export const getDistanceBetweenLocations = (from: Coordinate, to: Coordinate): number => {
  return getDistanceAndHeadingBetweenLocations(from, to).distanceMeters
}

export const getHeadingBetweenLocations = (from: Coordinate, to: Coordinate): number => {
  return getDistanceAndHeadingBetweenLocations(from, to).headingDegrees
}

export const getRelativeHeading = (deviceHeading: number, targetHeading: number): number => {
  return (targetHeading - deviceHeading + 360) % 360
}

export const getRelativeHeadingDegrees = (deviceHeading: number, targetHeading: number): number => {
  const relativeHeading = getRelativeHeading(deviceHeading, targetHeading)
  return relativeHeading > 180 ? relativeHeading - 360 : relativeHeading
}

// export const mapPositionToDeviceLocation = (position: GeolocationPosition): DeviceLocation => ({
//   latitude: position.coords.latitude,
//   longitude: position.coords.longitude,
//   accuracy: position.coords.accuracy,
//   heading: position.coords.heading ?? 0,
//   altitude: position.coords.altitude,
//   altitudeAccuracy: position.coords.altitudeAccuracy,
//   speed: position.coords.speed,
//   timestamp: position.timestamp,
// });

export const getOffsetRelativeToLocation = (from: Coordinate, to: Coordinate): Vector3 => {
  const { distanceMeters, headingDegrees } = getDistanceAndHeadingBetweenLocations(from, to)
  const eastMeters = distanceMeters * Math.sin(toRadians(headingDegrees))
  const northMeters = -distanceMeters * Math.cos(toRadians(headingDegrees))
  return new Vector3(eastMeters, 0, northMeters)
}
