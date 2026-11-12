import { Canvas, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { IconButton } from '../layout/IconButton'
import { ArrowUp, LocateIcon, LocateOffIcon, Settings2, X } from 'lucide-react'
import {
  Color,
  Euler,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Vector2,
  Vector3,
} from 'three'
import {
  DeviceOrientationControls,
  Html,
  Line,
  MapControls,
  OrbitControls,
} from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three-stdlib'
import { GLTFLoader, MapControls as MapControlsImpl } from 'three-stdlib'
import { angle2D, toV3, toXZ } from '../../utils/utils'
import { useOffsetLocation } from './useOffsetLocation'
import { SceneModel, type AttractionModel, type SceneObject } from '../../domain/scene-model'
import { SceneModelView } from '../map/SceneModelView'
import './AppV3.css'
import { MapComposer } from '../map-v2/MapComposer'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'

// const ParkLocation = { latitude: -34.5504044850877, longitude: -58.48008891468104 }
const ParkLocation = { latitude: -34.550539413457, longitude: -58.48003697685765 }
const InitialOffset = new Vector3(0, 600, 0)

export const HomeV3 = () => {
  const scene = useMemo(() => {
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
    const sceneModel = new SceneModel(model.scene.clone())
    const sc = sceneModel.getScene()
    sc.setSceneOpacity(0.2)
    return sc
  }, [])
  const { position, offset, offsetPosition, updateOffset, clearOffset } = useOffsetLocation({
    bussinesLocation: ParkLocation,
  })
  const [calibrateLocation, setCalibrateLocation] = useState(false)
  const [navigate, setNavigate] = useState(false)
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionModel | null>(null)

  const attractionMesh = useMemo(() => {
    if (!selectedAttraction) return null
    console.log('Selected attraction:', selectedAttraction)
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
    attr.position.add(scene.getPosition().add(selectedAttraction.getPosition()))
    return attr
  }, [selectedAttraction])

  if (attractionMesh !== null)
    return (
      <AttractionScreen
        scene={scene}
        attraction={attractionMesh}
        position={offsetPosition}
        onClose={() => setSelectedAttraction(null)}
      />
    )

  if (navigate)
    return (
      <NavigationScreen
        scene={scene}
        position={offsetPosition}
        onSelect={setSelectedAttraction}
        onClose={() => setNavigate(false)}
      />
    )
  if (calibrateLocation)
    return (
      <CalibrateLocation
        scene={scene}
        pos={position}
        offset={toV3(offset)}
        onCalibrate={(offset) => {
          setCalibrateLocation(false)
          updateOffset(offset)
        }}
        onCancel={() => setCalibrateLocation(false)}
        onDelete={() => {
          setCalibrateLocation(false)
          clearOffset()
        }}
      />
    )
  return (
    <>
      <Idle scene={scene} pos={offsetPosition} />
      <IconButton
        position="topRight"
        icon={<Settings2 />}
        onClick={() => setCalibrateLocation(true)}
      />
      <button className="button button-navigate" onClick={() => setNavigate(true)}>
        Navigate
      </button>
    </>
  )
}

export const CalibrateLocation = ({
  scene,
  pos,
  offset,
  onCalibrate,
  onCancel,
  onDelete,
}: {
  scene: SceneObject
  pos: Vector3
  offset: Vector3
  onCalibrate: (offset: Vector2) => void
  onCancel: () => void
  onDelete: () => void
}) => {
  const lineHeight = 1.5
  const camera = useMemo(() => {
    const cam = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000)
    cam.position.set(0, InitialOffset.y, 0)
    // cam.lookAt(0, 0, 0)
    return cam
  }, [])
  const position = useMemo(() => pos.clone().sub(offset), [pos, offset])
  const offsetPosition = useMemo(() => offset.clone().negate(), [offset])
  const [control, setControl] = useState<MapControlsImpl | null>(null)
  const [camPosition, setCamPosition] = useState(camera.position.clone().setY(lineHeight))

  useEffect(() => {
    if (!control) return
    const onChange = () => {
      const p = control?.object?.position
      if (p) setCamPosition(p.clone().setY(lineHeight))
    }
    if (control) control.addEventListener('change', onChange)
    return () => control?.removeEventListener('change', onChange)
  }, [control])

  return (
    <>
      <div className="content">
        <Canvas camera={camera}>
          <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
          <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
          <SceneModelView scene={scene} position={position} />
          <Html position={offsetPosition} zIndexRange={[0]}>
            <div className="html-position">
              <div className="html-position-marker" />
              <div className="html-position-label">
                Position: ({pos.x.toFixed()}, {pos.z.toFixed()})
              </div>
            </div>
          </Html>
          <Line points={[camPosition, offsetPosition]} color="rgba(0, 0, 0, 0.6)" lineWidth={5} />
          <MapControls ref={setControl} enableRotate={false} />
        </Canvas>
        <div className="html-offset-marker" />
        <div className="html-offset-label">
          Offset: ({(offset.x + camPosition.x).toFixed()}, {(offset.z + camPosition.z).toFixed()})
        </div>
      </div>
      <div className="calibrate-button-container">
        <button
          className="button"
          onClick={() => onCalibrate(toXZ(camPosition.clone().add(offset)))}
        >
          Save
        </button>
        <button className="button button-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button-error" onClick={onDelete}>
          Delete
        </button>
      </div>
    </>
  )
}

export const Idle = ({ scene, pos }: { scene: SceneObject; pos: Vector3 }) => {
  const camera = useMemo(() => {
    const cam = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000)
    cam.position.set(0, InitialOffset.y, 0)
    return cam
  }, [])

  return (
    <div className="content">
      <Canvas camera={camera}>
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <SceneModelView scene={scene} position={pos} />
        <OrbitControls enablePan={false} />
        <mesh position={scene.getPosition()}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <mesh position={pos}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="violet" />
        </mesh>
        {/* <Line
          rotation={[0, degToRad(27), 0]}
          points={[
            [0, 0, 0],
            [0, 0, 40],
          ]}
          color="cyan"
          lineWidth={5}
        /> */}
      </Canvas>
      <div className="position-marker" />
    </div>
  )
}

const NavigationScreen = ({
  scene,
  position,
  onSelect,
  onClose,
}: {
  scene: SceneObject
  position: Vector3
  onSelect: (attraction: AttractionModel) => void
  onClose: () => void
}) => {
  return (
    <div className="content">
      <h3>Attractions:</h3>
      {scene.getAttractions().map((attraction) => {
        const attractionPosition = attraction.getPosition().clone()
        const distance = attractionPosition.clone().add(position).length()
        const angleDifference = 90 + angle2D(toXZ(position), toXZ(attractionPosition))
        return (
          <div className="item-attraction" key={attraction.id} onClick={() => onSelect(attraction)}>
            <div>{attraction.getName()}</div>
            <div>{distance.toFixed()} mts.</div>
            {angleDifference.toFixed()}º
            <ArrowUp style={{ transform: `rotate(${angleDifference}deg)` }} />
          </div>
        )
      })}
      <IconButton position="topRight" icon={<X />} onClick={onClose} />
    </div>
  )
}

const AttractionScreen = ({
  scene,
  position,
  attraction,
  onClose,
}: {
  scene: SceneObject
  attraction: Mesh
  position: Vector3
  onClose: () => void
}) => {
  const distance = useMemo(
    () => attraction.position.clone().add(position).length(),
    [attraction, position],
  )
  const angle = useMemo(
    () => 90 + angle2D(toXZ(position), toXZ(attraction.position)),
    [attraction, position],
  )
  const [showManual, setShowManual] = useState(true)
  return (
    <div className="content">
      <div>
        <h3>
          {attraction.name} | {distance.toFixed()} mts. | {angle.toFixed()}º
          <ArrowUp style={{ transform: `rotate(${angle}deg)` }} />
        </h3>
        <IconButton position="topRight" icon={<X />} onClick={onClose} />
        <IconButton
          position="bottomRight"
          icon={showManual ? <LocateOffIcon /> : <LocateIcon />}
          onClick={() => setShowManual(!showManual)}
        />
      </div>
      {showManual ? (
        <ManualAttractionScreen scene={scene} attraction={attraction.clone()} position={position} />
      ) : (
        <AutoAttractionScreen scene={scene} attraction={attraction.clone()} position={position} />
      )}
    </div>
  )
}

export const ManualAttractionScreen = ({
  scene,
  attraction,
  position,
}: {
  scene: SceneObject
  attraction: Mesh
  position: Vector3
}) => {
  const camera = useMemo(
    () =>
      new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000).translateY(1.8),
    [attraction],
  )
  const pos = useMemo(() => attraction.position.clone().add(position), [attraction, position])
  const rotation = new Euler()
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null)

  useEffect(() => {
    if (controls) {
      const onChange = (e: DeviceOrientationEvent) => {
        const { alpha, beta, gamma } = e
        const euler = new Euler(
          degToRad(beta ?? 0),
          degToRad(alpha ?? 0),
          -degToRad(gamma ?? 0),
          'YXZ',
        )

        const quaternion = new Quaternion().setFromEuler(euler)
        quaternion.multiply(new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2))
        console.log(quaternion.toArray().map(radToDeg).join(', '))
        // quaternion.multiply(
        //   new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -screenOrientationRef.current),
        // )
      }
      window.addEventListener('deviceorientation', onChange)
      return () => window.removeEventListener('deviceorientation', onChange)
    }
  }, [controls])

  return (
    <div className="content" style={{ backgroundColor: 'black' }}>
      <Canvas camera={camera}>
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <SceneModelView scene={scene} position={position} />
        <MapComposer />
        <primitive position={pos} object={attraction} />
        <mesh position={attraction.position}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <OrbitControls
          ref={setControls}
          target={[0, 1.8, 0]}
          enablePan={false}
          enableZoom={false}
        />
      </Canvas>
      <div style={{ color: 'white', position: 'absolute', left: 10, bottom: 30 }}>
        Rotation: (
        {rotation
          .toArray()
          .map((v) => (typeof v === 'number' ? radToDeg(v).toFixed(2) : v))
          .join(', ')}
        )
      </div>
    </div>
  )
}

export const AutoAttractionScreen = ({
  scene,
  attraction,
  position,
}: {
  scene: SceneObject
  attraction: Mesh
  position: Vector3
}) => {
  const camera = useMemo(
    () =>
      new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2000).translateY(1.8),
    [attraction],
  )
  const pos = useMemo(() => attraction.position.clone().add(position), [attraction, position])
  const [rotation, setRotation] = useState(new Euler())
  const [controls, setControls] = useState<DeviceOrientationControlsImp | null>(null)

  useEffect(() => {
    if (controls) {
      const onChange = () => setRotation(camera.rotation.clone())
      controls.addEventListener('change', onChange)
      return () => controls.removeEventListener('change', onChange)
    }
  }, [controls])

  return (
    <div className="content" style={{ backgroundColor: 'black' }}>
      <Canvas camera={camera}>
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <SceneModelView scene={scene} position={position} />
        <MapComposer />
        <primitive position={pos} object={attraction} />
        <DeviceOrientationControls ref={setControls} />
      </Canvas>
      <div style={{ color: 'white', position: 'absolute', left: 10, bottom: 30 }}>
        Rotation: (
        {rotation
          .toArray()
          .map((v) => (typeof v === 'number' ? radToDeg(v).toFixed(2) : v))
          .join(', ')}
        )
      </div>
    </div>
  )
}
