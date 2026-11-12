import type { Mesh } from 'three'
import { Line, Html } from '@react-three/drei'

export const AttractionMarker = ({ attraction, height }: { attraction: Mesh; height: number }) => {
  return (
    <group position={attraction.position}>
      <Line
        points={[
          [0, 0, 0],
          [0, height / 8, 0],
        ]}
        color="#66def3"
        lineWidth={2}
        depthTest={false}
        renderOrder={10}
      />
      <Html position-y={height / 8} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <span className="navigation-attraction-label">{attraction.name}</span>
      </Html>
    </group>
  )
}
