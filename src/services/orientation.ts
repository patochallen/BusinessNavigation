import { useEffect, useRef, useState } from 'react'
import type { LocationPermission } from '../domain/types'

type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number }
type PermissionCapableOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function useDeviceHeading(enabled = true) {
  const [heading, setHeading] = useState<number | null>(null)
  const [permission, setPermission] = useState<LocationPermission>('idle')
  const [calibrationOffset, setCalibrationOffset] = useState(0)
  const [headingStable, setHeadingStable] = useState(false)
  const rawHeadingRef = useRef<number | null>(null)
  const samplesRef = useRef<number[]>([])
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
    if (!enabled || !supported) return
    const onOrientation = (event: CompassEvent) => {
      const rawHeading =
        event.webkitCompassHeading ?? (event.alpha === null ? null : 360 - event.alpha)
      if (rawHeading !== null) {
        const normalized = (rawHeading + 360) % 360
        rawHeadingRef.current = normalized
        const calibrated = (normalized - calibrationOffset + 360) % 360
        samplesRef.current = [...samplesRef.current.slice(-7), calibrated]
        const spread = Math.max(...samplesRef.current) - Math.min(...samplesRef.current)
        setHeadingStable(samplesRef.current.length >= 3 && spread < 12)
        setHeading(calibrated)
      }
    }
    window.addEventListener('deviceorientation', onOrientation)
    return () => window.removeEventListener('deviceorientation', onOrientation)
  }, [calibrationOffset, enabled, supported])

  const calibrate = () => {
    if (rawHeadingRef.current === null) return
    setCalibrationOffset(rawHeadingRef.current)
    setHeading(0)
  }

  return {
    heading,
    permission: enabled && !supported ? 'unavailable' : permission,
    enable,
    calibrate,
    headingStable,
  }
}
