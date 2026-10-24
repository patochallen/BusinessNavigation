import { useEffect, useRef, useState } from 'react'
import type { LocationPermission } from '../domain/types'
import { circularAngleSpread } from '../domain/use-cases'

type PermissionCapableOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export const useMagneticNorth = false

export function useDeviceHeading(enabled = true) {
  const [normalized, setHeading] = useState<number | null>(null)
  const [orientation, setOrientation] = useState<DeviceOrientationEvent | null>(null)
  const [permission, setPermission] = useState<LocationPermission>('idle')
  const calibrationOffset = 0
  // const [calibrationOffset, setCalibrationOffset] = useState(0)
  const [headingStable, setHeadingStable] = useState(false)
  const rawHeadingRef = useRef<number | null>(null)
  const samplesRef = useRef<number[]>([])
  const hasOrientation = useRef<boolean>(false)
  const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window

  const enable = async () => {
    if (!enabled || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setPermission('unavailable')
      return
    }
    const orientation = DeviceOrientationEvent as PermissionCapableOrientation
    if (orientation.requestPermission) {
      setPermission('requesting')
      const result = await orientation.requestPermission()
      if (result !== 'granted') {
        setPermission('denied')
        return
      }
    }
    setPermission('ready')
  }

  useEffect(() => {
    if (!enabled || !supported || permission !== 'ready') return
    // console.log('Device orientation enabled isMobile:', isMobile, navigator.userAgent)
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (!hasOrientation.current && event.absolute && event.alpha !== null) {
        hasOrientation.current = true
      }
      if (hasOrientation.current && !event.absolute) return
      if (!event.absolute) {
        setOrientation(event)
      }
      // const euler = new Euler(
      //   degToRad(event.beta!),
      //   degToRad(event.alpha!),
      //   -degToRad(event.gamma!),
      //   'YXZ',
      // )
      // const orientation = new Quaternion().setFromEuler(euler)
      // orientation.multiply(new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2))
      // orientation.multiply(
      //   new Quaternion().setFromAxisAngle(
      //     new Vector3(0, 0, 1),
      //     -degToRad(screen.orientation?.angle ?? 0),
      //   ),
      // )

      // const forward = new Vector3(0, 0, -1).applyQuaternion(orientation)
      // const normalized = (radToDeg(Math.atan2(forward.x, -forward.z)) + 360) % 360
      // rawHeadingRef.current = normalized
      // const calibrated = (normalized - calibrationOffset + 360 - (useMagneticNorth ? 0 : 11)) % 360
      // samplesRef.current = [...samplesRef.current.slice(-7), calibrated]
      // const spread = circularAngleSpread(samplesRef.current)
      // setHeadingStable(samplesRef.current.length >= 3 && spread < 12)
      // setHeading(calibrated)
      const rawHeading =
        event.alpha === null ? null : 360 - event.alpha - (useMagneticNorth ? 0 : 10.44)
      if (rawHeading === null) {
        setHeading(null)
        setHeadingStable(false)
        return
      }
      const normalized = (rawHeading + 360) % 360
      rawHeadingRef.current = normalized
      const calibrated = (normalized - calibrationOffset + 360) % 360
      samplesRef.current = [...samplesRef.current.slice(-7), calibrated]
      const spread = circularAngleSpread(samplesRef.current)
      setHeadingStable(samplesRef.current.length >= 3 && spread < 12)
      setHeading(calibrated)
    }
    window.addEventListener('deviceorientationabsolute', onOrientation)
    // window.addEventListener('deviceorientation', onOrientation)
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation)
      // window.removeEventListener('deviceorientation', onOrientation)
    }
  }, [calibrationOffset, enabled, permission, supported])

  const calibrate = () => {
    if (rawHeadingRef.current === null) return
    // setCalibrationOffset(rawHeadingRef.current)
    setHeading(0)
    samplesRef.current = []
    setHeadingStable(false)
  }

  return {
    heading: normalized,
    orientation,
    permission: enabled && !supported ? 'unavailable' : permission,
    enable,
    calibrate,
    headingStable,
  }
}
