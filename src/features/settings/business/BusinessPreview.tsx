import { useEffect, useMemo } from 'react'
import { businessModels } from '../business-model'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { BusinessItem } from './BusinessSelection'
import { useNavigate, useParams } from 'react-router-dom'
import { SceneObject } from '../../../domain/scene-model'
import { AttractionList } from '../../map-v3/AppV2'
import './BusinessPreview.css'
import { useGeolocation } from '../../../services/location'
import { toPoint, toV3 } from '../../../utils/utils'
import { Vector2 } from 'three'
import { useSettings } from '../../../data/useSettings'

export const BusinessPreview = () => {
  const navigate = useNavigate()
  const { businessId } = useParams<{ businessId: string }>()
  const business = useMemo(() => businessModels.find((b) => b.id === businessId), [businessId])
  if (!business) return <div>Business not found</div>
  const settings = useSettings(business.id)
  const model = useMemo(
    () =>
      new SceneObject(
        useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${business.sceneUrl}`).scene.clone(),
      ),
    [business.sceneUrl],
  )
  const { position: geoPosition } = useGeolocation()
  const location = useMemo(() => geoPosition?.coords, [geoPosition])
  const position = useMemo(
    () =>
      location && business.location
        ? toPoint(location, business.location).negate().sub(toV3(settings.locationOffset))
        : new Vector2(),
    [location, business.location, settings.locationOffset],
  )

  useEffect(() => {
    console.log('Model updated:', model.getPosition())
  }, [model])

  return (
    <div className="business-preview">
      <BusinessItem
        business={business}
        onSelect={() => navigate(`/map/${businessId}`, { state: { business } })}
      />
      <AttractionList
        position={position}
        offset={0}
        attractions={model.getAttractions()}
        onSelect={(attraction) =>
          navigate(`/attraction`, { state: { business, attractionName: attraction.getName() } })
        }
      />
    </div>
  )
}
