import { PerspectiveCamera, Vector2, Mesh, Vector3 } from 'three'
import type { SceneObject } from '../../domain/scene-model'
import './AttractionMapView.css'
import type { Coordinate } from '../../domain/types'
import { useMemo, useEffect } from 'react'
import { angle2D, toPoint } from '../../utils/utils'
import { Canvas } from '@react-three/fiber'
import { CardinalMarkers } from '../map/NavigationMapView copy 3'
import { SceneModelView } from '../map/SceneModelView'
import { CompassView } from '../map/CompassView'
import { useDeviceOrientation } from '../../services/device-orientation'
import { PathShape } from './PathShape'
import { AttractionMarker } from './AttractionMarker'
import { MapComposer } from './MapComposer'

const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }

type SimpleAttractionMapViewProps = {
  userPosition: GeolocationCoordinates | Coordinate
  scene: SceneObject
  attraction: Mesh
}

export const SimpleAttractionMapView = ({
  userPosition,
  scene,
  attraction,
}: SimpleAttractionMapViewProps) => {
  const { heading, quaternion, enable } = useDeviceOrientation()
  const position = useMemo(() => {
    return toPoint(pos, userPosition)
  }, [userPosition])
  const attractionPosition = useMemo(() => {
    return new Vector2(attraction.position.x, attraction.position.z)
  }, [attraction])
  const camera = useMemo(
    () => new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000),
    [],
  )
  const { distance, angle } = useMemo(() => {
    const distance = position.distanceTo(attractionPosition)
    const angle = (angle2D(position, attractionPosition) + 90) % 360
    return { distance, angle }
  }, [position, attractionPosition])
  const angleDifference = useMemo(() => {
    let ang = (angle - (heading ?? 0)) % 360
    if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [heading, angle])

  const pathShape = useMemo(
    () => PathShape({ from: position, to: attractionPosition }),
    [position, attractionPosition],
  )

  useEffect(() => {
    enable()
  }, [])

  useEffect(() => {
    camera.position.set(position.x, 1.6, position.y)
  }, [camera, position])

  useEffect(() => {
    if (quaternion && camera) {
      camera.quaternion.copy(quaternion.clone())
    }
  }, [quaternion, camera])

  return (
    <div className="attraction-map-view">
      <Canvas camera={camera}>
        <CardinalMarkers position={new Vector3(position.x, 0, position.y)} />
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <MapComposer />
        <SceneModelView scene={scene} />
        <primitive object={attraction} />
        <AttractionMarker attraction={attraction} height={distance} />
        {pathShape && (
          <mesh position={[position.x, 0.2, position.y]} rotation-x={-Math.PI / 2}>
            <shapeGeometry args={[pathShape]} />
            <meshStandardMaterial
              color="black"
              transparent
              opacity={0.8}
              // depthWrite={false}
            />
          </mesh>
        )}
      </Canvas>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        {attraction ? attraction.name : ''}
        <br />
        distance: {distance.toFixed()} mts
        <br />
        angle: {angleDifference.toFixed(1)}º
      </div>
      <CompassView heading={(heading ?? 0) % 360} size={50} />
    </div>
  )
}
