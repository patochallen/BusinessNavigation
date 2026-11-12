import { Euler } from 'three'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export const ManualLookControls = () => {
  const { camera, gl, invalidate } = useThree()

  useEffect(() => {
    const element = gl.domElement
    const previousTouchAction = element.style.touchAction
    element.style.touchAction = 'none'
    const rotation = new Euler(0, 0, 0, 'YXZ')
    let pointer: { id: number; x: number; y: number } | null = null

    const endDrag = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return
      pointer = null
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (pointer || !event.isPrimary || event.button !== 0) return
      rotation.setFromQuaternion(camera.quaternion, 'YXZ')
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      element.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return
      const sensitivity = Math.PI / Math.max(element.clientHeight, 1)
      rotation.y -= (event.clientX - pointer.x) * sensitivity
      rotation.x -= (event.clientY - pointer.y) * sensitivity
      // Avoid flipping the view when looking straight up or down.
      const pitchLimit = Math.PI / 2 - 0.001
      rotation.x = Math.max(-pitchLimit, Math.min(pitchLimit, rotation.x))
      pointer.x = event.clientX
      pointer.y = event.clientY
      camera.quaternion.setFromEuler(rotation)
      invalidate()
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', endDrag)
    element.addEventListener('pointercancel', endDrag)
    element.addEventListener('lostpointercapture', endDrag)
    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', endDrag)
      element.removeEventListener('pointercancel', endDrag)
      element.removeEventListener('lostpointercapture', endDrag)
      if (pointer && element.hasPointerCapture(pointer.id)) {
        element.releasePointerCapture(pointer.id)
      }
      element.style.touchAction = previousTouchAction
    }
  }, [camera, gl, invalidate])

  return null
}
