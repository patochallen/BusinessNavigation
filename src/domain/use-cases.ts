import type { Attraction, Business, Category, Coordinate, MapPoint } from './types'

export function findBusiness(businesses: Business[], businessId: string) {
  return businesses.find((business) => business.id === businessId)
}

export function findAttraction(business: Business, attractionId: string) {
  return business.attractions.find((attraction) => attraction.id === attractionId)
}

export function filterAttractions(attractions: Attraction[], category: Category | 'all', query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return attractions.filter((attraction) => {
    const matchesCategory = category === 'all' || attraction.category === category
    const matchesQuery = attraction.name.toLocaleLowerCase().includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })
}

export function localPointFromGps(origin: Coordinate, coordinate: Coordinate, scaleMeters: number): MapPoint {
  const metersPerDegreeLatitude = 111_320
  const metersPerDegreeLongitude = metersPerDegreeLatitude * Math.cos((origin.latitude * Math.PI) / 180)
  return {
    x: ((coordinate.longitude - origin.longitude) * metersPerDegreeLongitude) / scaleMeters,
    z: -((coordinate.latitude - origin.latitude) * metersPerDegreeLatitude) / scaleMeters,
  }
}

export function distanceBetweenPoints(first: MapPoint, second: MapPoint, scaleMeters = 1) {
  const dx = (first.x - second.x) * scaleMeters
  const dz = (first.z - second.z) * scaleMeters
  return Math.round(Math.sqrt(dx * dx + dz * dz))
}
