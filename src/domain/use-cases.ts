import type {
  Attraction,
  Business,
  Category,
  Coordinate,
  MapPoint,
  PathSegment,
  Waypoint,
} from "./types";

export function findBusiness(businesses: Business[], businessId: string) {
  return businesses.find((business) => business.id === businessId);
}

export function findAttraction(business: Business, attractionId: string) {
  return business.attractions.find(
    (attraction) => attraction.id === attractionId,
  );
}

export function filterAttractions(
  attractions: Attraction[],
  category: Category | "all",
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return attractions.filter((attraction) => {
    const matchesCategory =
      category === "all" || attraction.category === category;
    const matchesQuery = attraction.name
      .toLocaleLowerCase()
      .includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
}

export function localPointFromGps(
  origin: Coordinate,
  coordinate: Coordinate,
  scaleMeters: number,
): MapPoint {
  const metersPerDegreeLatitude = 111_320;
  const metersPerDegreeLongitude =
    metersPerDegreeLatitude * Math.cos((origin.latitude * Math.PI) / 180);
  return {
    x:
      ((coordinate.longitude - origin.longitude) * metersPerDegreeLongitude) /
      scaleMeters,
    z:
      -((coordinate.latitude - origin.latitude) * metersPerDegreeLatitude) /
      scaleMeters,
  };
}

export function distanceBetweenPoints(
  first: MapPoint,
  second: MapPoint,
  scaleMeters = 1,
) {
  const dx = (first.x - second.x) * scaleMeters;
  const dz = (first.z - second.z) * scaleMeters;
  return Math.round(Math.sqrt(dx * dx + dz * dz));
}

export function shortestPath(
  waypoints: Waypoint[],
  segments: PathSegment[],
  startId: string,
  endId: string,
) {
  if (
    !waypoints.some((waypoint) => waypoint.id === startId) ||
    !waypoints.some((waypoint) => waypoint.id === endId)
  )
    return [];
  const distances = new Map(
    waypoints.map((waypoint) => [waypoint.id, Infinity]),
  );
  const previous = new Map<string, string>();
  const pending = new Set(waypoints.map((waypoint) => waypoint.id));
  distances.set(startId, 0);

  while (pending.size > 0) {
    const current = [...pending].reduce((closest, id) =>
      distances.get(id)! < distances.get(closest)! ? id : closest,
    );
    pending.delete(current);
    if (current === endId || distances.get(current) === Infinity) break;
    const neighbors = segments.flatMap((segment) => {
      if (segment.from === current)
        return [{ id: segment.to, distance: segment.distanceInMeters }];
      if (segment.to === current)
        return [{ id: segment.from, distance: segment.distanceInMeters }];
      return [];
    });
    neighbors.forEach((neighbor) => {
      const candidate = distances.get(current)! + neighbor.distance;
      if (candidate < distances.get(neighbor.id)!) {
        distances.set(neighbor.id, candidate);
        previous.set(neighbor.id, current);
      }
    });
  }

  if (startId !== endId && !previous.has(endId)) return [];
  const pathIds = [endId];
  while (pathIds[0] !== startId) pathIds.unshift(previous.get(pathIds[0])!);
  return pathIds.map(
    (id) => waypoints.find((waypoint) => waypoint.id === id)!.position,
  );
}

export function shortestPathDistance(
  waypoints: Waypoint[],
  segments: PathSegment[],
  startId: string,
  endId: string,
) {
  if (
    !waypoints.some((waypoint) => waypoint.id === startId) ||
    !waypoints.some((waypoint) => waypoint.id === endId)
  )
    return null;
  const distances = new Map(
    waypoints.map((waypoint) => [waypoint.id, Infinity]),
  );
  const pending = new Set(waypoints.map((waypoint) => waypoint.id));
  distances.set(startId, 0);

  while (pending.size > 0) {
    const current = [...pending].reduce((closest, id) =>
      distances.get(id)! < distances.get(closest)! ? id : closest,
    );
    pending.delete(current);
    if (current === endId || distances.get(current) === Infinity) break;
    segments.forEach((segment) => {
      const neighborId =
        segment.from === current
          ? segment.to
          : segment.to === current
            ? segment.from
            : undefined;
      if (!neighborId) return;
      const candidate = distances.get(current)! + segment.distanceInMeters;
      if (candidate < distances.get(neighborId)!)
        distances.set(neighborId, candidate);
    });
  }

  const distance = distances.get(endId);
  return distance === Infinity ? null : distance;
}

export function routeToAttraction(business: Business, attraction: Attraction) {
  if (!business.waypoints || !business.pathSegments || !attraction.waypointId)
    return [];
  return shortestPath(
    business.waypoints,
    business.pathSegments,
    "entrada",
    attraction.waypointId,
  );
}

export function routeDistanceToAttraction(
  business: Business,
  attraction: Attraction,
  position?: MapPoint,
) {
  if (!business.waypoints || !business.pathSegments || !attraction.waypointId)
    return null;
  const start = position
    ? nearestWaypoint(business.waypoints, position)
    : business.waypoints.find((waypoint) => waypoint.id === "entrada");
  if (!start) return null;
  const networkDistance = shortestPathDistance(
    business.waypoints,
    business.pathSegments,
    start.id,
    attraction.waypointId,
  );
  if (networkDistance === null || networkDistance === undefined) return null;
  const approachDistance = position
    ? distanceBetweenPoints(position, start.position, business.mapScaleMeters)
    : 0;
  return networkDistance + approachDistance;
}

export function nearestWaypoint(waypoints: Waypoint[], position: MapPoint) {
  return waypoints.reduce<Waypoint | undefined>((nearest, waypoint) => {
    if (!nearest) return waypoint;
    return distanceBetweenPoints(position, waypoint.position) <
      distanceBetweenPoints(position, nearest.position)
      ? waypoint
      : nearest;
  }, undefined);
}

export function routeFromCoordinate(
  business: Business,
  coordinate: Coordinate,
  attraction: Attraction,
) {
  if (!business.waypoints || !business.pathSegments || !attraction.waypointId)
    return [];
  const userPoint = localPointFromGps(
    business.mapOrigin,
    coordinate,
    business.mapScaleMeters,
  );
  const start = nearestWaypoint(business.waypoints, userPoint);
  if (!start) return [];
  return [
    userPoint,
    ...shortestPath(
      business.waypoints,
      business.pathSegments,
      start.id,
      attraction.waypointId,
    ),
  ];
}

export function routeDistanceInMeters(route: MapPoint[], scaleMeters = 1) {
  return route
    .slice(1)
    .reduce(
      (total, point, index) =>
        total + distanceBetweenPoints(route[index], point, scaleMeters),
      0,
    );
}

export function distanceToNetwork(
  waypoints: Waypoint[],
  position: MapPoint,
  scaleMeters = 1,
) {
  const nearest = nearestWaypoint(waypoints, position);
  return nearest
    ? distanceBetweenPoints(position, nearest.position, scaleMeters)
    : null;
}

export function isOffRoute(
  waypoints: Waypoint[],
  position: MapPoint,
  thresholdMeters: number,
  scaleMeters = 1,
) {
  const distance = distanceToNetwork(waypoints, position, scaleMeters);
  return distance !== null && distance > thresholdMeters;
}
