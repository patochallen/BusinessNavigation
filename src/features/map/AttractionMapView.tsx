import { PerspectiveCamera, Vector2, Mesh, Vector3, Quaternion } from 'three'
import type { SceneObject } from '../../domain/scene-model'
import './AttractionMapView.css'
import type { Coordinate } from '../../domain/types'
import { useMemo, useEffect, useState } from 'react'
import { angle2D, toPoint } from '../../utils/utils'
import { Canvas } from '@react-three/fiber'
import { CardinalMarkers } from './NavigationMapView copy 3'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { SceneModelView } from './SceneModelView'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { CompassView } from './CompassView'
import { IconButton } from '../layout/IconButton'
import { Settings2 } from 'lucide-react'
import { useDeviceOrientation } from '../../services/device-orientation'
import { button, Leva, useControls } from 'leva'
import { degToRad } from 'three/src/math/MathUtils.js'

const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }
const ParkLocation = { latitude: -34.550539413457, longitude: -58.48003697685765 }

type AttractionMapViewProps = {
  userPosition: GeolocationCoordinates | Coordinate | undefined
  scene: SceneObject
  attraction: Mesh
}

export const AttractionMapView = ({ userPosition, scene, attraction }: AttractionMapViewProps) => {
  const [showControls, setShowControls] = useState(false)
  const [{ fov, offset, fakeLocation, orbitActive, absolute }, setControls] = useControls(() => ({
    fov: { value: 60, min: 30, max: 120, step: 1, label: 'FOV' },
    offset: { value: 0, min: -180, max: 180, step: 1, label: 'Offset' },
    fakeLocation: { value: false, label: 'Fake Location' },
    orbitActive: { value: false, label: 'Orbit Active' },
    absolute: { value: true, label: 'Absolute Orientation' },
    reset: button(() =>
      setControls({ fov: 60, offset: 0, fakeLocation: false, orbitActive: false, absolute: true }),
    ),
  }))
  const { heading, quaternion, enable } = useDeviceOrientation(absolute)
  const position = useMemo(() => {
    return toPoint(pos, fakeLocation ? ParkLocation : userPosition ? userPosition : ParkLocation)
  }, [userPosition, fakeLocation])
  const attractionPosition = useMemo(() => {
    return new Vector2(attraction.position.x, attraction.position.z)
  }, [attraction])
  const aspect = window.innerWidth / window.innerHeight
  const camera = useMemo(() => new PerspectiveCamera(fov, aspect, 0.5, 2000), [fov, aspect])
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

  useEffect(() => {
    enable()
  }, [])

  useEffect(() => {
    camera.position.set(position.x, 1.6, position.y)
  }, [camera, position])

  useEffect(() => {
    if (quaternion && camera && !orbitActive) {
      camera.quaternion.copy(
        quaternion
          .clone()
          .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), degToRad(offset))),
      )
    }
  }, [quaternion, camera, offset])

  return (
    <div className="attraction-map-view">
      <Leva hidden={!showControls} />
      <Canvas camera={camera}>
        <gridHelper args={[6, 30]} />
        <CardinalMarkers position={new Vector3(position.x, 0, position.y)} />
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <EffectComposer>
          {/* <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} /> */}
          <Bloom luminanceThreshold={0.6} intensity={0.5} mipmapBlur />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
        <SceneModelView scene={scene} />
        <mesh position={new Vector3(position.x, 0, position.y)}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
        <primitive object={attraction} />
        <group position={attraction.position}>
          <Line
            points={[
              [0, 0, 0],
              [0, distance / 4, 0],
            ]}
            color="#66def3"
            lineWidth={2}
            depthTest={false}
            renderOrder={10}
          />
          <Html
            position={[0, distance / 4, 0]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <span className="navigation-attraction-label">{attraction.name}</span>
          </Html>
        </group>
        <OrbitControls enabled={orbitActive} camera={camera} maxPolarAngle={Math.PI / 2} />
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
