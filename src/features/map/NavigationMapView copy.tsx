import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Coordinate } from '../../domain/types'
import type { AttractionModel } from '../../domain/scene-model'
import './MapView.css'
import { CameraHelper, Mesh, PerspectiveCamera, Vector2, Vector3, Vector4 } from 'three'
import { useMemo } from 'react'
import { CameraControls, DeviceOrientationControls, Line, OrbitControls } from '@react-three/drei'
import { angle2D, toPoint } from '../../utils/utils'
import { SceneModel } from '../../domain/scene-model'
import { SceneModelView } from './SceneModelView'
import { IconButton } from '../layout/IconButton'
import { ArrowBigUpDash, RefreshCwOff, X } from 'lucide-react'
import { CompassView } from './CompassView'
import { degToRad } from 'three/src/math/MathUtils.js'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three-stdlib'
import { ArrowOverlay } from './ArrowOverlay'

const CAMERA_FOV = 50
const MAX_CAMERA_HEIGHT = 2000
const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }
const showTopView = false
const cameraHeight = showTopView ? 445 : 1

function MainCameraHelper({ camera }: { camera: PerspectiveCamera }) {
  const helper = useRef<CameraHelper>(null)

  useFrame(() => {
    camera.updateMatrixWorld()
    helper.current?.update()
  })

  return <cameraHelper ref={helper} args={[camera]} />
}

function CameraPictureInPicture({ secondaryCamera }: { secondaryCamera: PerspectiveCamera }) {
  const viewport = useMemo(() => new Vector4(), [])
  const scissor = useMemo(() => new Vector4(), [])

  useFrame(({ gl, scene, camera, size }) => {
    gl.getViewport(viewport)
    gl.getScissor(scissor)
    const scissorTest = gl.getScissorTest()
    const autoClear = gl.autoClear
    const aspect = secondaryCamera.aspect
    const width = Math.min(size.width * 0.32, 280)
    const height = width * 0.75
    const left = size.width - width - 16
    const bottom = size.height - height - 90

    try {
      gl.autoClear = true
      gl.setScissorTest(false)
      gl.setViewport(0, 0, size.width, size.height)
      gl.render(scene, camera)

      secondaryCamera.aspect = width / height
      secondaryCamera.updateProjectionMatrix()
      gl.setViewport(left, bottom, width, height)
      gl.setScissor(left, bottom, width, height)
      gl.setScissorTest(true)
      gl.render(scene, secondaryCamera)
    } finally {
      secondaryCamera.aspect = aspect
      secondaryCamera.updateProjectionMatrix()
      gl.setViewport(viewport)
      gl.setScissor(scissor)
      gl.setScissorTest(scissorTest)
      gl.autoClear = autoClear
    }
  }, 1)

  return null
}

type NavigationMapViewProps = {
  userPosition: GeolocationCoordinates | Coordinate
  heading: number
  selectedAttraction: AttractionModel
  onClose: () => void
}

export function NavigationMapView({
  userPosition,
  heading,
  selectedAttraction,
  onClose,
}: NavigationMapViewProps) {
  const aspect = window.innerWidth / window.innerHeight
  const position = useMemo(() => {
    console.log('Converting user position to point:', userPosition)
    return toPoint(pos, userPosition)
  }, [userPosition])
  const scene = useMemo(() => {
    console.log('Loading scene model')
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
    const clonedScene = model.scene.clone(true)
    const sceneModel = new SceneModel(clonedScene)
    return sceneModel.getScene()
  }, [])
  const attractionPosition = useMemo(() => {
    const pos = selectedAttraction.getPosition()?.add(scene.getPosition()) || new Vector3()
    return new Vector2(pos.x, pos.z)
  }, [selectedAttraction])
  const distanceToAttraction = useMemo(
    () => position.distanceTo(attractionPosition),
    [position, attractionPosition],
  )
  const [topView, setTopView] = useState(showTopView)
  const angleToAttraction = useMemo(() => {
    let ang = (360 - ((angle2D(position, attractionPosition) + 90) % 360)) % 360
    // if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [position, attractionPosition])
  const angleDifferenceToAttraction = useMemo(() => {
    let ang = (angleToAttraction - heading) % 360
    if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [heading, angleToAttraction])
  const camera: PerspectiveCamera = useMemo(() => {
    console.log('Creating camera')
    const cam = new PerspectiveCamera(CAMERA_FOV, aspect, 0.01, 600)
    cam.name = 'MainCamera'
    cam.position.set(0, cameraHeight, 0)
    // cam.rotation.x = -Math.PI / 2
    return cam
  }, [])
  const camera2: PerspectiveCamera = useMemo(() => {
    console.log('Creating camera2')
    const cam = new PerspectiveCamera(CAMERA_FOV, aspect, 0.01, MAX_CAMERA_HEIGHT)
    cam.name = 'TopViewCamera'
    cam.position.set(0, 245, 0)
    cam.rotation.x = -Math.PI / 2
    // !showTopView && (cam.rotation.x = -Math.PI / 2)
    return cam
  }, [])
  const controls = useRef<DeviceOrientationControlsImp>(null)
  const [fov, setFov] = useState(CAMERA_FOV)
  const hFov = useMemo(() => {
    const vFOV = camera.fov * (Math.PI / 180) // convert vertical FOV to radians
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect)
    const hFOVDegrees = hFOV * (180 / Math.PI)
    return hFOVDegrees * 0.98
  }, [fov])

  useEffect(() => {
    // const pos = new Vector3(position.x, cameraHeight, position.y)
    camera.position.set(position.x, cameraHeight, position.y)
    camera2.position.set(position.x, 445, position.y)
    console.log('Camera position:', camera.position, 'Camera2 position:', camera2.position)
  }, [position])

  // useEffect(() => {
  //   console.log(
  //     `Heading: ${heading.toFixed(2)}`,
  //     `Angle: ${angleToAttraction.toFixed(2)}`,
  //     `Difference: ${angleDifferenceToAttraction.toFixed(2)}`,
  //   )
  // }, [angleDifferenceToAttraction])

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [fov])

  return (
    <div
      style={{ overflow: 'hidden', width: '100%', height: '100%', position: 'absolute' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'C' || e.key === 'c') setTopView((prev) => !prev)
      }}
      tabIndex={0}
    >
      <Canvas className="map-canvas" dpr={[1, 2]} camera={topView ? camera2 : camera} shadows>
        {topView && <MainCameraHelper camera={camera} />}
        <hemisphereLight intensity={1} />
        {/* <ambientLight intensity={0.8} /> */}
        <directionalLight
          position={[-2, 52, 1.1]}
          intensity={5}
          color="#fff1d0"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <SceneModelView scene={scene} />
        <mesh position={[position.x, 0, position.y]}>
          <sphereGeometry args={[0.05, 32, 32]} />
          <meshStandardMaterial color="#d3f206" />
        </mesh>
        <mesh>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial color="#f21e06" />
        </mesh>
        <mesh position={[attractionPosition.x, 0, attractionPosition.y]}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial color="#f366cd" />
        </mesh>
        <group name="Navigation Lines">
          <Line
            position={[position.x, 0, position.y]}
            rotation={[0, degToRad((angleToAttraction + 90) % 360), 0]}
            lineWidth={10}
            points={[new Vector3(), new Vector3(distanceToAttraction, 0, 0)]}
            color="#ff0000"
          />
          <Line
            position={[position.x, 0, position.y]}
            rotation={[
              0,
              degToRad((angleToAttraction + 90 - angleDifferenceToAttraction) % 360),
              0,
            ]}
            lineWidth={2}
            points={[new Vector3(), new Vector3(distanceToAttraction, 0, 0)]}
            color="#1013e8"
          />
        </group>
        <group name="Camera Fov">
          <Line
            position={[position.x, 0, position.y]}
            rotation={[
              0,
              degToRad((angleToAttraction + 90 - angleDifferenceToAttraction + hFov / 2) % 360),
              0,
            ]}
            lineWidth={5}
            points={[new Vector3(), new Vector3(600, 0, 0)]}
            color="#dae810"
          />
          <Line
            position={[position.x, 0, position.y]}
            rotation={[
              0,
              degToRad((angleToAttraction + 90 - angleDifferenceToAttraction - hFov / 2) % 360),
              0,
            ]}
            lineWidth={5}
            points={[new Vector3(), new Vector3(600, 0, 0)]}
            color="#dae810"
          />
        </group>
        {topView && (
          <OrbitControls
            target={[camera.position.x, camera.position.y, camera.position.z]}
            camera={camera2}
          />
        )}
        <DeviceOrientationControls
          camera={camera}
          ref={controls}
          onChange={(e) => {
            console.log('Device orientation changed:', e?.target)
          }}
        />
        <CameraPictureInPicture secondaryCamera={topView ? camera : camera2} />
      </Canvas>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 90,
          right: 16,
          width: 'min(32%, 280px)',
          aspectRatio: '4 / 3',
          outline: '2px solid white',
          pointerEvents: 'none',
        }}
      />
      <>
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
          }}
        >
          {selectedAttraction.getName()}, {angleToAttraction.toFixed(0)}º
        </div>
        <div
          className="centered-circle"
          style={{ transform: `translate(-50%, 0%) rotate(${-angleDifferenceToAttraction}deg)` }}
        >
          <ArrowBigUpDash
            style={{
              color: 'red',
              position: 'relative',
              top: '-30px',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            size={42}
          />
          <h2
            style={{
              transform: `translate(-50%, -50%) rotate(${angleDifferenceToAttraction}deg)`,
              left: '50%',
              top: '50%',
              position: 'absolute',
              color: 'white',
            }}
          >
            {angleDifferenceToAttraction.toFixed(1)}°
          </h2>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '70px',
            paddingTop: '20px',
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
        </div>
        <IconButton
          icon={<RefreshCwOff />}
          position="topLeft"
          onClick={() => {
            setTopView(!topView)
            // const vFOV = camera.fov * (Math.PI / 180) // convert vertical FOV to radians
            // const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect)
            // const hFOVDegrees = hFOV * (180 / Math.PI)
            // console.log('Horizontal FOV (degrees):', hFOVDegrees)
          }}
        />
        <CompassView heading={heading} />
        <IconButton icon={<X />} position="topRight" onClick={onClose} />
      </>
      <ArrowOverlay distance={distanceToAttraction} heading={angleDifferenceToAttraction} />
    </div>
  )
}
