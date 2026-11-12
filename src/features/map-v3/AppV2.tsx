import { Canvas, useLoader } from '@react-three/fiber'
import { useGeolocation } from '../../services/location'
import { useEffect, useMemo, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { SceneModel, SceneObject, AttractionModel } from '../../domain/scene-model'
import type { Coordinate } from '../../domain/types'
import { IconButton } from '../layout/IconButton'
import { ArrowUp, RefreshCcw, Settings2, X } from 'lucide-react'
import { useDeviceOrientation } from '../../services/device-orientation'
import {
  Color,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Vector2,
} from 'three'
import { SceneModelView } from '../map/SceneModelView'
import { DeviceOrientationControls } from '@react-three/drei'
import { angle2D, toPoint, toV3, toXZ } from '../../utils/utils'
import { AttractionMarker } from '../map-v2/AttractionMarker'
import { MapComposer } from '../map-v2/MapComposer'
import { PathShape } from '../map-v2/PathShape'
import { CardinalMarkers } from '../map/NavigationMapView copy 3'
import { button, Leva, useControls } from 'leva'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'
import { CompassView } from '../map/CompassView'

const ParkLocation = { latitude: -34.550539413457, longitude: -58.48003697685765 }

export const AppV2 = () => {
  const scene = useMemo(() => {
    console.log('Loading scene model')
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
    const sceneModel = new SceneModel(model.scene)
    const sc = sceneModel.getScene()
    sc.setSceneOpacity(0.1)
    return sc
  }, [])
  const { position: location } = useGeolocation()
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  if (!location?.coords || !scene) {
    return <div>Loading...</div>
  }
  return <AppV2Content coords={location.coords} scene={scene} />
}

export const AppV2Content = ({ coords, scene }: { coords: Coordinate; scene: SceneObject }) => {
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionModel | null>(null)
  const [showControls, setShowControls] = useState(false)
  const { heading, quaternion } = useDeviceOrientation(false)
  const [{ fov, offset, pos, fakeLocation }, setControls] = useControls(() => ({
    fov: { value: 60, min: 30, max: 120, step: 1, label: 'FOV' },
    offset: { value: 0, min: -180, max: 180, step: 1, label: 'Offset' },
    pos: { value: [0, 0], step: 1 },
    opacity: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.05,
      label: 'Opacity',
      onChange: (v) => scene.setSceneOpacity(v),
    },
    fakeLocation: { value: false, label: 'Fake Location' },
    reset: button(() =>
      setControls({
        fov: 60,
        offset: 0,
        pos: [0, 0],
        opacity: 0.1,
        // fakeLocation: false,
      }),
    ),
  }))
  const [location, setLocation] = useState<Coordinate>(coords)
  const position = toPoint(location, ParkLocation).add(new Vector2(pos[0], pos[1]))
  // const alpha = headin¿g && offset + heading
  const alpha = offset + (heading ?? 0)

  // useEffect(() => {
  // }, []

  useEffect(() => {
    if (fakeLocation) setLocation(ParkLocation)
    else setLocation(coords)
  }, [coords, fakeLocation])

  return (
    <div
      style={{
        backgroundColor: 'black',
        color: 'white',
        width: '100%',
        height: 'stretch',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          if (showControls) setShowControls(false)
          else setSelectedAttraction(null)
        }
        if (e.key === 'c' || e.key === 'C') setShowControls(!showControls)
      }}
      tabIndex={0}
    >
      <Leva hidden={!showControls} />
      {selectedAttraction && alpha !== null && quaternion !== null ? (
        <MapView
          scene={scene}
          selectedAttraction={selectedAttraction}
          position={position}
          fov={fov}
          heading={alpha}
          offset={offset}
          quaternion={quaternion}
          onBack={() => setSelectedAttraction(null)}
        />
      ) : (
        <AttractionList
          position={position}
          offset={((alpha ?? 0) - offset) % 360}
          attractions={scene.getAttractions()}
          onSelect={setSelectedAttraction}
        />
      )}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          bottom: 0,
          zIndex: 1,
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white',
          padding: '4px',
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <div onClick={() => navigator.clipboard.writeText(location.latitude.toString())}>
          {location.latitude.toFixed(6)}
        </div>
        ,&ensp;
        <div onClick={() => navigator.clipboard.writeText(location.longitude.toString())}>
          {location.longitude.toFixed(6)}
        </div>
      </div>
      <CompassView heading={((heading ?? 0) + offset) % 360} />
      <IconButton
        icon={<Settings2 />}
        position="bottomLeft"
        onClick={() => setShowControls(!showControls)}
      />
    </div>
  )
}

const MapView = ({
  scene,
  selectedAttraction,
  position,
  fov,
  heading,
  offset,
  quaternion,
  onBack,
}: {
  scene: SceneObject
  selectedAttraction: AttractionModel
  position: Vector2
  fov: number
  heading: number
  offset: number
  quaternion: Quaternion
  onBack: () => void
}) => {
  const attraction = useMemo(() => {
    console.log('Ceating selected attraction:', selectedAttraction)
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

  return (
    <div style={{ height: 'stretch' }}>
      <MapScene
        position={position}
        fov={fov}
        scene={scene}
        attraction={attraction}
        heading={heading}
        offset={offset}
        quaternion={quaternion}
      />
      <IconButton icon={<X />} position="topRight" onClick={onBack} />
    </div>
  )
}

const MapScene = ({
  position,
  scene,
  attraction,
  heading,
  quaternion,
  fov,
  offset,
}: {
  position: Vector2
  scene: SceneObject
  attraction: Mesh
  heading: number
  quaternion: Quaternion
  fov: number
  offset: number
}) => {
  const attractionPosition = toXZ(attraction.position)
  const { distance, angle } = useMemo(() => {
    const distance = position.distanceTo(attractionPosition)
    const angle = (angle2D(position, attractionPosition) + 90) % 360
    return { distance, angle }
  }, [position, attractionPosition])
  const camera = useMemo(() => {
    console.log('Creating camera with aspect ratio:', window.innerWidth / window.innerHeight)
    return new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.5, 2000)
  }, [])
  const pathShape = useMemo(
    () => PathShape({ from: position, to: attractionPosition }),
    [position, attractionPosition],
  )
  const angleDifference = useMemo(() => {
    let ang = (angle - heading + offset) % 360
    if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [heading, angle, offset])
  const [useQuaternion, setUseQuaternion] = useState(false)

  useEffect(() => {
    camera.position.set(...toV3(position, 1.6).toArray())
  }, [position, camera])

  useEffect(() => {
    if (!useQuaternion) return
    if (quaternion && camera) {
      camera.quaternion.copy(quaternion.clone())
    }
  }, [quaternion, camera, useQuaternion])

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [fov, camera])

  return (
    <div className="attraction-map-view" style={{ backgroundColor: 'black' }}>
      <Canvas camera={camera}>
        <CardinalMarkers position={toV3(position)} />
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <MapComposer />
        <SceneModelView scene={scene} />
        <primitive object={attraction} />
        <AttractionMarker attraction={attraction} height={distance} />
        {pathShape && (
          <mesh position-y={0.3} rotation-x={Math.PI / 2}>
            <shapeGeometry args={[pathShape]} />
            <meshStandardMaterial side={DoubleSide} color="black" transparent opacity={0.8} />
          </mesh>
        )}
        <mesh position={toV3(position, 0.2)}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
        {!useQuaternion && <DeviceOrientationControls alphaOffset={degToRad(offset)} />}
      </Canvas>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        {attraction ? attraction.name : ''}
        <br />
        {distance.toFixed()} mts
        <br />
        D: {angleDifference.toFixed(1)}º
        <br />
        H: {heading.toFixed(1)}º
        <br />
        O: {offset.toFixed(1)}º
        <br />
        α: {radToDeg(camera.rotation.y).toFixed(1)}º
      </div>
      <IconButton
        icon={useQuaternion ? <X /> : <RefreshCcw />}
        position="topLeft"
        onClick={() => setUseQuaternion(!useQuaternion)}
      />
    </div>
  )
}

const AttractionList = ({
  position,
  offset,
  attractions,
  onSelect,
}: {
  position: Vector2
  offset: number
  attractions: AttractionModel[]
  onSelect: (attraction: AttractionModel) => void
}) => {
  return (
    <div className="camera-map-view2">
      {attractions.map((attraction) => (
        <AttractionItem
          key={attraction.id}
          position={position}
          offset={offset}
          attraction={attraction}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

const AttractionItem = ({
  position,
  offset,
  attraction,
  onSelect,
}: {
  position: Vector2
  offset: number
  attraction: AttractionModel
  onSelect: (attraction: AttractionModel) => void
}) => {
  const attractionPosition = toXZ(attraction.getPosition())
  const angle = angle2D(position, attractionPosition) + 90
  const angleDifference = useMemo(() => {
    let ang = (angle - offset) % 360
    if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [angle, offset])
  return (
    <div
      className="attraction-item"
      key={attraction.id}
      onClick={() => {
        onSelect(attraction)
      }}
    >
      {attraction.getName()} &ensp;
      {position.distanceTo(attractionPosition).toFixed()} mts &ensp;
      {/* Pos({position.x.toFixed()}, {position.y.toFixed()})&ensp; */}
      {angleDifference.toFixed(1)}º &ensp;
      <ArrowUp style={{ transform: `rotate(${angleDifference}deg)` }} />
      {/* {angle2D(position, attractionPosition).toFixed(2)}° */}
    </div>
  )
}
