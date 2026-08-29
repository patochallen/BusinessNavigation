import { describe, expect, it } from 'vitest'
import { businesses } from './demo-data'
import {
  distanceBetweenPoints,
  filterAttractions,
  findAttraction,
  findBusiness,
  getBusinessMapWaypoints,
  localPointFromGps,
  getAttractionMapPoint,
  getAttractionBoundaryMapPoints,
  getMapFeatureMapPoints,
  nextRouteInstruction,
  bearingToPoint,
  nearestWaypoint,
  routeFromCoordinate,
  routeDistanceInMeters,
  routeDistanceToAttraction,
  distanceToNetwork,
  isOffRoute,
  routeToAttraction,
  walkingEtaFromDistance,
  progressOnRoute,
  relativeBearing,
  shortestPath,
  cameraOverlayPosition,
  circularAngleSpread,
  getBusinessBoundaryMapPoints,
  getMapPointBounds,
  normalizeBoundary,
} from './use-cases'

const valle = businesses[0]
const mirador = valle.attractions[0]
const valleWaypoints = getBusinessMapWaypoints(valle)

function geolocationAt(latitude: number, longitude: number) {
  return { coords: { latitude, longitude } } as GeolocationPosition
}

describe('business and attraction resolution', () => {
  it('finds a business by id', () => {
    expect(findBusiness(businesses, 'valle-lumina')).toBe(valle)
    expect(findBusiness(businesses, 'missing')).toBeUndefined()
  })

  it('only resolves attractions inside the selected business', () => {
    expect(findAttraction(valle, 'mirador-norte')).toBe(mirador)
    expect(findAttraction(valle, 'missing')).toBeUndefined()
    expect(findAttraction(businesses[1], 'mirador-norte')).toBeUndefined()
  })
})

describe('attraction filtering', () => {
  it('filters by category and case-insensitive name query', () => {
    expect(filterAttractions(valle.attractions, 'nature', '')).toHaveLength(2)
    expect(filterAttractions(valle.attractions, 'all', 'FUEGO')).toEqual([valle.attractions[1]])
    expect(filterAttractions(valle.attractions, 'food', '  casa ')).toEqual([valle.attractions[1]])
  })
})

describe('map coordinates', () => {
  it('maps the business origin to the local map origin', () => {
    expect(localPointFromGps(valle.mapOrigin, valle.mapOrigin)).toEqual({
      x: 0,
      z: -0,
    })
  })

  it('calculates distance in local meters', () => {
    expect(distanceBetweenPoints({ x: 0, z: 0 }, { x: 30, z: 40 })).toBe(50)
  })

  it('converts GPS and measures from the same origin', () => {
    const nearby = geolocationAt(valle.mapOrigin.latitude, valle.mapOrigin.longitude + 10 / 111_320)
    const point = localPointFromGps(valle.mapOrigin, {
      latitude: nearby.coords.latitude,
      longitude: nearby.coords.longitude,
    })
    expect(point.x).toBeCloseTo(8.46, 1)
    expect(point.z).toBeCloseTo(0, 5)
  })

  it('normalizes a closed boundary and calculates its bounds', () => {
    const points = normalizeBoundary([
      { x: -2, z: -1 },
      { x: 3, z: -1 },
      { x: 3, z: 4 },
      { x: -2, z: 4 },
      { x: -2, z: -1 },
    ])
    expect(points).toHaveLength(4)
    expect(getMapPointBounds(points)).toEqual({
      minX: -2,
      maxX: 3,
      minZ: -1,
      maxZ: 4,
      width: 5,
      depth: 5,
      center: { x: 0.5, z: 1.5 },
    })
  })

  it('projects the GPS business boundary into local map units', () => {
    const points = getBusinessBoundaryMapPoints(valle)
    expect(points.length).toBeGreaterThanOrEqual(3)
    expect(getMapPointBounds(points).width).toBeGreaterThan(100)
  })

  it('projects map-feature coordinates into local map units', () => {
    const feature = {
      type: 'path' as const,
      id: 'test-path',
      points: [
        valle.mapOrigin,
        { ...valle.mapOrigin, longitude: valle.mapOrigin.longitude + 0.001 },
      ],
    }
    expect(getMapFeatureMapPoints(valle, feature)).toEqual([
      { x: 0, z: -0 },
      localPointFromGps(valle.mapOrigin, feature.points[1]),
    ])
  })

  it('projects attraction boundaries into local map units', () => {
    const attraction = {
      ...mirador,
      boundary: [
        valle.mapOrigin,
        { ...valle.mapOrigin, latitude: valle.mapOrigin.latitude + 0.001 },
      ],
    }
    expect(getAttractionBoundaryMapPoints(valle, attraction)).toEqual([
      { x: 0, z: -0 },
      localPointFromGps(valle.mapOrigin, attraction.boundary[1]),
    ])
  })

  it('rejects a degenerate boundary', () => {
    expect(() =>
      normalizeBoundary([
        { x: 0, z: 0 },
        { x: 1, z: 1 },
        { x: 2, z: 2 },
      ]),
    ).toThrow()
  })
})

describe('predio routing', () => {
  it('selects the closest waypoint to the visitor', () => {
    expect(nearestWaypoint(valleWaypoints, { x: -50, z: 40 })?.id).toBe('entrada')
    expect(nearestWaypoint(valleWaypoints, { x: 20, z: -10 })?.id).toBe('fuego')
  })

  it('finds the shortest path through connected waypoints', () => {
    const route = shortestPath(valleWaypoints, valle.pathSegments ?? [], 'entrada', 'mirador')
    expect(route).toEqual([
      valleWaypoints.find((waypoint) => waypoint.id === 'entrada')!.position,
      valleWaypoints.find((waypoint) => waypoint.id === 'centro')!.position,
      valleWaypoints.find((waypoint) => waypoint.id === 'mirador')!.position,
    ])
  })

  it('resolves an attraction route from the business network', () => {
    expect(routeToAttraction(valle, mirador)).toHaveLength(4)
  })

  it('starts a route at the visitor coordinate', () => {
    const route = routeFromCoordinate(valle, valle.mapOrigin, mirador)
    expect(route[0]).toEqual({ x: 0, z: -0 })
    expect(route.at(-1)).toEqual(getAttractionMapPoint(valle, mirador))
  })

  it('returns no route for an unknown destination', () => {
    expect(shortestPath(valleWaypoints, valle.pathSegments ?? [], 'entrada', 'missing')).toEqual([])
  })

  it('calculates route distance and detects when a visitor leaves the network', () => {
    expect(
      routeDistanceInMeters([
        { x: 0, z: 0 },
        { x: 30, z: 40 },
      ]),
    ).toBe(50)
    expect(distanceToNetwork(valleWaypoints, { x: 0, z: 20 })).toBe(20)
    expect(isOffRoute(valleWaypoints, { x: 0, z: 20 }, 30)).toBe(false)
    expect(isOffRoute(valleWaypoints, { x: 60, z: 60 }, 30)).toBe(true)
  })

  it('uses segment weights for the route distance', () => {
    expect(routeDistanceToAttraction(valle, mirador)).toBe(109)
    expect(routeDistanceToAttraction(valle, mirador, { x: -50, z: 40 })).toBe(116)
  })

  it('calculates a walking ETA from distance', () => {
    expect(walkingEtaFromDistance(0)).toBe('Ahora')
    expect(walkingEtaFromDistance(80)).toBe('1 min')
    expect(walkingEtaFromDistance(81)).toBe('2 min')
    expect(walkingEtaFromDistance(null)).toBeNull()
  })

  it('reports completed and remaining route progress', () => {
    const progress = progressOnRoute(
      [
        { x: 0, z: 0 },
        { x: 30, z: 0 },
        { x: 60, z: 0 },
      ],
      { x: 30, z: 0 },
    )
    expect(progress.completedMeters).toBe(30)
    expect(progress.remainingMeters).toBe(30)
    expect(progress.ratio).toBe(0.5)
    expect(progress.nextPoint).toEqual({ x: 60, z: 0 })
  })

  it('describes the next turn on a route', () => {
    const instruction = nextRouteInstruction(
      [
        { x: 0, z: 0 },
        { x: 30, z: 0 },
        { x: 30, z: 30 },
      ],
      { x: 0, z: 0 },
    )
    expect(instruction?.label).toBe('Girás a la izquierda')
    expect(instruction?.distanceToTurn).toBe(30)
  })

  it('calculates direction relative to the phone heading', () => {
    expect(bearingToPoint({ x: 0, z: 0 }, { x: 0, z: -1 })).toBe(0)
    expect(bearingToPoint({ x: 0, z: 0 }, { x: 1, z: 0 })).toBe(90)
    expect(relativeBearing({ x: 0, z: 0 }, { x: 1, z: 0 }, 0)).toBe(90)
    expect(relativeBearing({ x: 0, z: 0 }, { x: 1, z: 0 }, 180)).toBe(-90)
  })

  it('keeps the camera destination inside a stable viewport', () => {
    expect(cameraOverlayPosition(0, 100)).toEqual({ left: 50, top: 31.2, scale: 1.115 })
    expect(cameraOverlayPosition(180, 0).left).toBe(86)
    expect(cameraOverlayPosition(-180, 500).left).toBe(14)
  })

  it('measures angular spread across the 360 degree boundary', () => {
    expect(circularAngleSpread([358, 0, 2])).toBe(4)
    expect(circularAngleSpread([10, 40, 90])).toBe(80)
  })
})
