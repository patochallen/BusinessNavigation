import { Canvas } from '@react-three/fiber'
import { CameraControls, Html, Line, PerspectiveCamera } from '@react-three/drei'
import { useRef, useState } from 'react'
import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Shape, Vector2, Vector3 } from 'three'
import type { Business, Category } from '../../domain/types'
import {
  getAttractionMapPoint,
  getAttractionBoundaryMapPoints,
  getBusinessBoundaryMapPoints,
  getMapFeatureMapPoints,
} from '../../domain/use-cases'
import { BusinessTerrain } from './BusinessTerrain'
import './MapScene.css'
import { Crosshair, Navigation, RefreshCw, Trees, Utensils, X, Zap } from 'lucide-react'

const CAMERA_FOV = 60
const MIN_CAMERA_HEIGHT = 2
const CONTROLS_SPEED = 0.5
const MAP_FEATURE_PATH_RADIUS = 1
const ATTRACTION_MARKER_ELEVATION = 0.5

const categoryIcons = {
  food: Utensils,
  adventure: Zap,
  services: Crosshair,
  nature: Trees,
} satisfies Record<Category, typeof Utensils>

type MapSceneProps = {
  business: Business
  routePoints?: { x: number; z: number }[]
  userPosition?: { x: number; z: number }
  selectedId?: string
  centerOnSelected?: boolean
  onSelect: (id: string) => void
  userActive: boolean
}

export function MapScene({
  business,
  routePoints = [],
  userPosition,
  selectedId,
  centerOnSelected = false,
  onSelect,
  userActive,
}: MapSceneProps) {
  const [popupAttractionId, setPopupAttractionId] = useState<string | null>(null)
  const boundaryPoints = getBusinessBoundaryMapPoints(business)

  const selectedAttraction =
    business.attractions.find((attraction) => attraction.id === selectedId) ??
    business.attractions[0]
  const selectedPoint = getAttractionMapPoint(business, selectedAttraction)
  const focusPoint = centerOnSelected ? selectedPoint : { x: 0, z: 0 }
  const focusRadius = Math.max(
    ...boundaryPoints.map((point) => Math.hypot(point.x - focusPoint.x, point.z - focusPoint.z)),
  )
  const cameraHeight = centerOnSelected
    ? MIN_CAMERA_HEIGHT
    : Math.max(MIN_CAMERA_HEIGHT, (focusRadius * 1.4) / Math.tan((CAMERA_FOV * Math.PI) / 360))
  const controlsRef = useRef<CameraControls | null>(null)

  return (
    <>
      <Canvas className="map-canvas" dpr={[1, 2]}>
        <PerspectiveCamera
          makeDefault
          position={[focusPoint.x, cameraHeight, focusPoint.z]}
          fov={CAMERA_FOV}
        />
        {/* <ambientLight intensity={1.8} /> */}
        <directionalLight position={[3, 8, 2]} intensity={2.5} color="#fff1d0" />
        <BusinessTerrain business={business} />
        {business.mapFeatures?.map((feature) => {
          const featurePoints = getMapFeatureMapPoints(business, feature)
          if (feature.type === 'path') {
            const curve = new CatmullRomCurve3(
              featurePoints.map((point) => new Vector3(point.x, 0.5, point.z)),
            )
            return (
              <mesh key={feature.id} scale={[1, 0.2, 1]}>
                <tubeGeometry
                  args={[
                    curve,
                    Math.max(8, featurePoints.length * 8),
                    MAP_FEATURE_PATH_RADIUS,
                    8,
                    false,
                  ]}
                />
                <meshStandardMaterial color="#f3f0e7" />
              </mesh>
            )
          }
          if (feature.type === 'building') {
            return (
              <mesh
                key={feature.id}
                position={[feature.position.x, 0.18, feature.position.z]}
                scale={3}
              >
                <boxGeometry args={[feature.size.x, 0.32, feature.size.z]} />
                <meshStandardMaterial color={feature.color} />
              </mesh>
            )
          }
          const minX = Math.min(...featurePoints.map((point) => point.x))
          const maxX = Math.max(...featurePoints.map((point) => point.x))
          const minZ = Math.min(...featurePoints.map((point) => point.z))
          const maxZ = Math.max(...featurePoints.map((point) => point.z))
          return (
            <mesh
              key={feature.id}
              position={[(minX + maxX) / 2, 0.04, (minZ + maxZ) / 2]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[maxX - minX, maxZ - minZ]} />
              <meshBasicMaterial color={feature.color} transparent opacity={0.55} />
            </mesh>
          )
        })}
        {routePoints.length > 1 && (
          <Line
            points={routePoints.map((point) => [point.x, 0.2, point.z])}
            color="#e8b84a"
            lineWidth={5}
          />
        )}
        {business.attractions.map((attraction) => {
          const boundary = getAttractionBoundaryMapPoints(business, attraction)
          if (boundary.length < 3) return null
          const shape = new Shape(boundary.map((point) => new Vector2(point.x, point.z)))
          const geometry = new ExtrudeGeometry(shape, {
            depth: 0.2,
            bevelEnabled: false,
            steps: 1,
          })
          geometry.rotateX(Math.PI / 2)
          geometry.computeVertexNormals()
          return (
            <mesh key={`${attraction.id}-boundary`} position={[0, 0.3, 0]} geometry={geometry}>
              <meshStandardMaterial
                color={attraction.color}
                side={DoubleSide}
                transparent
                opacity={0.5}
              />
            </mesh>
          )
        })}
        {business.attractions.map((attraction) => {
          const point = getAttractionMapPoint(business, attraction)
          const Icon = categoryIcons[attraction.category]
          return (
            <Html
              key={attraction.id}
              position={[point.x, ATTRACTION_MARKER_ELEVATION, point.z]}
              sprite
              zIndexRange={[10, 0]}
            >
              <div className="attraction-marker-anchor">
                {popupAttractionId === attraction.id && (
                  <section className="attraction-popup" aria-label={attraction.name}>
                    <button
                      className="attraction-popup-close"
                      type="button"
                      aria-label="Cerrar información"
                      onClick={() => setPopupAttractionId(null)}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                    <span className="attraction-popup-tag" style={{ color: attraction.color }}>
                      {attraction.tag}
                    </span>
                    <strong>{attraction.name}</strong>
                    <p>{attraction.description}</p>
                    <button
                      className="attraction-popup-navigate"
                      type="button"
                      onClick={() => onSelect(attraction.id)}
                    >
                      <Navigation size={15} aria-hidden="true" />
                      Ir
                    </button>
                  </section>
                )}
                <button
                  className={`attraction-marker ${selectedId === attraction.id ? 'is-selected' : ''}`}
                  style={{ '--marker-color': attraction.color } as React.CSSProperties}
                  type="button"
                  title={attraction.name}
                  aria-label={attraction.name}
                  aria-expanded={popupAttractionId === attraction.id}
                  onClick={() => setPopupAttractionId(attraction.id)}
                >
                  <span className="attraction-marker-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={2.8} />
                  </span>
                </button>
              </div>
            </Html>
          )
        })}
        {userActive && userPosition && (
          <group scale={32} position={[userPosition.x, 0.3 * 32, userPosition.z]}>
            <mesh>
              <coneGeometry args={[0.2, 0.45, 16]} />
              <meshStandardMaterial
                color="#477e78"
                emissive="#477e78"
                emissiveIntensity={0.25}
                transparent
                opacity={0.4}
              />
            </mesh>
            <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.24, 0.32, 24]} />
              <meshBasicMaterial color="#477e78" transparent opacity={0.4} />
            </mesh>
          </group>
        )}
        <CameraControls
          ref={controlsRef}
          minDistance={MIN_CAMERA_HEIGHT}
          maxDistance={cameraHeight * 1.5}
          dollySpeed={CONTROLS_SPEED}
          azimuthRotateSpeed={CONTROLS_SPEED}
          polarRotateSpeed={CONTROLS_SPEED}
          truckSpeed={CONTROLS_SPEED}
        />
      </Canvas>
      <button
        className="north-button"
        style={{ left: 20 }}
        title="Reset Map"
        onClick={() => {
          setPopupAttractionId(null)
          controlsRef.current?.reset(true)
        }}
      >
        <RefreshCw size={17} />
      </button>
    </>
  )
}
