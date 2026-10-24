import { useEffect, useMemo, useRef, useState } from 'react'
import { Quaternion, Vector3 } from 'three'
import { radToDeg } from 'three/src/math/MathUtils.js'

type HeadingStatus = 'idle' | 'starting' | 'running' | 'unsupported' | 'error'

type AbsoluteOrientationSensorLike = EventTarget & {
  quaternion: number[] | null
  start: () => void
  stop: () => void
}

type AbsoluteOrientationSensorConstructor = new (options: {
  frequency: number
  referenceFrame: 'screen'
}) => AbsoluteOrientationSensorLike

type SensorWindow = Window & {
  AbsoluteOrientationSensor?: AbsoluteOrientationSensorConstructor
}

type SensorErrorEvent = Event & {
  error?: DOMException
}

export function useHeading() {
  const [heading, setHeading] = useState<number | null>(null)
  const [status, setStatus] = useState<HeadingStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const sensor = useRef<AbsoluteOrientationSensorLike | null>(null)
  const removeSensorListeners = useRef<(() => void) | null>(null)
  const active = useRef(false)
  const hasReading = useRef(false)
  const hasInitialOrientation = useRef(false)
  const animationFrame = useRef<number | null>(null)
  const lastFrameTime = useRef<number | null>(null)
  const sensorQuaternion = useMemo(() => new Quaternion(), [])
  const targetQuaternion = useMemo(() => new Quaternion(), [])
  const smoothedQuaternion = useMemo(() => new Quaternion(), [])
  const initialQuaternion = useMemo(() => new Quaternion(), [])
  const forward = useMemo(() => new Vector3(), [])

  const start = () => {
    if (active.current || sensor.current) return

    setError(null)
    if (typeof window === 'undefined' || !window.isSecureContext) {
      setStatus('error')
      setError('El sensor requiere HTTPS o localhost.')
      return
    }

    const Sensor = (window as SensorWindow).AbsoluteOrientationSensor
    if (!Sensor) {
      setStatus('unsupported')
      setError('AbsoluteOrientationSensor no está disponible en este navegador.')
      return
    }

    try {
      const orientationSensor = new Sensor({ frequency: 60, referenceFrame: 'screen' })
      sensor.current = orientationSensor
      active.current = true
      hasReading.current = false
      hasInitialOrientation.current = false
      lastFrameTime.current = null
      setStatus('starting')

      const animate = (time: number) => {
        if (!active.current) return

        const deltaSeconds =
          lastFrameTime.current === null
            ? 1 / 60
            : Math.min((time - lastFrameTime.current) / 1000, 0.1)
        lastFrameTime.current = time

        if (hasReading.current) {
          const smoothing = 1 - Math.exp(-14 * deltaSeconds)
          smoothedQuaternion.slerp(targetQuaternion, smoothing)
          forward.set(0, 0, -1).applyQuaternion(smoothedQuaternion)

          const horizontalLength = Math.hypot(forward.x, forward.z)
          if (horizontalLength < 0.08) {
            setHeading(null)
          } else {
            const nextHeading = (radToDeg(Math.atan2(forward.x, -forward.z)) + 360) % 360
            setHeading((previous) =>
              previous === null || Math.abs(nextHeading - previous) > 0.1 ? nextHeading : previous,
            )
          }
        }

        animationFrame.current = requestAnimationFrame(animate)
      }

      const onReading = () => {
        if (!orientationSensor.quaternion) return
        sensorQuaternion.fromArray(orientationSensor.quaternion).normalize()

        if (!hasInitialOrientation.current) {
          initialQuaternion.copy(sensorQuaternion)
          targetQuaternion.identity()
          smoothedQuaternion.identity()
          hasInitialOrientation.current = true
        } else {
          targetQuaternion.copy(initialQuaternion).invert().multiply(sensorQuaternion).normalize()
        }

        hasReading.current = true
        setStatus('running')
        if (animationFrame.current === null) {
          animationFrame.current = requestAnimationFrame(animate)
        }
      }

      const onError = (event: Event) => {
        const sensorError = (event as SensorErrorEvent).error
        active.current = false
        removeSensorListeners.current?.()
        removeSensorListeners.current = null
        sensor.current = null
        if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
        animationFrame.current = null
        setStatus('error')
        setError(
          `${sensorError?.name ?? 'SensorError'}: ${sensorError?.message ?? 'No se pudo leer el sensor.'}`,
        )
      }

      orientationSensor.addEventListener('reading', onReading)
      orientationSensor.addEventListener('error', onError)
      removeSensorListeners.current = () => {
        orientationSensor.removeEventListener('reading', onReading)
        orientationSensor.removeEventListener('error', onError)
        orientationSensor.stop()
      }

      orientationSensor.start()
    } catch (cause) {
      active.current = false
      removeSensorListeners.current?.()
      removeSensorListeners.current = null
      sensor.current = null
      setStatus('error')
      setError(cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause))
    }
  }

  useEffect(() => {
    return () => {
      active.current = false
      removeSensorListeners.current?.()
      removeSensorListeners.current = null
      sensor.current = null
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
      animationFrame.current = null
    }
  }, [])

  return { heading, status, error, start }
}
