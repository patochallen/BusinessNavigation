import { Quaternion, Vector3 } from 'three'
import { Canvas, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useEffect, useMemo, useState } from 'react'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useDeviceOrientation } from '../../services/device-orientation'
import { CardinalMarkers } from '../map/NavigationMapView'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'
import { CompassView } from '../map/CompassView'
import { useHeading } from '../../services/heading'

export const OrientationTest = () => {
  // export const OrientationTest = ({ heading }: { heading: number }) => {
  // const { heading, enable: enableHeading } = useDeviceHeading()
  const { heading, start } = useHeading()
  const [head, setHead] = useState<number>(0)
  const { quaternion, deviceOrientation, screenOrientation, enable } = useDeviceOrientation()
  const phone = useMemo(() => {
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}phone.glb`)
    return model.scene.clone().translateY(1)
  }, [])
  const [controls, setControls] = useState<CameraControlsImpl | null>(null)
  // const [forwardVector, setForwardVector] = useState<Vector3>(new Vector3(0, 0, -1))
  const [normalizedHeading, setNormalizedHeading] = useState<number>(0)

  useEffect(() => {
    if (controls) {
      // controls.zoomTo(1)
      controls.rotatePolarTo(-Math.PI / 2)
      controls.saveState()
      // console.log('Controls current:', controls)
    }
  }, [controls])

  useEffect(() => {
    enable()
    start()
    // enableHeading()
  }, [])
  // useEffect(() => {
  //   console.log('Heading effect called:', heading)
  // }, [heading])
  useEffect(() => {
    if (quaternion) {
      const forward = new Vector3(0, 0, -1).applyQuaternion(quaternion)
      // setForwardVector(forward)
      const normalized = (radToDeg(Math.atan2(forward.x, -forward.z)) + 360) % 360
      // controls?.rotateTo(orientation.x, Math.PI / 4 - orientation.y)
      phone.rotation.setFromQuaternion(quaternion)
      // console.log('normalized:', normalized.toFixed(), 'Heading:', heading.toFixed())
      setNormalizedHeading(normalized)
    }
  }, [quaternion])

  useEffect(() => {
    const alpha = deviceOrientation?.alpha ?? null
    const rawHeading = alpha === null ? null : alpha
    if (rawHeading === null) return
    const normalized = (rawHeading + 360) % 360
    const calibrated = (normalized + 360) % 360
    // console.log('Device orientation changed:', calibrated)
    setHead(calibrated)
  }, [deviceOrientation])
  return (
    <div
      style={{
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: 'black',
      }}
      onKeyDown={(e) => {
        if (e.key === 'R' || e.key === 'r') controls?.reset(true)
      }}
      tabIndex={0}
    >
      <Canvas key={phone.uuid} camera={{ fov: 70, near: 0.1, far: 1000 }}>
        <gridHelper args={[6, 30]} />
        <CardinalMarkers distance={3} />
        <directionalLight position={[1, 3, 1]} intensity={10} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={10} color="#fff" />
        {/* {lightRef.current && <directionalLightHelper args={[lightRef.current, 0.1]} />} */}
        {/* <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color="gray" side={DoubleSide} />
        </mesh> */}
        <group rotation-y={degToRad(heading ?? 0)}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.5]} scale={[1, 1, 0.01]}>
            <cylinderGeometry args={[0, 0.1, 3, 32]} />
            <meshStandardMaterial color="red" />
          </mesh>
        </group>
        <group rotation-y={degToRad(normalizedHeading)}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.5]} scale={[1, 1, 0.01]}>
            <cylinderGeometry args={[0, 0.1, 3, 32]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </group>
        <primitive object={phone} />
        {renderOrientationGroup(quaternion ?? new Quaternion())}
        <CameraControls ref={setControls} />
      </Canvas>
      <CompassView heading={normalizedHeading} size={50} />
      <div
        style={{
          color: 'white',
          position: 'absolute',
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: 10,
          margin: 10,
          borderRadius: 5,
        }}
      >
        Orientation: {screenOrientation ?? 'N/A'}
        <br /> Alpha: {deviceOrientation?.alpha?.toFixed(1)}º
        <br /> Head: {head.toFixed(1)}º
        <br /> Heading: {(heading ?? 0).toFixed(1)}º
        <br /> Normalized: {normalizedHeading.toFixed(1)}º
      </div>
    </div>
  )

  function renderOrientationGroup(quaternion: Quaternion, radius = 0.025, height = 0.75) {
    return (
      <group position={[0, 1, 0]} quaternion={quaternion}>
        <mesh rotation-z={-Math.PI / 2} position={[height / 2, 0, 0]}>
          <cylinderGeometry args={[radius, radius, height, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[0, height / 2, 0]}>
          <cylinderGeometry args={[radius, radius, height, 32]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, -height / 2]}>
          <cylinderGeometry args={[radius, radius, height, 32]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </group>
    )
  }
}
