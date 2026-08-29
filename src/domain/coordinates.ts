import type { Business, Coordinate, MapPoint } from './types'

const POINT_EPSILON = 1e-8

export function localPointFromGps(origin: Coordinate, coordinate: Coordinate): MapPoint {
  const metersPerDegreeLatitude = 111_320
  const metersPerDegreeLongitude =
    metersPerDegreeLatitude * Math.cos((origin.latitude * Math.PI) / 180)
  return {
    x: (coordinate.longitude - origin.longitude) * metersPerDegreeLongitude,
    z: -(coordinate.latitude - origin.latitude) * metersPerDegreeLatitude,
  }
}

function sameMapPoint(first: MapPoint, second: MapPoint) {
  return (
    Math.abs(first.x - second.x) < POINT_EPSILON && Math.abs(first.z - second.z) < POINT_EPSILON
  )
}

export function normalizeBoundary(points: MapPoint[]) {
  const normalized = points.filter(
    (point, index) => index === 0 || !sameMapPoint(point, points[index - 1]),
  )
  if (normalized.length > 1 && sameMapPoint(normalized[0], normalized[normalized.length - 1])) {
    normalized.pop()
  }
  if (normalized.length < 3 || Math.abs(signedPolygonArea(normalized)) < POINT_EPSILON) {
    throw new Error('Business boundary must contain at least three non-collinear points.')
  }
  return normalized
}

export function signedPolygonArea(points: MapPoint[]) {
  return (
    points.reduce((area, point, index) => {
      const next = points[(index + 1) % points.length]
      return area + point.x * next.z - next.x * point.z
    }, 0) / 2
  )
}

export function getBusinessBoundaryMapPoints(business: Business) {
  return normalizeBoundary(
    business.boundary.map((coordinate) => localPointFromGps(business.mapOrigin, coordinate)),
  )
}

export function getMapPointBounds(points: MapPoint[]) {
  if (!points.length) throw new Error('Cannot calculate bounds for an empty point list.')
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minZ = Math.min(...points.map((point) => point.z))
  const maxZ = Math.max(...points.map((point) => point.z))
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    center: { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 },
  }
}
