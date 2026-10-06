import { useState } from 'react'
import { AttractionModel, SceneObject } from '../../domain/scene-model'
import { Vector3 } from 'three'

export const SceneModelView = ({
  scene,
  onAttractionClick,
}: {
  scene: SceneObject
  onAttractionClick?: (attraction: AttractionModel) => void
  onPositionSelected?: (position: Vector3) => void
}) => {
  const [attractionDown, setAttractionDown] = useState<AttractionModel | null>(null)
  return (
    <group position={scene.getPosition()}>
      {scene.getAttractions()?.map((attraction, index) => {
        const floor = attraction.getFloor()
        const building = attraction.getBuilding()
        const position = attraction.getPosition()
        return (
          <group
            key={index}
            position={position}
            onPointerDown={() => setAttractionDown(attraction)}
            onPointerUp={(e: React.MouseEvent) => {
              if (attractionDown !== attraction) return
              // console.log(`Attraction ${attraction?.getName()} clicked:`, attraction)
              onAttractionClick?.(attraction)
              setAttractionDown(null)
              e.stopPropagation()
            }}
          >
            <primitive object={floor} />
            {building && <primitive object={building} />}
            <mesh position={position}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
          </group>
        )
      })}
      {scene.getFloor() && <primitive object={scene.getFloor()!} />}
      {scene.getPaths() && <primitive object={scene.getPaths()!} />}
    </group>
  )
}
