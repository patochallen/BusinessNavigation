import { Canvas, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Attraction, Business, Coordinate } from '../../domain/types'
import './MapView.css'
import { RefreshCwOff } from 'lucide-react'
import { IconButton } from '../layout/IconButton'
import { CompassView } from './CompassView'
import { BusinessMapView } from './BusinessMapView'
import { PerspectiveCamera, Vector3 } from 'three'
import { useEffect, useMemo, useState } from 'react'
import { CameraControls, CameraControlsImpl, DeviceOrientationControls } from '@react-three/drei'
import { center, toBoundary, toPoint } from '../../utils/utils'
import { SceneModel } from '../../domain/scene-model'
import { SceneModelView } from './SceneModelView'

const CAMERA_FOV = 50
const MIN_CAMERA_HEIGHT = 3
const USER_HEIGHT = 1
const MAX_CAMERA_HEIGHT = 3000
const CONTROLS_SPEED = 0.5
const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }

type MapViewProps = {
  business: Business
  userPosition: GeolocationCoordinates
  heading: number
  onSelect: (id: string) => void
  selectedAttraction?: Attraction | null
}

export function MapView({ business, userPosition, heading }: MapViewProps) {
  const mapBoundary = toBoundary(business.boundary)
  // const distanceToBusiness = SphericalUtil.computeDistanceBetween(business.mapOrigin, userPosition)
  // const headingToBusiness = SphericalUtil.computeHeading(business.mapOrigin, userPosition)
  const position = toPoint(pos, userPosition)
  const cameraHeight = //2 //
    Math.max(mapBoundary.x, mapBoundary.y) / (window.innerWidth / window.innerHeight) // * 2
  // console.log('cameraHeight:', cameraHeight, 'window', window.innerWidth / window.innerHeight)
  const [selectedPosition, setSelectedPosition] = useState<Vector3 | null>(null)
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
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
    const clonedScene = model.scene.clone(true)
    const sceneModel = new SceneModel(clonedScene)
    // sceneModel.log()
    return sceneModel.getScene()
  }, [])

  const businessView = useMemo(
    () => (
      <BusinessMapView
        business={business}
        onSelectAttraction={(attraction) => {
          const point = toPoint(center(business.boundary), center(attraction.boundary))
          const pos = new Vector3(point.x, 0.2, point.y)
          // console.log('Selected position:', pos)
          setSelectedPosition((prev) => (prev !== null && prev.equals(pos) ? null : pos))
        }}
      />
    ),
    [business],
  )
  const [controls, setControls] = useState<CameraControlsImpl | null>(null)
  const [fov, setFov] = useState(CAMERA_FOV)

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [fov])
  useEffect(() => {
    changeCameraMode(move)
    // camera.position.set(position.x, camera.position.y, position.y)
  }, [position])

  useEffect(() => {
    if (!controls) return
    controls.saveState()
    // animate()
  }, [controls])

  useEffect(() => {
    if (!controls) return
    if (!selectedPosition) {
      controls.reset(true)
      return
    }
    // const pos = { x: selectedAttraction.position.x, y: selectedAttraction.position.z } //toPoint(center(business.boundary), center(selectedAttraction.boundary))
    const from = new Vector3(0, 90, 0).clone()
    const to = selectedPosition
    const distance = from.distanceTo(to)
    console.log('From:', from, 'To:', to, 'distance:', distance)
    controls.setLookAt(...from.toArray(), ...to.toArray(), true)
    controls.zoomTo(distance / 30, true)
  }, [selectedPosition])

  const changeCameraMode = (move: boolean) => {
    if (selectedPosition) return
    const p = new Vector3(
      move ? position.x : 0,
      move ? USER_HEIGHT : cameraHeight,
      move ? position.y : 0,
    )
    camera.position.set(p.x, p.y, p.z)
    scene?.setBuildingWireframe(move)
    setMove(move)
  }

  // 1. Create a persistent frustum and matrix to avoid garbage collection overhead
  // const frustum = new Frustum()
  // const projScreenMatrix = new Matrix4()

  // function animate() {
  //   requestAnimationFrame(animate)

  //   // 2. Update the frustum using the camera's current matrices
  //   projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  //   frustum.setFromProjectionMatrix(projScreenMatrix)

  //   // 3. Check if the mesh is inside or entering the camera view
  //   // Note: Ensure your mesh has updated bounding boxes (mesh.geometry.computeBoundingBox())
  //   // const isVisibleThisFrame = frustum.intersectsObject(scene.getBuildings()[0])
  //   scene.getAttractions().forEach((attraction) => {
  //     if (frustum.intersectsObject(attraction)) {
  //       console.log(`Attraction ${attraction.name} has ENTERED the camera view!`)
  //     }
  //   })

  //   // 4. Detect state changes (Entering / Exiting)
  //   // if (isVisibleThisFrame && !isMeshCurrentlyVisible) {
  //   //   console.log('Mesh has ENTERED the camera view!')
  //   //   isMeshCurrentlyVisible = true
  //   //   // Trigger your "onEnter" logic here
  //   // } else if (!isVisibleThisFrame && isMeshCurrentlyVisible) {
  //   //   console.log('Mesh has EXITED the camera view!')
  //   //   isMeshCurrentlyVisible = false
  //   //   // Trigger your "onExit" logic here
  //   // }
  // }

  const resetCamera = () => {
    controls?.reset(true)
    scene?.setSceneOpacity(1)
    scene?.setSceneWireframe(false)
    setMove(false)
    setShow(false)
    setSelectedPosition(null)
    setFov(CAMERA_FOV)
  }

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'R' || event.key === 'r') resetCamera()
        if (event.key === 'S' || event.key === 's') {
          setShow(!show)
        }
        if (event.key === 'C' || event.key === 'c') {
          changeCameraMode(!move)
        }
        if (event.key === 'Z' || event.key === 'z') {
          scene?.setSceneOpacity(0.1)
        }
        if (event.key === 'X' || event.key === 'x') {
          scene?.setSceneOpacity(1)
        }
        if (event.key === 'A' || event.key === 'a') {
          scene?.toggleAttractions()
        }
        if (event.key === 'F' || event.key === 'f') {
          scene?.toggleFloor()
        }
        if (event.key === 'P' || event.key === 'p') {
          scene?.togglePaths()
        }
        if (event.key === 'W' || event.key === 'w') {
          scene?.toggleSceneWireframe()
        }
      }}
      tabIndex={0}
    >
      <Canvas className="map-canvas" dpr={[1, 2]} camera={camera} shadows>
        {/* <gridHelper args={[600, 400]} /> */}
        <hemisphereLight intensity={1} />
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
        {scene && (
          <SceneModelView
            scene={scene}
            onAttractionClick={(attraction) => {
              if (move) return
              const pos = attraction.getPosition().clone().add(scene.getPosition()).setY(0.2)
              console.log('Attraction selected:', attraction, pos)
              setSelectedPosition((prev) => (prev !== null && prev.equals(pos) ? null : pos))
            }}
          />
        )}
        {!move && (
          <mesh position={[position.x, 0, position.y]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#f366cd" />
          </mesh>
        )}
        {/* <Line
          position={[0, 0.2, 0]}
          rotation={[0, degToRad(90 - headingToBusiness), 0]}
          lineWidth={3}
          points={[new Vector3(), new Vector3(distanceToBusiness, 0, 0)]}
          color="#ff0000"
        /> */}
        {move && <DeviceOrientationControls />}
        {!move && (
          <CameraControls
            ref={setControls}
            minDistance={MIN_CAMERA_HEIGHT}
            maxDistance={MAX_CAMERA_HEIGHT * 0.9}
            dollySpeed={CONTROLS_SPEED}
            azimuthRotateSpeed={CONTROLS_SPEED}
            polarRotateSpeed={CONTROLS_SPEED}
            truckSpeed={CONTROLS_SPEED}
            maxPolarAngle={Math.PI / 2}
          />
        )}
      </Canvas>
      <IconButton
        icon={<RefreshCwOff />}
        position="topLeft"
        onClick={() => {
          scene?.toggleSceneWireframe()
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
        <input type="checkbox" checked={move} onChange={() => changeCameraMode(!move)} />
      </div>
      <CompassView heading={heading} />
      <IconButton
        icon={<RefreshCwOff />}
        position="bottomLeft"
        onClick={() => changeCameraMode(!move)}
      />
    </div>
  )
}
