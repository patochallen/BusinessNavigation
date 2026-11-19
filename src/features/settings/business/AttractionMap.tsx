import { useMemo } from 'react'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { useGeolocation } from '../../../services/location'
import { useLoader } from '@react-three/fiber'
import { useLocation } from 'react-router-dom'
import { SceneObject } from '../../../domain/scene-model'
import { AttractionFirstPersonView } from '../AttractionFirstPersonView'
import { Color, type Mesh, type MeshStandardMaterial } from 'three'

export const AttractionMap = () => {
  const { business, attractionName } = useLocation().state
  if (!business) return <div>Business not found</div>
  const model = useMemo(
    () =>
      new SceneObject(
        useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${business.sceneUrl}`).scene.clone(),
      ),
    [business.sceneUrl],
  )
  const attraction = useMemo(() => {
    const selectedAttraction = model
      .getAttractions()
      .find((attraction) => attraction.getName() === attractionName)
    if (!selectedAttraction) throw new Error('Attraction not found')
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
    attr.position.add(model.getPosition().add(selectedAttraction.getPosition()))
    return attr
  }, [model, attractionName])
  const { position: geoPosition } = useGeolocation()
  const location = useMemo(() => geoPosition?.coords, [geoPosition])

  return (
    <div className="business-details">
      <AttractionFirstPersonView
        scene={model}
        location={location}
        destination={business.location}
        businessId={business.id}
        attraction={attraction}
      />
    </div>
  )
}
