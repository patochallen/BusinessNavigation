import { useCallback, useEffect, useRef, useState } from 'react'

const isSupported = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function' &&
  (typeof window === 'undefined' || window.isSecureContext !== false)

// Permissions API for camera is missing in some browsers (e.g. older Safari/Firefox), so this may return null.
const queryCameraPermission = async (): Promise<PermissionStatus | null> => {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return null
  try {
    return await navigator.permissions.query({ name: 'camera' as PermissionName })
  } catch {
    return null
  }
}

const getErrorName = (err: unknown) =>
  err instanceof DOMException || err instanceof Error ? err.name : ''

export const useCamera = () => {
  const [permission, setPermissionState] = useState<PermissionState>('prompt')
  const [error, setError] = useState<string | null>(null)
  // Mirrors `permission` so the callbacks always read the latest value.
  const permissionRef = useRef<PermissionState>(permission)
  const pendingRequestRef = useRef<Promise<PermissionState> | null>(null)

  const setPermission = useCallback((state: PermissionState) => {
    permissionRef.current = state
    setPermissionState(state)
  }, [])

  /** Returns the current camera permission state without prompting the user. */
  const getPermissionState = useCallback(async (): Promise<PermissionState> => {
    if (!isSupported()) {
      setPermission('denied')
      return 'denied'
    }
    if (pendingRequestRef.current) return 'prompt'

    const status = await queryCameraPermission()
    if (!status) return permissionRef.current

    setPermission(status.state)
    return status.state
  }, [setPermission])

  /**
   * Prompts for camera access only if it was not already granted or denied.
   * The opened stream is stopped immediately; this only resolves the permission.
   * On iOS Safari it should be called from a user gesture (tap/click).
   */
  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (pendingRequestRef.current) return pendingRequestRef.current

    const current = await getPermissionState()
    if (current === 'granted' || current === 'denied') {
      return current
    }

    setError(null)
    setPermission('prompt')

    pendingRequestRef.current = navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream): PermissionState => {
        stream.getTracks().forEach((track) => track.stop())
        return 'granted'
      })
      .catch(async (err: unknown): Promise<PermissionState> => {
        const name = getErrorName(err)
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Permission to access the camera was denied.')
          return 'denied'
        }
        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setError('No camera was found on this device.')
          return 'denied'
        }
        // e.g. NotReadableError (camera in use): the permission itself may still be granted.
        setError(err instanceof Error ? err.message : 'Failed to request camera permission.')
        const status = await queryCameraPermission()
        return status ? status.state : 'prompt'
      })
      .then((state) => {
        setPermission(state)
        pendingRequestRef.current = null
        return state
      })

    return pendingRequestRef.current
  }, [getPermissionState, setPermission])

  // Sync the initial state and keep it updated if the user changes it in the browser settings.
  useEffect(() => {
    if (!isSupported()) return

    let status: PermissionStatus | null = null
    let cancelled = false
    const onChange = () => {
      if (status && !pendingRequestRef.current) setPermission(status.state)
    }

    queryCameraPermission().then((result) => {
      if (cancelled || !result) return
      status = result
      onChange()
      status.addEventListener('change', onChange)
    })

    return () => {
      cancelled = true
      status?.removeEventListener('change', onChange)
    }
  }, [setPermission])

  return { permission, error, getPermissionState, requestPermission }
}
