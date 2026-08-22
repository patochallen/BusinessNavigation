import { useEffect, useRef, useState } from 'react'
import type { CameraPermission } from '../domain/types'

export function useCameraStream() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permission, setPermission] = useState<CameraPermission>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    setPermission('idle')
  }

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('unavailable')
      return
    }
    setPermission('requesting')
    setErrorMessage(null)
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = nextStream
      setStream(nextStream)
      setPermission('ready')
    } catch (error) {
      setPermission(
        error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'error',
      )
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo acceder a la cámara.')
    }
  }

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    },
    [],
  )

  return { stream, permission, errorMessage, start, stop }
}
