import type { SceneObject } from '../../../domain/scene-model'
import { useMemo, useState, useEffect } from 'react'
import { PerspectiveCamera } from 'three'
import { Canvas } from '@react-three/fiber'
import type { StoredSnapshot } from '../../../data/storage-repository'
import { SceneModelView } from '../../map/SceneModelView'
import { toV3 } from '../../../utils/utils'
import { IconButton } from '../../layout/IconButton'
import { X } from 'lucide-react'

export const SnapshotView = ({
  scene,
  snapshot,
  onClose,
}: {
  scene: SceneObject
  snapshot: StoredSnapshot
  onClose: () => void
}) => {
  const camera = useMemo(() => {
    const cam = new PerspectiveCamera(
      snapshot.cameraFov,
      window.innerWidth / window.innerHeight,
      0.5,
      2000,
    )
    cam.position.set(0, snapshot.cameraHeight, 0)
    cam.rotation.copy(snapshot.cameraRotation)
    return cam
  }, [snapshot.cameraHeight, snapshot.cameraFov, snapshot.cameraRotation])
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    scene.setSceneOpacity(opacity)
    return () => scene.setSceneOpacity(1)
  }, [opacity])

  return (
    <div className="content">
      <img
        // src={`${import.meta.env.BASE_URL}park-restroom.png`}
        src={URL.createObjectURL(snapshot.image)}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, objectFit: 'cover' }}
      />
      <Canvas camera={camera}>
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <SceneModelView scene={scene} position={toV3(snapshot.position)} />
        <mesh position={scene.getPosition()}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <mesh position={toV3(snapshot.position)}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="violet" />
        </mesh>
      </Canvas>
      <IconButton position="topRight" icon={<X />} onClick={onClose} />
      <label style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#fff' }}>
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
    </div>
  )
}
