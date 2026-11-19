import { useMemo } from 'react'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { useGeolocation } from '../../../services/location'
import { FirstPersonView } from '../FirstPersonView'
import { useLoader } from '@react-three/fiber'
import { useLocation } from 'react-router-dom'

export const BusinessMap = () => {
  const { business } = useLocation().state
  const model = useMemo(
    () => useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${business.sceneUrl}`).scene.clone(),
    [business.sceneUrl],
  )
  const { position: geoPosition } = useGeolocation()
  const location = useMemo(() => geoPosition?.coords, [geoPosition])

  return (
    <div className="business-details">
      <FirstPersonView
        scene={model}
        location={location}
        destination={business.location}
        businessId={business.id}
      />
    </div>
  )
}
