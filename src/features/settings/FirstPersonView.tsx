import { SceneObject } from '../../domain/scene-model'
import { Euler, PerspectiveCamera, Vector3 } from 'three'
import { Canvas } from '@react-three/fiber'
import { useSettings } from '../../data/useSettings'
import type { Coordinate } from '../../domain/types'
import { ControlsView, type ControlsConfig } from './ControlsView'
import { useEffect, useMemo, useState } from 'react'
import { toV3 } from '../../utils/utils'
import { SceneModelView } from '../map/SceneModelView'
import { useDeviceOrientation } from '../../services/device-orientation'
import { useDeviceMotion } from '../../services/device-motion'
import './FirstPersonView.css'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'
import { degToRad } from 'three/src/math/MathUtils.js'

export const FirstPersonView = ({
  scene,
  location,
  destination,
}: {
  scene: SceneObject
  location: GeolocationCoordinates | undefined
  destination: Coordinate
}) => {
  const [, setSettingsVersion] = useState(0)
  const [expandedControl, setExpandedControl] = useState<ControlsConfig | null>(null)
  const [showControls, setShowControls] = useState(false)
  const settings = useSettings()
  const [loc, setLoc] = useState<GeolocationCoordinates | undefined>(undefined)
  const position = useMemo(() => {
    if (!loc) return new Vector3(0, 0, 0)
    const { distanceMeters, headingDegrees } = getDistanceAndHeadingBetweenLocations(
      loc,
      destination,
    )
    const p = new Vector3(
      distanceMeters * Math.sin(degToRad(headingDegrees)),
      0,
      -distanceMeters * Math.cos(degToRad(headingDegrees)),
    )
    return p
  }, [loc])
  const offsetPosition = useMemo(
    () => position.clone().sub(toV3(settings.locationOffset)),
    [position, settings.locationOffset],
  )
  const euler = useOrientation(settings.manualOrientation)
  const rotation = useMemo(
    () =>
      new Euler(
        euler?.x ?? 0,
        settings.headingOffset + (euler?.y ?? 0),
        euler?.z ?? 0,
        euler?.order ?? 'XYZ',
      ),
    [euler, settings.headingOffset],
  )
  const [height, setHeight] = useState(150)
  const showTop = useMemo(
    () =>
      expandedControl?.label === 'Location Offset' &&
      height.toFixed(2) !== settings.cameraHeight.toFixed(2),
    [expandedControl, height, settings.cameraHeight],
  )
  const totalHeight = useMemo(() => {
    if (showTop) return height
    return settings.cameraHeight
  }, [height, settings.cameraHeight, showTop])

  useEffect(() => {
    if (!location) return
    if (!settings.locationEnabled && loc !== undefined) return
    setLoc(location)
  }, [location, settings.locationEnabled])

  useEffect(() => {
    scene.setSceneOpacity(settings.opacity)
    return () => scene.setSceneOpacity(1)
  }, [settings.opacity])

  const scale = useMemo(() => Math.max(0.5, height / 100), [height])

  return (
    <div className="first-person-view">
      <FirstPersonViewContent
        scene={scene}
        pos={offsetPosition}
        fov={settings.cameraFov}
        height={totalHeight}
        rotation={!showTop ? rotation : new Euler(-Math.PI / 2, 0, 0)}
      />
      <ControlsView
        settings={settings}
        expandedControl={expandedControl}
        setExpandedControl={setExpandedControl}
        showControls={showControls}
        setShowControls={setShowControls}
        onSettingsChange={() => setSettingsVersion((v) => v + 1)}
        scale={scale}
      />
      {showTop && <div className="position-marker" />}
      {expandedControl?.label === 'Location Offset' && (
        <div className="camera-height-control" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="range"
            min={settings.cameraHeight}
            max={1000}
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value))}
          />
          {height.toFixed(1)} m
        </div>
      )}
    </div>
  )
}

export const FirstPersonViewContent = ({
  scene,
  pos,
  fov,
  height,
  rotation,
}: {
  scene: SceneObject
  pos: Vector3
  fov: number
  height: number
  rotation: Euler
}) => {
  const camera = useMemo(() => {
    const cam = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.5, 2000)
    cam.position.set(0, height, 0)
    cam.rotation.copy(rotation)
    return cam
  }, [fov, height, rotation])

  return (
    <div className="first-person-view-content">
      <Canvas camera={camera}>
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <SceneModelView scene={scene} position={pos} />
        <mesh position={scene.getPosition()}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <mesh position={pos}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="violet" />
        </mesh>
      </Canvas>
    </div>
  )
}

const useOrientation = (manual: boolean): Euler => {
  const motionEuler = useDeviceMotion()
  const { euler: orientationEuler } = useDeviceOrientation()
  const fallbackEuler = useMemo(() => new Euler(0, 0, 0, 'XYZ'), [])

  return manual ? motionEuler : (orientationEuler ?? fallbackEuler)
}
