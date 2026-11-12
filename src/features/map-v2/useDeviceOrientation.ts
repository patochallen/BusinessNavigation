import { useEffect, useSyncExternalStore } from 'react'
import { Euler, Quaternion } from 'three'
import { degToRad } from 'three/src/math/MathUtils.js'

export type OrientationPermissionState =
  | 'idle' // permission required (iOS 13+) but not requested yet
  | 'requesting' // requesting permission on iOS 13+
  // | 'not-required' // the platform does not require explicit permission
  | 'granted' // permission granted
  | 'denied' // permission denied
  | 'unsupported' // no DeviceOrientationEvent or insecure context

export type OrientationEventType = 'deviceorientationabsolute' | 'deviceorientation'

interface IOSDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

type PermissionCapableDeviceOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export interface UseDeviceOrientationResult {
  /** Compass heading in degrees [0, 360), clockwise from north. */
  heading: number | null
  quaternion: Quaternion | null
  event: DeviceOrientationEvent | null
  permission: OrientationPermissionState
  /** Whether the heading is referenced to the earth (true north / magnetic north). */
  isAbsolute: boolean
  isListening: boolean
  error: string | null
  /** Returns the current permission state without prompting the user. */
  getPermissionState: () => OrientationPermissionState
  /**
   * Requests permission only if needed (iOS 13+) and not already resolved.
   * Must be called from a user gesture (tap/click) so iOS can show the prompt.
   */
  requestPermission: () => Promise<OrientationPermissionState>
  /** Starts listening. Does not request permission; call requestPermission() first when needed. */
  start: () => void
  stop: () => void
}

const ABSOLUTE_FALLBACK_TIMEOUT_MS = 1000

const normalizeAngle = (deg: number) => ((deg % 360) + 360) % 360

const getScreenAngle = (): number => {
  if (typeof window === 'undefined') return 0
  if (window.screen?.orientation && typeof window.screen.orientation.angle === 'number') {
    return window.screen.orientation.angle
  }
  // Legacy iOS Safari (< 16.4)
  const legacy = (window as unknown as { orientation?: number }).orientation
  return typeof legacy === 'number' ? legacy : 0
}

// W3C DeviceOrientation spec: heading of the device's back (top in portrait), clockwise from north.
// const computeCompassHeading = (alpha: number, beta: number, gamma: number): number => {
//   const x = degToRad(beta)
//   const y = degToRad(gamma)
//   const z = degToRad(alpha)

//   // const cX = Math.cos(x)
//   const cY = Math.cos(y)
//   const cZ = Math.cos(z)
//   const sX = Math.sin(x)
//   const sY = Math.sin(y)
//   const sZ = Math.sin(z)

//   const vx = -cZ * sY - sZ * sX * cY
//   const vy = -sZ * sY + cZ * sX * cY

//   let heading = Math.atan(vx / vy)
//   if (vy < 0) heading += Math.PI
//   else if (vx < 0) heading += 2 * Math.PI

//   return radToDeg(heading)
// }

// W3C DeviceOrientation spec: intrinsic Z-X'-Y'' rotation to quaternion.
const computeQuaternion = (alpha: number, beta: number, gamma: number): Quaternion => {
  const euler = new Euler(degToRad(beta ?? 0), degToRad(alpha ?? 0), -degToRad(gamma ?? 0), 'YXZ')

  const quaternion = new Quaternion().setFromEuler(euler)
  quaternion.multiply(new Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2))
  // quaternion.multiply(
  //   new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -screenOrientationRef.current),
  // )
  // const x = degToRad(beta) / 2
  // const y = degToRad(gamma) / 2
  // const z = degToRad(alpha) / 2

  // const cX = Math.cos(x)
  // const cY = Math.cos(y)
  // const cZ = Math.cos(z)
  // const sX = Math.sin(x)
  // const sY = Math.sin(y)
  // const sZ = Math.sin(z)

  // return new Quaternion(
  //   sX * cY * cZ - cX * sY * sZ,
  //   cX * sY * cZ + sX * cY * sZ,
  //   cX * cY * sZ + sX * sY * cZ,
  //   cX * cY * cZ - sX * sY * sZ,
  // )
  return quaternion
}

const isSupported = () =>
  typeof window !== 'undefined' &&
  typeof window.DeviceOrientationEvent !== 'undefined' &&
  window.isSecureContext !== false

const getRequestPermissionFn = () =>
  (window.DeviceOrientationEvent as PermissionCapableDeviceOrientationEvent).requestPermission

const getInitialPermissionState = (): OrientationPermissionState => {
  if (!isSupported()) return 'unsupported'
  return typeof getRequestPermissionFn() === 'function' ? 'idle' : 'granted'
}

const getUnsupportedMessage = () =>
  typeof window !== 'undefined' && window.isSecureContext === false
    ? 'Device orientation requires a secure context (HTTPS).'
    : 'DeviceOrientationEvent is not supported on this device/browser.'

// ---------------------------------------------------------------------------
// Singleton store: a single set of listeners and state shared by every consumer of the hook.
// ---------------------------------------------------------------------------

interface DeviceOrientationState {
  heading: number | null
  quaternion: Quaternion | null
  event: DeviceOrientationEvent | null
  permission: OrientationPermissionState
  eventType: OrientationEventType | null
  isAbsolute: boolean
  error: string | null
}

const createInitialState = (): DeviceOrientationState => ({
  heading: null,
  quaternion: null,
  event: null,
  permission: getInitialPermissionState(),
  eventType: null,
  isAbsolute: false,
  error: null,
})

let state: DeviceOrientationState | null = null
const subscribers = new Set<() => void>()
let activeType: OrientationEventType | null = null
let fallbackTimer: ReturnType<typeof setTimeout> | null = null
let pendingRequest: Promise<OrientationPermissionState> | null = null

// Lazy so the initial state is computed in the browser, not at import time (SSR/tests).
const getState = (): DeviceOrientationState => (state ??= createInitialState())

const setState = (patch: Partial<DeviceOrientationState>) => {
  state = { ...getState(), ...patch }
  subscribers.forEach((notify) => notify())
}

const clearFallbackTimer = () => {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
  }
}

const detach = () => {
  clearFallbackTimer()
  if (activeType) {
    window.removeEventListener(activeType, handleOrientation)
    activeType = null
  }
  if (getState().eventType !== null) setState({ eventType: null })
}

const attach = (type: OrientationEventType) => {
  detach()
  activeType = type
  window.addEventListener(type, handleOrientation)
  setState({ eventType: type })

  // Some browsers expose the absolute event but never fire it (e.g. desktop without sensors).
  if (type === 'deviceorientationabsolute') {
    fallbackTimer = setTimeout(() => {
      if (activeType === 'deviceorientationabsolute') attach('deviceorientation')
    }, ABSOLUTE_FALLBACK_TIMEOUT_MS)
  }
}

function handleOrientation(rawEvent: Event) {
  const e = rawEvent as IOSDeviceOrientationEvent
  const type = activeType

  if (type === 'deviceorientationabsolute') {
    clearFallbackTimer()
    if (e.absolute && e.alpha == null) {
      attach('deviceorientation')
      return
    }
  }

  const { alpha, beta, gamma, webkitCompassHeading } = e
  const screenAngle = getScreenAngle()
  const hasIOSCompass = typeof webkitCompassHeading === 'number' && webkitCompassHeading >= 0

  if (alpha == null || beta == null || gamma == null) {
    setState(
      hasIOSCompass
        ? {
            event: e,
            heading: normalizeAngle(webkitCompassHeading + screenAngle),
            isAbsolute: true,
          }
        : { event: e },
    )
    return
  }

  if (hasIOSCompass) {
    // iOS alpha is relative to the start position; webkitCompassHeading is referenced to north.
    setState({
      event: e,
      heading: normalizeAngle(webkitCompassHeading + screenAngle),
      quaternion: computeQuaternion(normalizeAngle(360 - webkitCompassHeading), beta, gamma),
      isAbsolute: true,
    })
    return
  }

  setState({
    event: e,
    heading: normalizeAngle(alpha),
    quaternion: computeQuaternion(alpha, beta, gamma),
    isAbsolute: type === 'deviceorientationabsolute' || e.absolute,
  })
}

const getPermissionState = (): OrientationPermissionState => getState().permission

const requestPermission = async (): Promise<OrientationPermissionState> => {
  const current = getState().permission
  if (current === 'unsupported') {
    setState({ error: getUnsupportedMessage() })
    return current
  }
  if (current === 'granted' || current === 'denied') {
    return current
  }
  // Reuse an in-flight request instead of prompting twice.
  if (pendingRequest) return pendingRequest

  const requestPermissionFn = getRequestPermissionFn()
  if (typeof requestPermissionFn !== 'function') {
    setState({ permission: 'granted' })
    return 'granted'
  }

  setState({ error: null, permission: 'requesting' })

  // iOS 13+ Safari requires this to be triggered by a user gesture.
  pendingRequest = requestPermissionFn
    .call(window.DeviceOrientationEvent)
    .then((result): OrientationPermissionState => {
      if (result !== 'granted') {
        setState({ error: 'Permission to access device orientation was denied.' })
      }
      return result === 'granted' ? 'granted' : 'denied'
    })
    .catch((err: unknown): OrientationPermissionState => {
      setState({
        error:
          err instanceof Error ? err.message : 'Failed to request device orientation permission.',
      })
      // Usually thrown when not called from a user gesture; allow retrying.
      return 'idle'
    })
    .then((permission) => {
      pendingRequest = null
      setState({ permission })
      return permission
    })

  return pendingRequest
}

const start = () => {
  const current = getState().permission

  if (current === 'unsupported') {
    setState({ error: getUnsupportedMessage() })
    return
  }
  if (current !== 'granted') {
    setState({
      error:
        current === 'denied'
          ? 'Permission to access device orientation was denied.'
          : 'Device orientation permission is required. Call requestPermission() first.',
    })
    return
  }
  // Already listening: shared by every consumer, so don't restart it.
  if (activeType) return

  setState({ error: null })
  attach(
    'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation',
  )
}

const stop = () => detach()

const subscribe = (notify: () => void) => {
  subscribers.add(notify)
  return () => {
    subscribers.delete(notify)
    // Release the sensor listeners when the last consumer unmounts.
    if (subscribers.size === 0) detach()
  }
}

let serverSnapshot: DeviceOrientationState | null = null
const getServerSnapshot = () => (serverSnapshot ??= createInitialState())

export const useDeviceOrientation = (): UseDeviceOrientationResult => {
  const snapshot = useSyncExternalStore(subscribe, getState, getServerSnapshot)

  useEffect(() => {
    requestPermission()
  }, [])

  return {
    heading: snapshot.heading,
    quaternion: snapshot.quaternion,
    event: snapshot.event,
    permission: snapshot.permission,
    isAbsolute: snapshot.isAbsolute,
    isListening: snapshot.eventType !== null,
    error: snapshot.error,
    getPermissionState,
    requestPermission,
    start,
    stop,
  }
}
