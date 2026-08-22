import { describe, expect, it } from 'vitest'
import { businesses } from './demo-data'
import {
  distanceBetweenPoints,
  filterAttractions,
  findAttraction,
  findBusiness,
  localPointFromGps,
  nextRouteInstruction,
  bearingToPoint,
  nearestWaypoint,
  routeFromCoordinate,
  routeDistanceInMeters,
  routeDistanceToAttraction,
  distanceToNetwork,
  isOffRoute,
  routeToAttraction,
  progressOnRoute,
  relativeBearing,
  shortestPath,
} from './use-cases'

const valle = businesses[0]
const mirador = valle.attractions[0]

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
    expect(localPointFromGps(valle.mapOrigin, valle.mapOrigin, valle.mapScaleMeters)).toEqual({
      x: 0,
      z: -0,
    })
  })

  it('calculates distance in scaled local meters', () => {
    expect(distanceBetweenPoints({ x: 0, z: 0 }, { x: 3, z: 4 }, 10)).toBe(50)
  })

  it('converts GPS and measures from the same origin', () => {
    const nearby = geolocationAt(valle.mapOrigin.latitude, valle.mapOrigin.longitude + 10 / 111_320)
    const point = localPointFromGps(
      valle.mapOrigin,
      { latitude: nearby.coords.latitude, longitude: nearby.coords.longitude },
      1,
    )
    expect(point.x).toBeCloseTo(8.46, 1)
    expect(point.z).toBeCloseTo(0, 5)
  })
})

describe('predio routing', () => {
  it('selects the closest waypoint to the visitor', () => {
    expect(nearestWaypoint(valle.waypoints ?? [], { x: -5, z: 4 })?.id).toBe('entrada')
    expect(nearestWaypoint(valle.waypoints ?? [], { x: 2, z: -1 })?.id).toBe('fuego')
  })

  it('finds the shortest path through connected waypoints', () => {
    const route = shortestPath(
      valle.waypoints ?? [],
      valle.pathSegments ?? [],
      'entrada',
      'mirador',
    )
    expect(route).toEqual([
      { x: -5.5, z: 4.5 },
      { x: 0, z: 0 },
      { x: -4.2, z: -3.1 },
    ])
  })

  it('resolves an attraction route from the business network', () => {
    expect(routeToAttraction(valle, mirador)).toHaveLength(3)
  })

  it('starts a route at the visitor coordinate', () => {
    const route = routeFromCoordinate(valle, valle.mapOrigin, mirador)
    expect(route[0]).toEqual({ x: 0, z: -0 })
    expect(route.at(-1)).toEqual(mirador.position)
  })

  it('returns no route for an unknown destination', () => {
    expect(
      shortestPath(valle.waypoints ?? [], valle.pathSegments ?? [], 'entrada', 'missing'),
    ).toEqual([])
  })

  it('calculates route distance and detects when a visitor leaves the network', () => {
    const waypoints = valle.waypoints ?? []
    expect(
      routeDistanceInMeters(
        [
          { x: 0, z: 0 },
          { x: 3, z: 4 },
        ],
        10,
      ),
    ).toBe(50)
    expect(distanceToNetwork(waypoints, { x: 2, z: 0 }, 10)).toBe(20)
    expect(isOffRoute(waypoints, { x: 2, z: 0 }, 30, 10)).toBe(false)
    expect(isOffRoute(waypoints, { x: 6, z: 6 }, 30, 10)).toBe(true)
  })

  it('uses segment weights for the route distance', () => {
    expect(routeDistanceToAttraction(valle, mirador)).toBe(109)
    expect(routeDistanceToAttraction(valle, mirador, { x: -5, z: 4 })).toBe(116)
  })

  it('reports completed and remaining route progress', () => {
    const progress = progressOnRoute(
      [
        { x: 0, z: 0 },
        { x: 3, z: 0 },
        { x: 6, z: 0 },
      ],
      { x: 3, z: 0 },
      10,
    )
    expect(progress.completedMeters).toBe(30)
    expect(progress.remainingMeters).toBe(30)
    expect(progress.ratio).toBe(0.5)
    expect(progress.nextPoint).toEqual({ x: 6, z: 0 })
  })

  it('describes the next turn on a route', () => {
    const instruction = nextRouteInstruction(
      [
        { x: 0, z: 0 },
        { x: 3, z: 0 },
        { x: 3, z: 3 },
      ],
      { x: 0, z: 0 },
      10,
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
})
