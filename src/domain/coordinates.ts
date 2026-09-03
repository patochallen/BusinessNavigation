// import type { Business, Coordinate, MapPoint } from './types'
// import { clamp, degToRad, radToDeg } from 'three/src/math/MathUtils.js'

// const POINT_EPSILON = 1e-8
// /** Radius used for calculations (equatorial radius), in meters. */
// const EARTH_RADIUS = 6378137.0

// export function localPointFromGps(origin: Coordinate, coordinate: Coordinate): MapPoint {
//   const metersPerDegreeLatitude = 111_320
//   const metersPerDegreeLongitude =
//     metersPerDegreeLatitude * Math.cos((origin.latitude * Math.PI) / 180)
//   return {
//     x: (coordinate.longitude - origin.longitude) * metersPerDegreeLongitude,
//     z: -(coordinate.latitude - origin.latitude) * metersPerDegreeLatitude,
//   }
// }

// function sameMapPoint(first: MapPoint, second: MapPoint) {
//   return (
//     Math.abs(first.x - second.x) < POINT_EPSILON && Math.abs(first.z - second.z) < POINT_EPSILON
//   )
// }

// export function normalizeBoundary(points: MapPoint[]) {
//   const normalized = points.filter(
//     (point, index) => index === 0 || !sameMapPoint(point, points[index - 1]),
//   )
//   if (normalized.length > 1 && sameMapPoint(normalized[0], normalized[normalized.length - 1])) {
//     normalized.pop()
//   }
//   if (normalized.length < 3 || Math.abs(signedPolygonArea(normalized)) < POINT_EPSILON) {
//     throw new Error('Business boundary must contain at least three non-collinear points.')
//   }
//   return normalized
// }

// export function signedPolygonArea(points: MapPoint[]) {
//   return (
//     points.reduce((area, point, index) => {
//       const next = points[(index + 1) % points.length]
//       return area + point.x * next.z - next.x * point.z
//     }, 0) / 2
//   )
// }

// export function getBusinessBoundaryMapPoints(business: Business) {
//   return normalizeBoundary(
//     // toPoints(business.boundary),
//     business.boundary.map((coordinate) => localPointFromGps(business.mapOrigin, coordinate)),
//   )
// }

// export function getMapPointBounds(points: MapPoint[]) {
//   if (!points.length) throw new Error('Cannot calculate bounds for an empty point list.')
//   const minX = Math.min(...points.map((point) => point.x))
//   const maxX = Math.max(...points.map((point) => point.x))
//   const minZ = Math.min(...points.map((point) => point.z))
//   const maxZ = Math.max(...points.map((point) => point.z))
//   return {
//     minX,
//     maxX,
//     minZ,
//     maxZ,
//     width: maxX - minX,
//     depth: maxZ - minZ,
//     center: { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 },
//   }
// }

// // export function center(latLngList: Coordinate[]): Coordinate {
// //   return {
// //     latitude: latLngList.map((it) => it.latitude).reduce((a, b) => a + b, 0) / latLngList.length,
// //     longitude: latLngList.map((it) => it.longitude).reduce((a, b) => a + b, 0) / latLngList.length,
// //   }
// // }

// // export function toPoints(latLngList: Coordinate[]): MapPoint[] {
// //   const location = center(latLngList)
// //   return latLngList.map((point) => {
// //     const ang = computeHeading(location, point)
// //     const distance = computeDistanceBetween(location, point)
// //     const left = Math.sin(degToRad(ang)) * distance
// //     const bottom = Math.cos(degToRad(ang)) * distance
// //     return { x: left, z: bottom }
// //   })
// // }

// // function computeHeading(from: Coordinate, to: Coordinate): number {
// //   const fromLat = degToRad(from.latitude)
// //   const fromLng = degToRad(from.longitude)
// //   const toLat = degToRad(to.latitude)
// //   const toLng = degToRad(to.longitude)
// //   const dLng = toLng - fromLng

// //   const heading = Math.atan2(
// //     Math.sin(dLng) * Math.cos(toLat),
// //     Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng),
// //   )

// //   return clamp(radToDeg(heading), -180, 180)
// // }
// // /** Returns haversine(angle-in-radians). */
// // function hav(x: number): number {
// //   const sinHalf = Math.sin(x * 0.5)
// //   return sinHalf * sinHalf
// // }
// // /** Computes inverse haversine. The argument must be in [0, 1]. */
// // function arcHav(x: number): number {
// //   return 2 * Math.asin(Math.sqrt(x))
// // }

// // /** Returns hav() of distance on the unit sphere. */
// // function havDistance(lat1: number, lat2: number, dLng: number): number {
// //   return hav(lat1 - lat2) + hav(dLng) * Math.cos(lat1) * Math.cos(lat2)
// // }

// // /** Returns distance on the unit sphere; args are radians. */
// // function distanceRadians(lat1: number, lng1: number, lat2: number, lng2: number): number {
// //   return arcHav(havDistance(lat1, lat2, lng1 - lng2))
// // }

// // /** Returns the angle between two points, in radians. */
// // function computeAngleBetween(from: Coordinate, to: Coordinate): number {
// //   return distanceRadians(
// //     degToRad(from.latitude),
// //     degToRad(from.longitude),
// //     degToRad(to.latitude),
// //     degToRad(to.longitude),
// //   )
// // }

// // /** Returns distance between two points, in meters. */
// // function computeDistanceBetween(from: Coordinate, to: Coordinate): number {
// //   return computeAngleBetween(from, to) * EARTH_RADIUS
// // }
