import { describe, expect, it } from 'vitest'
import { businesses } from '../../domain/demo-data'
import { createBusinessTerrainGeometry } from './business-terrain-geometry'

describe('business terrain geometry', () => {
  it('creates a triangulated cap and side walls with configured depth', () => {
    const business = businesses[0]
    const geometry = createBusinessTerrainGeometry(business)

    geometry.computeBoundingBox()
    expect(geometry.getAttribute('position').count).toBeGreaterThan(business.boundary.length * 2)
    expect(geometry.groups.some((group) => group.materialIndex === 0)).toBe(true)
    expect(geometry.groups.some((group) => group.materialIndex === 1)).toBe(true)
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0, 5)
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-business.terrain.thicknessMeters, 5)

    geometry.dispose()
  })
})
