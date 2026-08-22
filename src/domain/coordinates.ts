import type { Coordinate, MapPoint } from './types'

export function localPointFromGps(
  origin: Coordinate,
  coordinate: Coordinate,
  scaleMeters: number,
): MapPoint {
  const metersPerDegreeLatitude = 111_320
  const metersPerDegreeLongitude =
    metersPerDegreeLatitude * Math.cos((origin.latitude * Math.PI) / 180)
  return {
    x: ((coordinate.longitude - origin.longitude) * metersPerDegreeLongitude) / scaleMeters,
    z: -((coordinate.latitude - origin.latitude) * metersPerDegreeLatitude) / scaleMeters,
  }
}
