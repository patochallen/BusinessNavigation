import { Vector2, Vector3 } from 'three'
import * as THREE from 'three'
import type { Coordinate } from '../domain/types'
export const isAndroid =
  typeof navigator !== 'undefined' ? /Android/i.test(navigator.userAgent) : false
export const isMobile =
  typeof navigator !== 'undefined'
    ? /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    : false
export const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
export const toDegrees = (radians: number): number => (radians * 180) / Math.PI
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))
export const toCoordinate = (location?: GeolocationCoordinates | null): Coordinate => ({
  latitude: location?.latitude ?? 0,
  longitude: location?.longitude ?? 0,
})

export function isZero(Coordinate: Coordinate): boolean {
  return Coordinate.latitude === 0.0 && Coordinate.longitude === 0.0
}

export function center(CoordinateList: Coordinate[]): Coordinate {
  return {
    latitude:
      CoordinateList.map((it) => it.latitude).reduce((a, b) => a + b, 0) / CoordinateList.length,
    longitude:
      CoordinateList.map((it) => it.longitude).reduce((a, b) => a + b, 0) / CoordinateList.length,
  }
}

export function toVector3(Coordinate: Coordinate): Vector3 {
  const lat = toRadians(Coordinate.latitude)
  const lng = toRadians(Coordinate.longitude)
  const radius = Earth.RADIUS
  const x = radius * Math.cos(lat) * Math.cos(lng)
  const y = radius * Math.cos(lat) * Math.sin(lng)
  const z = radius * Math.sin(lat)
  return new Vector3(x, z, -y) // Invert Y for correct orientation
}

export function toPoints(CoordinateList: Coordinate[]): Vector2[] {
  const location = center(CoordinateList)
  return CoordinateList.map((point) => {
    const ang = SphericalUtil.computeHeading(location, point)
    const distance = SphericalUtil.computeDistanceBetween(location, point)
    const left = Math.sin(toRadians(ang)) * distance
    const bottom = Math.cos(toRadians(ang)) * distance
    return new Vector2(left, bottom)
  })
}

export function toShapeGeometry(CoordinateList: Coordinate[]): THREE.ShapeGeometry {
  const points = toPoints(CoordinateList)
  const shape = new THREE.Shape(points)
  const geometry = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2)
  return geometry
}

export function toPathGeometry(CoordinateList: Coordinate[], width: number): THREE.TubeGeometry {
  const points = toPoints(CoordinateList)
  const shape = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p.y, 0, p.x)))
  const geometry = new THREE.TubeGeometry(shape, 64, width / 2, 8, false)
    .rotateY(Math.PI / 2)
    .scale(1, 0.01, 1) // Scale Y to make it flat
  return geometry
}

export class Earth {
  /** South pole */
  static readonly SOUTH: Coordinate = {
    latitude: -85.05339706068897,
    longitude: -17.26246030709916,
  }

  /** North pole */
  static readonly NORTH: Coordinate = {
    latitude: 85.05339706068897,
    longitude: 162.73753969290084,
  }

  /** Radius used for calculations (equatorial radius), in meters. */
  static readonly RADIUS = 6378137.0

  /**
   * Mean radius (R1), International Union of Geodesy and Geophysics, in meters.
   * WGS-84 ellipsoid, mean radius of semi-axes (R1).
   */
  static readonly MEAN_RADIUS = 6371009.0

  /**
   * Equatorial radius, International Union of Geodesy and Geophysics, in meters.
   * WGS-84 ellipsoid, semi-major axis (a).
   */
  static readonly EQUATORIAL_RADIUS = 6378137.0

  /** WGS-84 ellipsoid, semi-minor axis (b), in meters. */
  static readonly POLAR_RADIUS = 6356752.3
}

export class SphericalUtil {
  /** Returns haversine(angle-in-radians). */
  static hav(x: number): number {
    const sinHalf = Math.sin(x * 0.5)
    return sinHalf * sinHalf
  }

  /** Computes inverse haversine. The argument must be in [0, 1]. */
  static arcHav(x: number): number {
    return 2 * Math.asin(Math.sqrt(x))
  }

  /** Given h == hav(x), returns sin(abs(x)). */
  static sinFromHav(h: number): number {
    return 2 * Math.sqrt(h * (1 - h))
  }

  /** Returns hav(asin(x)). */
  static havFromSin(x: number): number {
    const x2 = x * x
    return (x2 / (1 + Math.sqrt(1 - x2))) * 0.5
  }

  /** Returns sin(arcHav(x) + arcHav(y)). */
  static sinSumFromHav(x: number, y: number): number {
    const a = Math.sqrt(x * (1 - x))
    const b = Math.sqrt(y * (1 - y))
    return 2 * (a + b - 2 * (a * y + b * x))
  }

  /** Returns hav() of distance on the unit sphere. */
  static havDistance(lat1: number, lat2: number, dLng: number): number {
    return (
      SphericalUtil.hav(lat1 - lat2) + SphericalUtil.hav(dLng) * Math.cos(lat1) * Math.cos(lat2)
    )
  }

  /**
   * Computes heading from one point to another.
   * Result in degrees clockwise from North, clamped to [-180, 180].
   */
  static computeHeading(from: Coordinate, to: Coordinate): number {
    const fromLat = toRadians(from.latitude)
    const fromLng = toRadians(from.longitude)
    const toLat = toRadians(to.latitude)
    const toLng = toRadians(to.longitude)
    const dLng = toLng - fromLng

    const heading = Math.atan2(
      Math.sin(dLng) * Math.cos(toLat),
      Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng),
    )

    return clamp(toDegrees(heading), -180, 180)
  }

  /**
   * Computes destination point from an origin, distance (meters), and heading.
   */
  static computeOffset(from: Coordinate, distance: number, heading: number): Coordinate {
    const dis = distance / Earth.RADIUS
    const headingRad = toRadians(heading)
    const fromLat = toRadians(from.latitude)
    const fromLng = toRadians(from.longitude)
    const cosDistance = Math.cos(dis)
    const sinDistance = Math.sin(dis)
    const sinFromLat = Math.sin(fromLat)
    const cosFromLat = Math.cos(fromLat)
    const sinLat = cosDistance * sinFromLat + sinDistance * cosFromLat * Math.cos(headingRad)
    const dLng = Math.atan2(
      sinDistance * cosFromLat * Math.sin(headingRad),
      cosDistance - sinFromLat * sinLat,
    )

    return {
      latitude: toDegrees(Math.asin(sinLat)),
      longitude: toDegrees(fromLng + dLng),
    }
  }

  /** Returns distance on the unit sphere; args are radians. */
  static distanceRadians(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return SphericalUtil.arcHav(SphericalUtil.havDistance(lat1, lat2, lng1 - lng2))
  }

  /** Returns the angle between two points, in radians. */
  static computeAngleBetween(from: Coordinate, to: Coordinate): number {
    return SphericalUtil.distanceRadians(
      toRadians(from.latitude),
      toRadians(from.longitude),
      toRadians(to.latitude),
      toRadians(to.longitude),
    )
  }

  /** Returns distance between two points, in meters. */
  static computeDistanceBetween(from: Coordinate, to: Coordinate): number {
    return SphericalUtil.computeAngleBetween(from, to) * Earth.RADIUS
  }
}
