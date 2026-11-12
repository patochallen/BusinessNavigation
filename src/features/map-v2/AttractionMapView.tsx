import { PerspectiveCamera, Vector2, Mesh, Vector3 } from 'three'
import type { SceneObject } from '../../domain/scene-model'
import './AttractionMapView.css'
import type { Coordinate } from '../../domain/types'
import { useMemo, useEffect, useState } from 'react'
import { angle2D, toPoint } from '../../utils/utils'
import { Canvas } from '@react-three/fiber'
import { CardinalMarkers } from '../map/NavigationMapView copy 3'
import { SceneModelView } from '../map/SceneModelView'
import { CompassView } from '../map/CompassView'
import { IconButton } from '../layout/IconButton'
import { Settings2 } from 'lucide-react'
import { button, Leva, useControls } from 'leva'
import { PathShape } from './PathShape'
import { AttractionMarker } from './AttractionMarker'
import { MapComposer } from './MapComposer'
import { useDeviceOrientation } from './useDeviceOrientation'
import { DeviceOrientationControls } from '@react-three/drei'

const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }
const ParkLocation = { latitude: -34.550539413457, longitude: -58.48003697685765 }

type AttractionMapViewProps = {
  userPosition: GeolocationCoordinates | Coordinate | undefined
  scene: SceneObject
  attraction: Mesh
}

export const AttractionMapView = ({ userPosition, scene, attraction }: AttractionMapViewProps) => {
  const [showControls, setShowControls] = useState(false)
  const [{ fov, offset, opacity, fakeLocation }, setControls] = useControls(() => ({
    fov: { value: 60, min: 30, max: 120, step: 1, label: 'FOV' },
    offset: { value: 0, min: -180, max: 180, step: 1, label: 'Offset' },
    opacity: { value: 0.1, min: 0, max: 1, step: 0.05, label: 'Opacity' },
    fakeLocation: { value: false, label: 'Fake Location' },
    reset: button(() =>
      setControls({
        fov: 60,
        offset: 0,
        opacity: 0.1,
        fakeLocation: false,
      }),
    ),
  }))
  const { heading, permission, start } = useDeviceOrientation()
  const position = useMemo(() => {
    return toPoint(pos, fakeLocation ? ParkLocation : userPosition ? userPosition : ParkLocation)
  }, [userPosition, fakeLocation])
  const attractionPosition = useMemo(() => {
    return new Vector2(attraction.position.x, attraction.position.z)
  }, [attraction])
  const camera = useMemo(
    () => new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.5, 2000),
    [],
  )
  const { distance, angle } = useMemo(() => {
    const distance = position.distanceTo(attractionPosition)
    const angle = (angle2D(position, attractionPosition) + 90) % 360
    return { distance, angle }
  }, [position, attractionPosition])
  const angleDifference = useMemo(() => {
    let ang = (angle - (heading ?? 0) + offset) % 360
    if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [heading, angle, offset])

  const pathShape = useMemo(
    () => PathShape({ from: position, to: attractionPosition }),
    [position, attractionPosition],
  )

  useEffect(() => {
    console.log('permission:', permission)
    if (permission === 'granted') {
      console.log('Starting device orientation...')
      start()
    }
  }, [permission])

  // useEffect(() => {
  //   console.log('Starting device orientation...')
  //   start()
  // }, [])

  useEffect(() => {
    scene.setSceneOpacity(opacity)
  }, [opacity])

  useEffect(() => {
    camera.position.set(position.x, 1.6, position.y)
  }, [camera, position])

  // useEffect(() => {
  //   if (quaternion && camera) {
  //     camera.quaternion.copy(
  //       quaternion
  //         .clone()
  //         .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), degToRad(offset))),
  //     )
  //   }
  // }, [quaternion, camera, offset])

  return (
    <div className="attraction-map-view">
      <Leva hidden={!showControls} />
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
        <DeviceOrientationControls />
        {/* <CameraControls /> */}
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
      <CompassView heading={((heading ?? 0) + offset) % 360} size={50} />
      <IconButton
        icon={<Settings2 />}
        position="topRight"
        onClick={() => setShowControls(!showControls)}
      />
    </div>
  )
  // return <div className="attraction-map-view">Attraction Map View</div>
}
