import { Canvas, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Attraction, Business, Coordinate } from '../../domain/types'
import './MapView.css'
import { RefreshCwOff } from 'lucide-react'
import { IconButton } from '../layout/IconButton'
import { CompassView } from './CompassView'
import { BusinessMapView } from './BusinessMapView'
import { PerspectiveCamera } from 'three'
import { useEffect, useMemo, useState } from 'react'
import { DeviceOrientationControls } from '@react-three/drei'
import { toBoundary, toPoint } from '../../utils/utils'
import { SceneModel } from '../../domain/scene-model'
import { SceneModelView } from './SceneModelView'

const CAMERA_FOV = 50
const MAX_CAMERA_HEIGHT = 3000
const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }

type DeviceMapViewProps = {
  business: Business
  userPosition: GeolocationCoordinates
  heading: number
  onSelect: (id: string) => void
  selectedAttraction?: Attraction | null
}

export function DeviceMapView({ business, userPosition, heading, onSelect }: DeviceMapViewProps) {
  const mapBoundary = toBoundary(business.boundary)
  // const distanceToBusiness = SphericalUtil.computeDistanceBetween(business.mapOrigin, userPosition)
  // const headingToBusiness = SphericalUtil.computeHeading(business.mapOrigin, userPosition)
  const position = toPoint(pos, userPosition)
  const cameraHeight = //2 //
    Math.max(mapBoundary.x, mapBoundary.y) / (window.innerWidth / window.innerHeight) // * 2
  // console.log('cameraHeight:', cameraHeight, 'window', window.innerWidth / window.innerHeight)
  // const [selectedPosition, setSelectedPosition] = useState<Vector3 | null>(null)
  const [show, setShow] = useState(false)
  const [move, setMove] = useState(false)
  const camera: PerspectiveCamera = useMemo(() => {
    const cam = new PerspectiveCamera(
      CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      1,
      MAX_CAMERA_HEIGHT,
    )
    cam.position.set(0, cameraHeight, 0)
    cam.rotation.x = -Math.PI / 2
    return cam
  }, [])
  const scene = useMemo(() => {
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene.glb`)
    const clonedScene = model.scene.clone(true)
    const sceneModel = new SceneModel(clonedScene)
    // sceneModel.log()
    return sceneModel
  }, [])

  const businessView = useMemo(
    () => <BusinessMapView business={business} onSelectAttraction={() => {}} />,
    [business],
  )
  const [fov, setFov] = useState(CAMERA_FOV)

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [fov])

  const resetCamera = () => {
    scene.setSceneOpacity(1)
    scene.setSceneWireframe(false)
    setMove(false)
    setShow(false)
    setFov(CAMERA_FOV)
  }

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'R' || event.key === 'r') resetCamera()
        if (event.key === 'S' || event.key === 's') {
          setShow(!show)
        }
        if (event.key === 'Z' || event.key === 'z') {
          scene.setSceneOpacity(0.2)
        }
        if (event.key === 'X' || event.key === 'x') {
          scene.setSceneOpacity(1)
        }
        if (event.key === 'A' || event.key === 'a') {
          scene.toggleAttractions()
        }
        if (event.key === 'F' || event.key === 'f') {
          scene.toggleFloor()
        }
        if (event.key === 'P' || event.key === 'p') {
          scene.togglePaths()
        }
        if (event.key === 'W' || event.key === 'w') {
          scene.toggleSceneWireframe()
        }
      }}
      tabIndex={0}
    >
      <Canvas className="map-canvas" dpr={[1, 2]} camera={camera} shadows>
        {/* <gridHelper args={[600, 400]} /> */}
        {/* <hemisphereLight intensity={1} /> */}
        {/* <ambientLight intensity={0.8} /> */}
        <directionalLight
          position={[-2, 52, 1.1]}
          intensity={5}
          color="#fff1d0"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* <MapMeasure ref={mapMeasureRef} /> */}
        {show && businessView}
        <SceneModelView scene={scene} />
        {!move && (
          <mesh position={[position.x, 0, position.y]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#f366cd" />
          </mesh>
        )}
        <DeviceOrientationControls />
      </Canvas>
      <IconButton
        icon={<RefreshCwOff />}
        position="topLeft"
        onClick={() => {
          scene.toggleSceneWireframe()
        }}
      />
      <IconButton
        icon={<RefreshCwOff />}
        position="topRight"
        onClick={() => {
          setShow(!show)
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '50px',
          backgroundColor: 'rgba(243, 237, 237, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>
          <label>FOV: {fov}</label>
          <input
            type="range"
            min="10"
            max="100"
            value={fov}
            onChange={(e) => setFov(Number(e.target.value))}
          />
        </div>
        <input type="checkbox" checked={move} onChange={() => onSelect('')} />
      </div>
      <CompassView heading={heading} />
    </div>
  )
}
