import { useEffect, useMemo } from 'react'
import type { Business } from '../../domain/types'
import { createBusinessTerrainGeometry } from './business-terrain-geometry'

type BusinessTerrainProps = {
  business: Business
}

export function BusinessTerrain({ business }: BusinessTerrainProps) {
  const geometry = useMemo(() => createBusinessTerrainGeometry(business), [business])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={business.terrain.color} />
      <meshStandardMaterial color={business.terrain.sideColor ?? business.terrain.color} />
    </mesh>
  )
}
