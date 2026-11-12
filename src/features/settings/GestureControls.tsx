import { useEffect, useRef } from 'react'
import { Vector2 } from 'three'

export type GestureMode = 'displacement' | 'rotation'

interface GestureControlsProps {
  mode: GestureMode
  onChange: (values: Vector2) => void
}

export const GestureControls = ({ mode, onChange }: GestureControlsProps) => {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let pointer: { id: number; x: number; y: number; scale: number } | null = null
    // Window-wide gestures must not be taken over by native touch scrolling.
    const root = document.documentElement
    const previousTouchAction = root.style.touchAction
    root.style.touchAction = 'none'

    const emit = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return
      const x = -(event.clientX - pointer.x) * pointer.scale
      const y = -(event.clientY - pointer.y) * pointer.scale

      pointer.x = event.clientX
      pointer.y = event.clientY

      onChangeRef.current(new Vector2(x, y))
    }

    const endDrag = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return
      pointer = null
    }

    const onPointerUp = (event: PointerEvent) => {
      emit(event)
      endDrag(event)
    }

    const onBlur = () => {
      console.log('GestureControls lost focus')
      pointer = null
    }

    const onPointerDown = (event: PointerEvent) => {
      if (pointer || !event.isPrimary || event.button !== 0) return
      pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        scale: mode === 'rotation' ? 180 / Math.max(window.innerHeight, 1) : 1,
      }
      onChangeRef.current(new Vector2(0, 0))
    }

    const onPointerMove = (event: PointerEvent) => {
      emit(event)
    }

    console.log('GestureControls mounted')
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', endDrag)
    window.addEventListener('lostpointercapture', endDrag)
    window.addEventListener('blur', onBlur)
    return () => {
      console.log('GestureControls unmounted')
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('lostpointercapture', endDrag)
      window.removeEventListener('blur', onBlur)
      root.style.touchAction = previousTouchAction
    }
  }, [mode])

  return null
}
