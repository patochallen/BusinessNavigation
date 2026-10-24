import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Coordinate } from '../../domain/types'
import type { AttractionModel } from '../../domain/scene-model'
import './MapView.css'
import {
  DoubleSide,
  Frustum,
  Matrix4,
  PerspectiveCamera,
  Shape,
  Sprite,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  Quaternion,
  Mesh,
  MeshStandardMaterial,
  Color,
} from 'three'
import { useMemo } from 'react'
import { DeviceOrientationControls, Html, Line } from '@react-three/drei'
import { angle2D, toPoint } from '../../utils/utils'
import { SceneModel } from '../../domain/scene-model'
import { SceneModelView } from './SceneModelView'
import { CompassView } from './CompassView'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'
import { ArrowOverlay } from './ArrowOverlay'
import { button, buttonGroup, Leva, useControls } from 'leva'
import { IconButton } from '../layout/IconButton'
import { Settings2 } from 'lucide-react'
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing'
import { useDeviceOrientation } from '../../services/device-orientation'
// import { or } from 'three/tsl'

const CAMERA_FOV = 50
const MAX_CAMERA_HEIGHT = 2000
const CARDINAL_MARKER_DISTANCE = 30
const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }

const CARDINALS = [
  { label: 'N', x: 0, z: -1, color: '#66def3' },
  { label: 'E', x: 1, z: 0, color: '#a3e635' },
  { label: 'S', x: 0, z: 1, color: '#fb923c' },
  { label: 'O', x: -1, z: 0, color: '#f472b6' },
] as const

export function CardinalMarkers({
  position = new Vector3(0, 0, 0),
  distance = CARDINAL_MARKER_DISTANCE,
}: {
  position?: Vector3
  distance?: number
}) {
  return CARDINALS.map(({ label, x, z, color }) => (
    <group
      key={label}
      position={[position.x + x * distance, position.y, position.z + z * distance]}
    >
      <Html position={[0, position.y, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="cardinal-marker-label" style={{ color }}>
          {label}
        </span>
      </Html>
    </group>
  ))
}

function CameraForegroundMarker({
  camera,
  target,
  distance,
}: {
  camera: PerspectiveCamera
  target: Vector3
  distance: number
}) {
  const marker = useRef<Sprite>(null)
  const cameraPosition = useMemo(() => new Vector3(), [])
  const cameraDirection = useMemo(() => new Vector3(), [])
  const targetDirection = useMemo(() => new Vector3(), [])
  const cameraQuaternion = useMemo(() => new Quaternion(), [])
  const arrowTexture = useLoader(TextureLoader, `${import.meta.env.BASE_URL}arrow.png`)
  arrowTexture.colorSpace = SRGBColorSpace

  useFrame(() => {
    camera.updateMatrixWorld()
    camera.getWorldPosition(cameraPosition)
    camera.getWorldDirection(cameraDirection)
    if (!marker.current) return
    marker.current.position
      .copy(cameraPosition.clone().add(new Vector3(0, -3, 0)))
      .addScaledVector(cameraDirection, distance)
    targetDirection.subVectors(target, marker.current.position).normalize()
    camera.getWorldQuaternion(cameraQuaternion)
    targetDirection.applyQuaternion(cameraQuaternion.invert())
    // console.log('child:', marker.current.material)
    marker.current.material.rotation = Math.atan2(targetDirection.x, targetDirection.z) - Math.PI
  })

  return (
    <sprite ref={marker} scale={[distance / 20, distance / 20, distance / 20]} renderOrder={1000}>
      <spriteMaterial
        map={arrowTexture}
        transparent
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
      />
    </sprite>
  )
}

function AttractionVisibility({
  camera,
  target,
  onChange,
}: {
  camera: PerspectiveCamera
  target: Vector3
  onChange: (visible: boolean) => void
}) {
  const frustum = useMemo(() => new Frustum(), [])
  const matrix = useMemo(() => new Matrix4(), [])
  const previous = useRef<boolean | null>(null)

  useFrame(() => {
    camera.updateMatrixWorld()
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(matrix)

    const visible = frustum.containsPoint(target)
    if (visible !== previous.current) {
      previous.current = visible
      onChange(visible)
    }
  })

  return null
}

type NavigationMapViewProps = {
  userPosition: GeolocationCoordinates | Coordinate
  heading?: number | undefined
  selectedAttraction: AttractionModel
  onClose: () => void
}

export function NavigationMapView({
  userPosition,
  heading,
  selectedAttraction,
  onClose,
}: NavigationMapViewProps) {
  const ori = useDeviceOrientation()
  const aspect = window.innerWidth / window.innerHeight
  const [{ fov, showTop, azimuth, polar, height }, setControls] = useControls(() => ({
    fov: { value: CAMERA_FOV, min: 10, max: 120, step: 1, label: 'FOV' },
    azimuth: { value: 0, min: -180, max: 180, step: 1, label: 'Azimuth' },
    polar: { value: 0, min: -180, max: 180, step: 1, label: 'Polar' },
    height: { value: 0, min: -245, max: 1000, step: 1, label: 'Height' },
    showTop: { value: false, label: 'Show Top' },
    move: buttonGroup({
      label: 'Move',
      opts: {
        '⬅️': () => setPosition((prev) => prev.clone().sub(new Vector2(1, 0))),
        '➡️': () => setPosition((prev) => prev.clone().add(new Vector2(1, 0))),
        '⬆️': () => setPosition((prev) => prev.clone().add(new Vector2(0, 1))),
        '⬇️': () => setPosition((prev) => prev.clone().sub(new Vector2(0, 1))),
      },
    }),
    reset: button(() => {
      setPosition(userPos)
      setControls({
        fov: CAMERA_FOV,
        showTop: false,
        azimuth: 0,
        polar: 0,
        height: 0,
      })
    }),
  }))
  const cameraHeight = showTop ? 245 : 2

  const totalHeading = useMemo(
    () => ((heading === undefined ? 0 : heading) + azimuth) % 360,
    [heading, azimuth],
  )
  const userPos = useMemo(() => {
    console.log('Converting user position to point:', userPosition)
    return toPoint(pos, userPosition)
  }, [userPosition])
  const [position, setPosition] = useState(userPos)
  const scene = useMemo(() => {
    console.log('Loading scene model')
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
    const sceneModel = new SceneModel(model.scene)
    const sc = sceneModel.getScene()
    // sc.setSceneWireframe(true)
    // sc.setBuildingWireframe(true)
    sc.setSceneOpacity(0.2)
    return sc
  }, [])

  const target = useMemo(
    () => selectedAttraction.getPosition().add(scene.getPosition()),
    [selectedAttraction, scene],
  )
  const attraction = useMemo(() => {
    const attr = selectedAttraction.getFloor()
    attr.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.geometry = mesh.geometry.clone()
      const material: MeshStandardMaterial = (
        Array.isArray(mesh.material)
          ? mesh.material.map((material) => material.clone())
          : mesh.material.clone()
      ) as MeshStandardMaterial
      material.emissive = new Color('#b8e114')
      material.emissiveIntensity = 1
      mesh.material = material
    })
    console.log('Attraction floor:', attr)
    attr.position.add(scene.getPosition().add(selectedAttraction.getPosition()))
    return attr
  }, [selectedAttraction, scene])
  const attractionPosition = useMemo(() => new Vector2(target.x, target.z), [target])
  const [attractionInView, setAttractionInView] = useState(false)
  const distanceToAttraction = useMemo(
    () => position.distanceTo(attractionPosition),
    [position, attractionPosition],
  )
  const pathShape = useMemo(() => {
    const deltaX = attractionPosition.x - position.x
    const deltaZ = attractionPosition.y - position.y
    const length = Math.hypot(deltaX, deltaZ)
    if (length === 0) return null

    const halfWidth = 0.5
    const perpendicularX = (-deltaZ / length) * halfWidth
    const perpendicularZ = (deltaX / length) * halfWidth
    const shape = new Shape()
    shape.moveTo(perpendicularX, -perpendicularZ)
    shape.lineTo(-perpendicularX, perpendicularZ)
    shape.lineTo(deltaX - perpendicularX, -deltaZ + perpendicularZ)
    shape.lineTo(deltaX + perpendicularX, -deltaZ - perpendicularZ)
    shape.closePath()
    return shape
  }, [position, attractionPosition])
  const angleToAttraction = useMemo(() => {
    let ang = (360 - ((angle2D(position, attractionPosition) + 90) % 360)) % 360
    // if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [position, attractionPosition])
  const angleDifferenceToAttraction = useMemo(() => {
    let ang = (angleToAttraction - totalHeading) % 360
    if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [totalHeading, angleToAttraction])
  const camera: PerspectiveCamera = useMemo(() => {
    console.log('Creating camera')
    const cam = new PerspectiveCamera(CAMERA_FOV, aspect, 0.5, MAX_CAMERA_HEIGHT)
    cam.position.set(0, cameraHeight, 0)
    if (showTop) {
      cam.position.set(attractionPosition.x, cameraHeight, attractionPosition.y)
      cam.rotation.z = degToRad(angleToAttraction)
      cam.rotation.x = -Math.PI / 2
    }
    return cam
  }, [])
  const [showControls, setShowControls] = useState(false)

  const hFov = useMemo(() => {
    const vFOV = degToRad(camera.fov)
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect)
    const hFOVDegrees = radToDeg(hFOV)
    return hFOVDegrees * 0.98
  }, [fov])

  useEffect(() => {
    setControls({
      fov: CAMERA_FOV,
      showTop: false,
      azimuth: 0,
      polar: 0,
      height: 0,
    })
  }, [])

  useEffect(() => {
    camera.position.setY(cameraHeight + height)
  }, [height])

  useEffect(() => {
    ori.enable()
  }, [ori.enable])

  useEffect(() => {
    camera.rotation.x = degToRad(polar)
  }, [polar])

  useEffect(() => {
    const pos = new Vector3(position.x, camera.position.y, position.y)
    camera.position.set(...pos.toArray())
    console.log('Camera position updated to:', pos)
  }, [position])

  useEffect(() => {
    console.log('Attraction in view changed:', attractionInView)
    selectedAttraction.setVisible(attractionInView)
  }, [attractionInView])

  useEffect(() => {
    // console.log('Show top view changed:', heading?.toFixed(), totalHeading.toFixed())
    if (showTop) {
      camera.position.set(position.x, distanceToAttraction * 2, position.y)
      camera.rotation.x = -Math.PI / 2
      camera.rotation.y = degToRad(totalHeading)
    } else {
      camera.position.set(position.x, cameraHeight, position.y)
    }
  }, [totalHeading, showTop])

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [fov])

  useEffect(() => {
    if (!showTop) return
    if (Math.abs(angleDifferenceToAttraction) < hFov / 2) {
      if (!attractionInView) setAttractionInView(true)
    } else {
      if (attractionInView) setAttractionInView(false)
    }
  }, [angleDifferenceToAttraction, showTop])

  return (
    <div
      data-attraction-in-view={attractionInView}
      style={{ overflow: 'hidden', width: '100%', height: '100%', position: 'absolute' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'C' || e.key === 'c') setShowControls((prev) => !prev)
        if (e.key === 'ArrowLeft') setPosition(position.clone().sub(new Vector2(1, 0)))
        if (e.key === 'ArrowRight') setPosition(position.clone().add(new Vector2(1, 0)))
        if (e.key === 'ArrowUp') setPosition(position.clone().add(new Vector2(0, 1)))
        if (e.key === 'ArrowDown') setPosition(position.clone().sub(new Vector2(0, 1)))
      }}
      tabIndex={0}
    >
      <Leva hidden={!showControls} />
      <Canvas className="map-canvas" dpr={[1, 2]} camera={camera}>
        {!showTop && (
          <AttractionVisibility camera={camera} target={target} onChange={setAttractionInView} />
        )}

        <EffectComposer>
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          <Bloom luminanceThreshold={0.6} intensity={1.5} mipmapBlur />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
        <primitive object={attraction} />
        <hemisphereLight intensity={1} />
        <directionalLight
          position={[-2, 52, 1.1]}
          intensity={5}
          color="#fff1d0"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <CameraForegroundMarker camera={camera} target={target} distance={distanceToAttraction} />
        <CardinalMarkers position={new Vector3(position.x, 1.6, position.y)} />
        <SceneModelView scene={scene} />
        <mesh position={[position.x, 0, position.y]}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshStandardMaterial color="#d3f206" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#f21e06" />
        </mesh>
        <mesh position={[attractionPosition.x, 0, attractionPosition.y]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#f366cd" />
        </mesh>
        {attractionInView && (
          <group position={target}>
            <Line
              points={[
                [0, 0, 0],
                [0, distanceToAttraction / 4, 0],
              ]}
              color="#66def3"
              lineWidth={2}
              depthTest={false}
              renderOrder={10}
            />
            <Html
              position={[0, distanceToAttraction / 4, 0]}
              center
              zIndexRange={[10, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <span className="navigation-attraction-label">{selectedAttraction.getName()}</span>
            </Html>
          </group>
        )}
        <group
          name="Path to Attraction"
          position={[position.x, 0.2, position.y]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {pathShape && (
            <mesh>
              <shapeGeometry args={[pathShape]} />
              <meshStandardMaterial
                color="#66def3"
                side={DoubleSide}
                transparent
                opacity={0.35}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
        <group name="Navigation Lines">
          {/* <Line
            position={[position.x, 0.2, position.y]}
            rotation={[0, degToRad((angleToAttraction + 90) % 360), 0]}
            lineWidth={10}
            points={[new Vector3(), new Vector3(distanceToAttraction, 0, 0)]}
            color="#ff0000"
          /> */}
          <Line
            position={[position.x, 0.23, position.y]}
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
        {showTop && (
          <group name="Camera Fov">
            <Line
              position={[position.x, 0.25, position.y]}
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
              position={[position.x, 0.25, position.y]}
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
        )}
        {!showTop && ori.deviceOrientation && (
          <DeviceOrientationControls
            camera={camera}
            deviceOrientation={ori.deviceOrientation}
            // alphaOffset={heading === undefined ? 0 : degToRad(azimuth)}
            // deviceOrientation={
            //   heading === undefined
            //     ? {
            //         absolute: false,
            //         alpha: totalHeading,
            //         beta: polar,
            //         gamma: 0,
            //       }
            //     : undefined
            // }
            // onChange={(e) => {
            //   console.log('Device orientation changed:', e?.target)
            // }}
          />
        )}
      </Canvas>
      <>
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
          {selectedAttraction.getName()}
        </div>
        <IconButton
          icon={<Settings2 />}
          position="topRight"
          onClick={() => setShowControls(!showControls)}
        />
        <CompassView heading={totalHeading} size={50} />
      </>
      <ArrowOverlay
        distance={distanceToAttraction}
        heading={angleDifferenceToAttraction}
        fov={hFov}
      />
    </div>
  )
}
