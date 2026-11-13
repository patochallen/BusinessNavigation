import { SceneObject } from '../../domain/scene-model'
import { Euler, PerspectiveCamera, Vector3 } from 'three'
import { Canvas } from '@react-three/fiber'
import { useSettings } from '../../data/useSettings'
import { ControlsView, type ControlsConfig } from './ControlsView'
import { useEffect, useMemo, useState } from 'react'
import { toV3 } from '../../utils/utils'
import { SceneModelView } from '../map/SceneModelView'
import { useDeviceOrientation } from '../../services/device-orientation'
import { IconButton } from '../layout/IconButton'
import { PointerIcon, PointerOffIcon } from 'lucide-react'
import { useDeviceMotion } from '../../services/device-motion'

export const FirstPersonView = ({ scene, position }: { scene: SceneObject; position: Vector3 }) => {
  const [, setSettingsVersion] = useState(0)
  const [expandedControl, setExpandedControl] = useState<ControlsConfig | null>(null)
  const [manualOrientation, setManualOrientation] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const euler = useOrientation(manualOrientation)
  const settings = useSettings()
  const offsetPosition = useMemo(
    () => position.clone().sub(toV3(settings.locationOffset)),
    [position, settings.locationOffset],
  )
  const rotation = useMemo(
    () =>
      new Euler(
        settings.cameraRotation.x + (euler?.x ?? 0),
        settings.cameraRotation.y + settings.headingOffset + (euler?.y ?? 0),
        settings.cameraRotation.z + (euler?.z ?? 0),
        euler?.order ?? 'XYZ',
      ),
    [euler, settings.cameraRotation, settings.headingOffset],
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
    scene.setSceneOpacity(settings.opacity)
    return () => scene.setSceneOpacity(1)
  }, [settings.opacity])

  return (
    <div style={{ width: '100%', height: '100%' }}>
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
      />
      {showControls && (
        <IconButton
          position="topLeft"
          icon={manualOrientation ? <PointerIcon /> : <PointerOffIcon />}
          onClick={() => setManualOrientation(!manualOrientation)}
        />
      )}
      {showTop && <div className="position-marker" />}
      {expandedControl?.label === 'Location Offset' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            padding: '10px',
            display: 'flex',
            gap: '5px',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            type="range"
            min={settings.cameraHeight}
            max="1000"
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
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
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
  const { euler } = useDeviceOrientation()
  const motionEuler = useDeviceMotion(manual)
  return manual ? motionEuler : (euler ?? new Euler(0, 0, 0, 'XYZ'))
}
