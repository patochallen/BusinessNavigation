import type { ThreeEvent } from '@react-three/fiber'
import { forwardRef, useState, useImperativeHandle } from 'react'
import type { Vector3 } from 'three'
import { Html, Line } from '@react-three/drei'

export type MapMeasureHandle = {
  clearPoints: () => void
}
export const MapMeasure = forwardRef<MapMeasureHandle>((_props, ref) => {
  const [points, setPoints] = useState<Vector3[]>([])
  const [currentPoint, setCurrentPoint] = useState<ThreeEvent<PointerEvent> | null>(null)
  useImperativeHandle(
    ref,
    () => ({
      clearPoints: () => {
        setPoints([])
        setCurrentPoint(null)
      },
    }),
    [],
  )
  return (
    <group>
      <group
        onContextMenu={(e) => {
          setPoints((prev) => [...prev, e.point])
          setCurrentPoint(null)
          console.log('Canvas context menu event:', e.point)
        }}
        onPointerMove={(e) => {
          if (points.length === 0) return
          setCurrentPoint(e)
          console.log(
            'Canvas pointer move event:',
            e.point.toArray().map((coord) => coord.toFixed(2)),
          )
        }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4000, 4000]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </group>
      {points.length > 0 &&
        [...points].map((point, index) => (
          <mesh key={index} position={point}>
            <sphereGeometry args={[0.5, 32, 32]} />
          </mesh>
        ))}
      {points.length > 0 && (
        <Line
          position={[0, 0.2, 0]}
          lineWidth={3}
          points={[...points, ...(currentPoint ? [currentPoint.point] : [])]}
          color="#2f00ff"
        />
      )}
      {currentPoint && (
        <Html
          style={{
            position: 'absolute',
            left: `${currentPoint.pageX - window.innerWidth / 2 + 10}px`,
            top: `${currentPoint.pageY - window.innerHeight / 2 - 10}px`,
            color: 'black',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
        >
          {points[points.length - 1].clone().sub(currentPoint.point).length().toFixed(2)}m.
        </Html>
      )}
    </group>
  )
})
