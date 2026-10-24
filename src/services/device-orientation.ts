import { useEffect, useRef, useState } from 'react'
import { Euler, Quaternion, Vector3 } from 'three'
import { degToRad } from 'three/src/math/MathUtils.js'

type OrientationPermission = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable'
type PermissionCapableDeviceOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export const useDeviceOrientation = (enabled = true) => {
  const [heading, setHeading] = useState<number | null>(null)
  const [quaternion, setQuaternion] = useState<Quaternion | null>(null)
  const [deviceOrientation, setDeviceOrientation] = useState<DeviceOrientationEvent | null>(null)
  const [screenOrientation, setScreenOrientation] = useState(0)
  const [permission, setPermission] = useState<OrientationPermission>('idle')
  const screenOrientationRef = useRef(0)
  // const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
  // const deviceRotation = useMemo(() => new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2), [])

  const enable = async () => {
    if (
      typeof window === 'undefined' ||
      !(typeof window !== 'undefined' && 'DeviceOrientationEvent' in window)
    ) {
      setPermission('unavailable')
      return
    }

    const OrientationEvent =
      window.DeviceOrientationEvent as PermissionCapableDeviceOrientationEvent
    if (typeof OrientationEvent.requestPermission === 'function') {
      setPermission('requesting')
      try {
        const result = await OrientationEvent.requestPermission()
        if (result !== 'granted') {
          setPermission('denied')
          return
        }
      } catch {
        setPermission('denied')
        return
      }
    }

    setPermission('ready')
  }

  useEffect(() => {
    if (permission !== 'ready') return

    const updateScreenOrientation = () => {
      const angle = window.screen.orientation?.angle ?? 0
      screenOrientationRef.current = degToRad(angle)
      setScreenOrientation(angle)
    }

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation(event)
      const rawHeading = event.alpha === null ? null : 360 - event.alpha
      setHeading(rawHeading)
      const euler = new Euler(
        degToRad(event.beta ?? 0),
        degToRad(event.alpha ?? 0),
        -degToRad(event.gamma ?? 0),
        'YXZ',
      )

      const quaternion = new Quaternion().setFromEuler(euler)
      quaternion.multiply(new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2))
      quaternion.multiply(
        new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -screenOrientationRef.current),
      )
      setQuaternion(quaternion)
    }

    updateScreenOrientation()
    window.addEventListener('orientationchange', updateScreenOrientation)
    if (enabled) {
      window.addEventListener('deviceorientationabsolute', onDeviceOrientation)
    } else {
      window.addEventListener('deviceorientation', onDeviceOrientation)
    }
    console.log(
      `Adding device orientation listeners for ${enabled ? 'absolute' : 'relative'} orientation`,
    )

    return () => {
      window.removeEventListener('orientationchange', updateScreenOrientation)
      if (enabled) {
        window.removeEventListener('deviceorientationabsolute', onDeviceOrientation)
      } else {
        window.removeEventListener('deviceorientation', onDeviceOrientation)
      }
      console.log(
        `Cleaning up device orientation listeners for ${enabled ? 'absolute' : 'relative'} orientation`,
      )
    }
  }, [enabled, permission])

  return {
    heading,
    quaternion,
    deviceOrientation,
    screenOrientation,
    permission: permission,
    enable,
  }
}
