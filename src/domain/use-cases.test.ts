import { describe, expect, it } from 'vitest'
import { businesses } from './demo-data'
import { distanceBetweenPoints, filterAttractions, findAttraction, findBusiness, localPointFromGps } from './use-cases'

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
    expect(localPointFromGps(valle.mapOrigin, valle.mapOrigin, valle.mapScaleMeters)).toEqual({ x: 0, z: -0 })
  })

  it('calculates distance in scaled local meters', () => {
    expect(distanceBetweenPoints({ x: 0, z: 0 }, { x: 3, z: 4 }, 10)).toBe(50)
  })

  it('converts GPS and measures from the same origin', () => {
    const nearby = geolocationAt(valle.mapOrigin.latitude, valle.mapOrigin.longitude + 10 / 111_320)
    const point = localPointFromGps(valle.mapOrigin, { latitude: nearby.coords.latitude, longitude: nearby.coords.longitude }, 1)
    expect(point.x).toBeCloseTo(8.46, 1)
    expect(point.z).toBeCloseTo(0, 5)
  })
})
