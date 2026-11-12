import { PerspectiveCamera, Vector3 } from 'three'
import type { SceneObject } from '../../domain/scene-model'
import type { StoredSnapshot } from '../../data/storage-repository'
import { useMemo, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { SceneModelView } from '../map/SceneModelView'
import { DeviceOrientationControls } from '@react-three/drei'
import { IconButton } from '../layout/IconButton'
import { PointerIcon, PointerOffIcon, Save, X } from 'lucide-react'
import { toXZ } from '../../utils/utils'
import { ManualLookControls } from './ManualLookControls'
import { CameraView, type CameraViewHandle } from '../camera/CameraView'

export const MapSync = ({
  scene,
  initialPosition,
  initialFov,
  initialHeight,
  initialOpacity,
  onSave,
  onClose,
}: {
  scene: SceneObject
  initialPosition: Vector3
  initialFov: number
  initialHeight: number
  initialOpacity: number
  onSave: (snapshot: StoredSnapshot) => void
  onClose: () => void
}) => {
  const camera = useMemo(() => {
    const cam = new PerspectiveCamera(initialFov, window.innerWidth / window.innerHeight, 0.5, 2000)
    cam.position.set(0, initialHeight, 0)
    return cam
  }, [initialHeight, initialFov])
  const [fov, setFov] = useState(initialFov)
  const [opacity, setOpacity] = useState(initialOpacity)
  const [height, setHeight] = useState(initialHeight)
  const [offsetPosition, setOffsetPosition] = useState(new Vector3())
  // const [position, setPosition] = useState(new Vector3())
  const position = useMemo(
    () => initialPosition.clone().add(offsetPosition),
    [initialPosition, offsetPosition],
  )
  const [isManual, setIsManual] = useState(false)
  const cameraViewRef = useRef<CameraViewHandle>(null)
  const [, setCaptureError] = useState<string | null>(null)

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [fov])

  useEffect(() => {
    camera.position.y = height
  }, [height])

  useEffect(() => {
    if (isManual) {
      camera.rotation.set(0, 0, 0)
    }
  }, [isManual])

  useEffect(() => {
    scene.setSceneOpacity(opacity)
    return () => scene.setSceneOpacity(initialOpacity)
  }, [opacity])

  useEffect(() => {
    console.log('Position changed:', initialPosition)
  }, [initialPosition])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="camera-map-view">
      {/* <img
        src={`${import.meta.env.BASE_URL}park-restroom.png`}
        // src={URL.createObjectURL(snapshot.image)}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, objectFit: 'cover' }}
      /> */}
      <div className="attraction-map-view" style={{ zIndex: 1 }}>
        <Canvas camera={camera}>
          <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
          <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
          <SceneModelView scene={scene} position={position} />
          <mesh position={scene.getPosition()}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="green" />
          </mesh>
          <mesh position={position}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="violet" />
          </mesh>
          {!isManual && <DeviceOrientationControls />}
          {isManual && <ManualLookControls />}
        </Canvas>
        <div className="position-marker" />
        <IconButton
          position="bottomRight"
          icon={<Save />}
          onClick={async () => {
            setCaptureError(null)

            try {
              if (!cameraViewRef.current) {
                throw new Error('La cámara no está disponible.')
              }

              const image = await cameraViewRef.current.capture()

              onSave({
                position: toXZ(position),
                cameraFov: fov,
                cameraHeight: height,
                cameraRotation: camera.rotation.clone(),
                image,
              })
            } catch (error) {
              setCaptureError(
                error instanceof Error ? error.message : 'No se pudo guardar la captura.',
              )
            }
          }}
          // onClick={() => {
          //   onSave({
          //     position: toXZ(position),
          //     cameraFov: fov,
          //     cameraHeight: height,
          //     cameraRotation: camera.rotation,
          //   })
          // }}
        />
        <IconButton position="topRight" icon={<X />} onClick={onClose} />
        <IconButton
          position="topLeft"
          icon={isManual ? <PointerIcon /> : <PointerOffIcon />}
          onClick={() => setIsManual(!isManual)}
        />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 10 }}>
          <label>
            <input
              type="range"
              value={fov}
              onChange={(e) => setFov(parseFloat(e.target.value))}
              min="20"
              max="120"
            />
            &nbsp; FOV: {fov}
          </label>
          <br />
          <label>
            <input
              type="range"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              min="0"
              max="1"
              step="0.01"
            />
            &nbsp; Opacity: {opacity}
          </label>
          <br />
          <label>
            <input
              type="range"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value))}
              min="1"
              max="600"
              step="0.1"
            />
            &nbsp; Height: {height}
          </label>
          <br />
          <label>
            <input
              type="range"
              value={offsetPosition.x}
              onChange={(e) =>
                setOffsetPosition(
                  new Vector3(parseFloat(e.target.value), offsetPosition.y, offsetPosition.z),
                )
              }
              min="-300"
              max="300"
              step="0.1"
            />
            &nbsp; Position X: {offsetPosition.x.toFixed(2)}
          </label>
          <br />
          <label>
            <input
              type="range"
              value={offsetPosition.z}
              onChange={(e) =>
                setOffsetPosition(
                  new Vector3(offsetPosition.x, offsetPosition.y, parseFloat(e.target.value)),
                )
              }
              min="-300"
              max="300"
              step="0.1"
            />
            &nbsp; Position Z: {offsetPosition.z.toFixed(2)}
          </label>
        </div>
      </div>
      <CameraView ref={cameraViewRef} />
    </div>
  )
}
