import { useState, useEffect, useRef } from 'react'
import { Euler, Vector3 } from 'three'
import { remap } from '../utils/utils'

const GRAVITY_SMOOTHING_MS = 100
const GRAVITY = 9.8

export const useDeviceMotion = (manual: boolean) => {
  const [euler, setEuler] = useState<Euler>(new Euler())
  const smoothedGravityRef = useRef<Vector3 | null>(null)
  const lastMotionTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const { x, y, z } = e.accelerationIncludingGravity ?? {}
      if (
        x == null ||
        y == null ||
        z == null ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(z)
      ) {
        console.warn('Invalid device motion acceleration:', { x, y, z })
        return
      }
      const raw = new Vector3(x, y, z)
      if (raw.lengthSq() < 1e-6) return

      const now = performance.now()
      const lastTime = lastMotionTimeRef.current
      const dt = lastTime == null ? 0 : Math.max(0, now - lastTime)
      lastMotionTimeRef.current = now
      const prev = smoothedGravityRef.current
      const next =
        prev && lastTime != null && dt < GRAVITY_SMOOTHING_MS * 10
          ? prev.clone().lerp(raw, 1 - Math.exp(-dt / GRAVITY_SMOOTHING_MS))
          : raw
      smoothedGravityRef.current = next
      if (next.lengthSq() < 1e-6) return
      // console.log(
      //   'Smoothed gravity:',
      //   next.toArray().map((v) => v.toFixed(2)),
      //   raw.toArray().map((v) => v.toFixed(2)),
      // )
      const alpha = 0
      let beta = remap(next.z, -GRAVITY, GRAVITY, Math.PI / 2, -Math.PI / 2) // - Math.PI / 2
      let gamma = remap(next.x, -GRAVITY, GRAVITY, Math.PI / 2, -Math.PI / 2)

      const newEuler = new Euler(beta, alpha, -gamma, 'YXZ')
      setEuler(newEuler)
    }
    console.log('Device motion handler added')
    window.addEventListener('devicemotion', handleDeviceMotion)
    return () => {
      console.log('Device motion handler removed')
      window.removeEventListener('devicemotion', handleDeviceMotion)
    }
  }, [manual])
  return euler
}
