import { LocationStorage } from '../../data/storage-repository'
import { useGeolocation } from '../../services/location'
import { useMemo, useState } from 'react'
import { Vector3, Vector2 } from 'three'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'
import type { Coordinate } from '../../domain/types'
import { degToRad } from 'three/src/math/MathUtils.js'
import { toV3 } from '../../utils/utils'

export const useOffsetLocation = ({ bussinesLocation }: { bussinesLocation: Coordinate }) => {
  const { position: geoPosition } = useGeolocation()
  const location = useMemo(() => geoPosition?.coords, [geoPosition])
  const [offset, setOffset] = useState(LocationStorage.getLocationOffset())
  const position = useMemo(() => {
    if (!location) return new Vector3(0, 0, 0)
    const { distanceMeters, headingDegrees } = getDistanceAndHeadingBetweenLocations(
      location,
      bussinesLocation,
    )
    const p = new Vector3(
      distanceMeters * Math.sin(degToRad(headingDegrees)),
      0,
      -distanceMeters * Math.cos(degToRad(headingDegrees)),
    )
    return p
  }, [location])
  const offsetPosition = useMemo(() => position.clone().sub(toV3(offset)), [position, offset])

  const updateOffset = (newOffset: Vector2) => {
    setOffset(newOffset)
    LocationStorage.setLocationOffset(newOffset)
  }

  const clearOffset = () => {
    setOffset(new Vector2(0, 0))
    LocationStorage.removeLocationOffset()
  }

  return { location, position, offset, offsetPosition, updateOffset, clearOffset }
}
