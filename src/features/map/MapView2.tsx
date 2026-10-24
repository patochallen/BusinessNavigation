import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Business, Coordinate } from '../../domain/types'
import './MapView.css'
import { CompassView } from './CompassView'
import { PerspectiveCamera, Vector2, Vector3 } from 'three'
import { useEffect, useMemo, useState } from 'react'
import { CameraControls, CameraControlsImpl, SpotLight } from '@react-three/drei'
import { angle2D, toBoundary, toPoint } from '../../utils/utils'
import { AttractionModel, SceneModel } from '../../domain/scene-model'
import { SceneModelView } from './SceneModelView'
import { AttractionOverlay } from './AttractionOverlay'

const CAMERA_FOV = 50
const MIN_CAMERA_HEIGHT = 3
const MAX_CAMERA_HEIGHT = 3000
const CONTROLS_SPEED = 0.5
const SPOTLIGHT_ANGLE = Math.PI
const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }

function SelectedAttractionOrbit({
  controls,
  active,
}: {
  controls: CameraControlsImpl | null
  active: boolean
}) {
  useFrame(() => {
    if (active && controls) {
      const angle = controls.azimuthAngle % (2 * Math.PI)
      controls.rotateAzimuthTo(angle)
      controls.rotateAzimuthTo(angle + 0.1, true)
    }
  })
  return null
}

type MapView2Props = {
  business: Business
  userPosition: GeolocationCoordinates | Coordinate
  heading: number
  onSelect: (attraction: AttractionModel) => void
}

export function MapView2({ business, userPosition, heading, onSelect }: MapView2Props) {
  const mapBoundary = toBoundary(business.boundary)
  const position = useMemo(() => {
    // console.log('Converting user position to point:', userPosition)
    return toPoint(pos, userPosition)
  }, [userPosition])
  const cameraHeight =
    Math.max(mapBoundary.x, mapBoundary.y) / (window.innerWidth / window.innerHeight)
  const camera: PerspectiveCamera = useMemo(() => {
    // console.log('Creating camera with height:', cameraHeight)
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
    return sceneModel.getScene()
  }, [])
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionModel | null>(
    // scene?.getAttractions()?.[1] ??
    null,
  )
  const [selectedPosition, setSelectedPosition] = useState<Vector3 | null>(null)

  const [controls, setControls] = useState<CameraControlsImpl | null>(null)

  useEffect(() => {
    if (!controls) return
    if (!selectedPosition) {
      controls.reset(true)
      return
    }
    const from = new Vector3(0, 90, 0)
    const selectedPos = new Vector2(selectedPosition.x, selectedPosition.z)
    const distance = from.distanceTo(selectedPosition)
    const angleToSelected = (360 - ((angle2D(position, selectedPos) + 90) % 360)) % 360
    console.log('angleToSelected:', angleToSelected)
    controls.setLookAt(...from.toArray(), ...selectedPosition.toArray(), true)
    controls.zoomTo(distance / 30, true)
  }, [selectedPosition, controls])

  useEffect(() => {
    // scene.setSelectedAttraction(selectedAttraction)
    const pos = selectedAttraction?.getPosition()?.add(scene.getPosition()) || null
    setSelectedPosition(pos)
  }, [selectedAttraction])

  const resetCamera = () => {
    controls?.reset(true)
    scene.setSceneOpacity(1)
    scene.setSceneWireframe(false)
    setSelectedAttraction(null)
  }

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'R' || event.key === 'r') resetCamera()
        if (event.key === 'Escape' || event.key === 'Esc') setSelectedAttraction(null)
        if (event.key === 'Z' || event.key === 'z') {
          scene.setSceneOpacity(0.1)
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
      <Canvas className="map-canvas" dpr={[1, 2]} camera={camera}>
        {selectedPosition ? (
          <group>
            <SpotLight
              position={[selectedPosition.x, selectedPosition.y + 20, selectedPosition.z]}
              angle={SPOTLIGHT_ANGLE}
              distance={30}
              intensity={1000}
              penumbra={0.5}
            />
            <ambientLight intensity={0.5} />
          </group>
        ) : (
          <directionalLight
            position={[-2, 52, 1.1]}
            intensity={5}
            color="#fff"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        )}
        <SceneModelView
          scene={scene}
          onAttractionClick={(a) =>
            setSelectedAttraction((prev) => (prev !== null && prev === a ? null : a))
          }
        />
        <mesh position={[position.x, 0.3, position.y]}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial color="#f366cd" />
        </mesh>
        {/* <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial color="#e9dae5" />
        </mesh>
        {selectedPosition && (
          <mesh position={selectedPosition}>
            <sphereGeometry args={[5, 32, 32]} />
            <meshStandardMaterial color="#66def3" />
          </mesh>
        )} */}
        {/* {selectedPosition && (
          <Line
            position={[position.x, 0.2, position.y]}
            rotation={[
              0,
              -degToRad(
                90 + angle2D(position, new Vector2(selectedPosition.x, selectedPosition.z)),
              ),
              0,
            ]}
            lineWidth={3}
            points={[
              [0, 0, 0],
              [selectedPosition.length(), 0, 0],
            ]}
            color="#66def3"
          />
        )} */}
        {/* {selectedPosition && (
          <Line
            position={[position.x, 0.2, position.y]}
            rotation={[
              0,
              // degToRad(-32),
              // -degToRad(90 + 11) +
              -degToRad(angle2D(position, new Vector2(selectedPosition.x, selectedPosition.z))),
              0,
            ]}
            lineWidth={3}
            points={[
              [0, 0, 0],
              // [100, 0, 0],
              [selectedPosition.length(), 0, 0],
            ]}
            color="#ff0000"
          />
        )} */}
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
        <SelectedAttractionOrbit controls={controls} active={selectedPosition !== null} />
      </Canvas>
      <CompassView heading={heading} />
      {selectedAttraction && (
        <AttractionOverlay
          selectedAttraction={selectedAttraction}
          onClose={() => setSelectedAttraction(null)}
          onNavigate={async () => {
            controls?.reset(true)
            await new Promise((resolve) => setTimeout(resolve, 900))
            controls?.zoomTo(20, true)
            await new Promise((resolve) => setTimeout(resolve, 100))
            onSelect(selectedAttraction)
          }}
        />
      )}
    </div>
  )
}
