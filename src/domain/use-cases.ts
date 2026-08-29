import type {
  Attraction,
  Business,
  Category,
  Coordinate,
  MapFeature,
  MapPoint,
  PathSegment,
  Waypoint,
} from './types'
import { localPointFromGps } from './coordinates'

type ProjectedWaypoint = Omit<Waypoint, 'position'> & { position: MapPoint }

export {
  getBusinessBoundaryMapPoints,
  getMapPointBounds,
  localPointFromGps,
  normalizeBoundary,
  signedPolygonArea,
} from './coordinates'

export function findBusiness(businesses: Business[], businessId: string) {
  return businesses.find((business) => business.id === businessId)
}

export function findAttraction(business: Business, attractionId: string) {
  return business.attractions.find((attraction) => attraction.id === attractionId)
}

export function filterAttractions(
  attractions: Attraction[],
  category: Category | 'all',
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return attractions.filter((attraction) => {
    const matchesCategory = category === 'all' || attraction.category === category
    const matchesQuery = attraction.name.toLocaleLowerCase().includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })
}

export function getAttractionMapPoint(business: Business, attraction: Attraction) {
  return localPointFromGps(business.mapOrigin, attraction.origin)
}

export function getAttractionBoundaryMapPoints(business: Business, attraction: Attraction) {
  return attraction.boundary.map((coordinate) => localPointFromGps(business.mapOrigin, coordinate))
}

export function getMapFeatureMapPoints(business: Business, feature: MapFeature) {
  if (feature.type === 'building') return []
  return feature.points.map((coordinate) => localPointFromGps(business.mapOrigin, coordinate))
}

export function getBusinessMapWaypoints(business: Business): ProjectedWaypoint[] {
  return (business.waypoints ?? []).map((waypoint) => ({
    ...waypoint,
    position: localPointFromGps(business.mapOrigin, waypoint.position),
  }))
}

export function distanceBetweenPoints(first: MapPoint, second: MapPoint) {
  const dx = first.x - second.x
  const dz = first.z - second.z
  return Math.round(Math.sqrt(dx * dx + dz * dz))
}

export function shortestPath(
  waypoints: ProjectedWaypoint[],
  segments: PathSegment[],
  startId: string,
  endId: string,
) {
  if (
    !waypoints.some((waypoint) => waypoint.id === startId) ||
    !waypoints.some((waypoint) => waypoint.id === endId)
  )
    return []
  const distances = new Map(waypoints.map((waypoint) => [waypoint.id, Infinity]))
  const previous = new Map<string, string>()
  const pending = new Set(waypoints.map((waypoint) => waypoint.id))
  distances.set(startId, 0)

  while (pending.size > 0) {
    const current = [...pending].reduce((closest, id) =>
      distances.get(id)! < distances.get(closest)! ? id : closest,
    )
    pending.delete(current)
    if (current === endId || distances.get(current) === Infinity) break
    const neighbors = segments.flatMap((segment) => {
      if (segment.from === current) return [{ id: segment.to, distance: segment.distanceInMeters }]
      if (segment.to === current) return [{ id: segment.from, distance: segment.distanceInMeters }]
      return []
    })
    neighbors.forEach((neighbor) => {
      const candidate = distances.get(current)! + neighbor.distance
      if (candidate < distances.get(neighbor.id)!) {
        distances.set(neighbor.id, candidate)
        previous.set(neighbor.id, current)
      }
    })
  }

  if (startId !== endId && !previous.has(endId)) return []
  const pathIds = [endId]
  while (pathIds[0] !== startId) pathIds.unshift(previous.get(pathIds[0])!)
  return pathIds.map((id) => waypoints.find((waypoint) => waypoint.id === id)!.position)
}

export function shortestPathDistance(
  waypoints: ProjectedWaypoint[],
  segments: PathSegment[],
  startId: string,
  endId: string,
) {
  if (
    !waypoints.some((waypoint) => waypoint.id === startId) ||
    !waypoints.some((waypoint) => waypoint.id === endId)
  )
    return null
  const distances = new Map(waypoints.map((waypoint) => [waypoint.id, Infinity]))
  const pending = new Set(waypoints.map((waypoint) => waypoint.id))
  distances.set(startId, 0)

  while (pending.size > 0) {
    const current = [...pending].reduce((closest, id) =>
      distances.get(id)! < distances.get(closest)! ? id : closest,
    )
    pending.delete(current)
    if (current === endId || distances.get(current) === Infinity) break
    segments.forEach((segment) => {
      const neighborId =
        segment.from === current ? segment.to : segment.to === current ? segment.from : undefined
      if (!neighborId) return
      const candidate = distances.get(current)! + segment.distanceInMeters
      if (candidate < distances.get(neighborId)!) distances.set(neighborId, candidate)
    })
  }

  const distance = distances.get(endId)
  return distance === Infinity ? null : distance
}

export function routeToAttraction(business: Business, attraction: Attraction) {
  if (!business.waypoints || !business.pathSegments || !attraction.waypointId) return []
  const waypoints = getBusinessMapWaypoints(business)
  const waypointRoute = shortestPath(
    waypoints,
    business.pathSegments,
    business.entryWaypointId,
    attraction.waypointId,
  )
  return [...waypointRoute, getAttractionMapPoint(business, attraction)]
}

export function routeDistanceToAttraction(
  business: Business,
  attraction: Attraction,
  position?: MapPoint,
) {
  if (!business.waypoints || !business.pathSegments || !attraction.waypointId) return null
  const waypoints = getBusinessMapWaypoints(business)
  const start = position
    ? nearestWaypoint(waypoints, position)
    : waypoints.find((waypoint) => waypoint.id === business.entryWaypointId)
  if (!start) return null
  const networkDistance = shortestPathDistance(
    waypoints,
    business.pathSegments,
    start.id,
    attraction.waypointId,
  )
  if (networkDistance === null || networkDistance === undefined) return null
  const approachDistance = position ? distanceBetweenPoints(position, start.position) : 0
  const destinationWaypoint = waypoints.find((waypoint) => waypoint.id === attraction.waypointId)
  const destinationDistance = destinationWaypoint
    ? distanceBetweenPoints(
        destinationWaypoint.position,
        getAttractionMapPoint(business, attraction),
      )
    : 0
  return networkDistance + approachDistance + destinationDistance
}

export function nearestWaypoint(waypoints: ProjectedWaypoint[], position: MapPoint) {
  return waypoints.reduce<ProjectedWaypoint | undefined>((nearest, waypoint) => {
    if (!nearest) return waypoint
    return distanceBetweenPoints(position, waypoint.position) <
      distanceBetweenPoints(position, nearest.position)
      ? waypoint
      : nearest
  }, undefined)
}

export function routeFromCoordinate(
  business: Business,
  coordinate: Coordinate,
  attraction: Attraction,
) {
  if (!business.waypoints || !business.pathSegments || !attraction.waypointId) return []
  const userPoint = localPointFromGps(business.mapOrigin, coordinate)
  const waypoints = getBusinessMapWaypoints(business)
  const start = nearestWaypoint(waypoints, userPoint)
  if (!start) return []
  const waypointRoute = [
    userPoint,
    ...shortestPath(waypoints, business.pathSegments, start.id, attraction.waypointId),
  ]
  return [...waypointRoute, getAttractionMapPoint(business, attraction)]
}

export function routeDistanceInMeters(route: MapPoint[]) {
  return route
    .slice(1)
    .reduce((total, point, index) => total + distanceBetweenPoints(route[index], point), 0)
}

const WALKING_METERS_PER_MINUTE = 80

export function walkingEtaFromDistance(distanceMeters: number | null) {
  if (distanceMeters === null || !Number.isFinite(distanceMeters)) return null
  if (distanceMeters <= 0) return 'Ahora'
  return `${Math.max(1, Math.ceil(distanceMeters / WALKING_METERS_PER_MINUTE))} min`
}

export function projectPointOnSegment(point: MapPoint, start: MapPoint, end: MapPoint) {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSquared = dx * dx + dz * dz
  const ratio =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared),
        )
  return { point: { x: start.x + dx * ratio, z: start.z + dz * ratio }, ratio }
}

export function distanceToNetwork(waypoints: ProjectedWaypoint[], position: MapPoint) {
  const nearest = nearestWaypoint(waypoints, position)
  return nearest ? distanceBetweenPoints(position, nearest.position) : null
}

export function isOffRoute(
  waypoints: ProjectedWaypoint[],
  position: MapPoint,
  thresholdMeters: number,
) {
  const distance = distanceToNetwork(waypoints, position)
  return distance !== null && distance > thresholdMeters
}

export function progressOnRoute(route: MapPoint[], position: MapPoint | null) {
  if (route.length < 2)
    return {
      completedMeters: 0,
      remainingMeters: 0,
      ratio: 0,
      nextPoint: undefined,
    }
  const totalMeters = routeDistanceInMeters(route)
  if (!position)
    return {
      completedMeters: 0,
      remainingMeters: totalMeters,
      ratio: 0,
      nextPoint: route[1],
    }
  const nearestSegment = route
    .slice(1)
    .reduce<{ index: number; distance: number; ratio: number } | undefined>(
      (nearest, end, index) => {
        const projection = projectPointOnSegment(position, route[index], end)
        const distance = distanceBetweenPoints(position, projection.point)
        return !nearest || distance <= nearest.distance
          ? { index, distance, ratio: projection.ratio }
          : nearest
      },
      undefined,
    )
  if (!nearestSegment)
    return { completedMeters: 0, remainingMeters: totalMeters, ratio: 0, nextPoint: route[1] }
  const segmentMeters = distanceBetweenPoints(
    route[nearestSegment.index],
    route[nearestSegment.index + 1],
  )
  const completedBeforeSegment = routeDistanceInMeters(route.slice(0, nearestSegment.index + 1))
  const completedMeters = completedBeforeSegment + Math.round(segmentMeters * nearestSegment.ratio)
  return {
    completedMeters,
    remainingMeters: Math.max(0, totalMeters - completedMeters),
    ratio: totalMeters === 0 ? 1 : Math.min(1, completedMeters / totalMeters),
    nextPoint: route[nearestSegment.index + 1],
  }
}

export function nextRouteInstruction(route: MapPoint[], position: MapPoint | null) {
  if (route.length < 2) return null
  const nearestIndex = position
    ? route.reduce(
        (closest, point, index) =>
          distanceBetweenPoints(position, point) < distanceBetweenPoints(position, route[closest])
            ? index
            : closest,
        0,
      )
    : 0
  const turnIndex = Math.min(nearestIndex + 1, route.length - 1)
  const distanceToTurn = position
    ? distanceBetweenPoints(position, route[turnIndex])
    : distanceBetweenPoints(route[0], route[turnIndex])
  if (turnIndex === route.length - 1) {
    return { label: 'Seguí hasta el destino', distanceToTurn }
  }

  const incoming = {
    x: route[turnIndex].x - route[turnIndex - 1].x,
    z: route[turnIndex].z - route[turnIndex - 1].z,
  }
  const outgoing = {
    x: route[turnIndex + 1].x - route[turnIndex].x,
    z: route[turnIndex + 1].z - route[turnIndex].z,
  }
  const cross = incoming.x * outgoing.z - incoming.z * outgoing.x
  const dot = incoming.x * outgoing.x + incoming.z * outgoing.z
  const turn =
    Math.abs(cross) < Math.abs(dot) * 0.25
      ? 'Seguí derecho'
      : cross > 0
        ? 'Girás a la izquierda'
        : 'Girás a la derecha'
  return { label: turn, distanceToTurn }
}

export function bearingToPoint(from: MapPoint, to: MapPoint) {
  const bearing = (Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI
  return (bearing + 360) % 360
}

export function relativeBearing(from: MapPoint, to: MapPoint, heading: number | null) {
  if (heading === null) return null
  return ((bearingToPoint(from, to) - heading + 540) % 360) - 180
}

export function cameraOverlayPosition(relativeAngle: number | null, distanceMeters: number | null) {
  const safeAngle = Math.max(-75, Math.min(75, relativeAngle ?? 0))
  const safeDistance = Math.max(0, Math.min(1000, distanceMeters ?? 100))
  return {
    left: 50 + (safeAngle / 75) * 36,
    top: 42 - (1 - safeDistance / 1000) * 12,
    scale: 1.15 - (safeDistance / 1000) * 0.35,
  }
}

export function circularAngleSpread(angles: number[]) {
  if (angles.length < 2) return 0
  const normalized = angles
    .map((angle) => (angle + 360) % 360)
    .sort((first, second) => first - second)
  let largestGap = normalized[0] + 360 - normalized[normalized.length - 1]
  for (let index = 1; index < normalized.length; index += 1) {
    largestGap = Math.max(largestGap, normalized[index] - normalized[index - 1])
  }
  return 360 - largestGap
}
