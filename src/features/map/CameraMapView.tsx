import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CameraView } from '../camera/CameraView'
import { AttractionMapView } from './AttractionMapView'
import './CameraMapView.css'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { SceneModel } from '../../domain/scene-model'
import { Mesh, MeshStandardMaterial, Color } from 'three'
import { DEFAULT_BUSINESS_ID } from '../../main'
import { useGeolocation } from '../../services/location'

export const CameraMapViewContent = () => {
  const { attractionId } = useParams<{ attractionId?: string }>()
  const { position } = useGeolocation()
  const scene = useMemo(() => {
    const sc = getSceneModel()
    sc.setSceneOpacity(0.1)
    return sc
  }, [])
  const attraction = useMemo(() => {
    const selectedAttraction = scene
      .getAttractions()
      .find((attraction) => attraction.getName() === attractionId)
    if (!selectedAttraction) throw new Error('Attraction not found')
    console.log('Selected attraction:', selectedAttraction)
    const attr = selectedAttraction.getBuilding() ?? selectedAttraction.getFloor()
    attr.traverse((child) => {
      child.name = selectedAttraction.getName()
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.geometry = mesh.geometry.clone()
      const material: MeshStandardMaterial = (
        Array.isArray(mesh.material)
          ? mesh.material.map((material) => material.clone())
          : mesh.material.clone()
      ) as MeshStandardMaterial
      material.emissive = new Color('#ffffff')
      material.emissiveIntensity = 1
      material.transparent = false
      material.opacity = 1
      mesh.material = material
    })
    attr.position.add(scene.getPosition().add(selectedAttraction.getPosition()))
    return attr
  }, [scene])

  return (
    <div className="camera-map-view">
      <AttractionMapView userPosition={position?.coords} scene={scene} attraction={attraction} />
      <CameraView />
    </div>
  )
}

export const CameraMapView = () => {
  const navigate = useNavigate()
  const sceneModel = useMemo(() => getSceneModel(), [])

  return (
    <div className="camera-map-view2">
      {sceneModel.getAttractions().map((attraction) => (
        <div
          className="attraction-item"
          key={attraction.id}
          onClick={() => {
            navigate(`/b/${DEFAULT_BUSINESS_ID}/a/${attraction.getName()}`, {
              viewTransition: true,
            })
          }}
        >
          {attraction.getName()}
        </div>
      ))}
    </div>
  )
}

export function getSceneModel() {
  // console.log('Loading scene model')
  const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
  const sceneModel = new SceneModel(model.scene)
  const sc = sceneModel.getScene()
  // sc.setSceneOpacity(0.1)
  return sc
}
