import { Canvas } from '@react-three/fiber'
import { DeviceOrientationControls, Html, Line, PerspectiveCamera } from '@react-three/drei'
import { useState } from 'react'
import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Shape, Vector2, Vector3 } from 'three'
import type { Business, Attraction } from '../../domain/types'
import {
  getAttractionBoundaryMapPoints,
  getMapFeatureMapPoints,
  localPointFromGps,
} from '../../domain/use-cases'
import { BusinessTerrain } from './BusinessTerrain'
import './MapScene.css'
import { ArrowBigUpDash, Crosshair, RefreshCw, Trees, Utensils, Zap } from 'lucide-react'
import { IconButton } from '../layout/IconButton'
import { center } from '../../utils/utils'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'

const CAMERA_FOV = 60
const MIN_CAMERA_HEIGHT = 1.7
const MAP_FEATURE_PATH_RADIUS = 1
const ATTRACTION_MARKER_ELEVATION = 0.5

const categoryIcons = {
  food: <Utensils size={16} />,
  adventure: <Zap size={16} />,
  services: <Crosshair size={16} />,
  nature: <Trees size={16} />,
}

type NavigationMapProps = {
  business: Business
  selectedAttraction: Attraction
  userPosition: GeolocationCoordinates
  heading: number
  routePoints?: { x: number; z: number }[]
}

export function NavigationMap({
  business,
  selectedAttraction,
  userPosition,
  heading,
  routePoints = [],
}: NavigationMapProps) {
  const [cameraHeight, setCameraHeight] = useState(MIN_CAMERA_HEIGHT)
  const position = localPointFromGps(business.mapOrigin, userPosition)
  const attractionPosition = localPointFromGps(
    business.mapOrigin,
    selectedAttraction.origin ?? center(selectedAttraction.boundary),
  )
  const distanceAndHeading = getDistanceAndHeadingBetweenLocations(
    userPosition,
    selectedAttraction.origin ?? center(selectedAttraction.boundary),
  )
  const angleToAttraction = 360 - distanceAndHeading.headingDegrees
  console.log('heading:', heading, 'angle:', angleToAttraction.toFixed(2))

  return (
    <>
      <Canvas className="map-canvas" dpr={[1, 2]}>
        <PerspectiveCamera
          makeDefault
          position={[position.x, cameraHeight, position.z]}
          fov={CAMERA_FOV}
        />
        {/* <ambientLight intensity={1.8} /> */}
        <gridHelper args={[600, 60]} />
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
        <Html position={[attractionPosition.x, ATTRACTION_MARKER_ELEVATION, attractionPosition.z]}>
          <div
            className={`attraction-marker is-selected`}
            style={
              { '--marker-color': selectedAttraction.color, cursor: 'auto' } as React.CSSProperties
            }
            title={selectedAttraction.name}
            aria-label={selectedAttraction.name}
          >
            <span className="attraction-marker-icon" aria-hidden="true">
              {categoryIcons[selectedAttraction.category]}
            </span>
          </div>
        </Html>
        <mesh position={[position.x, ATTRACTION_MARKER_ELEVATION, position.z]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <DeviceOrientationControls />
        {/* <OrbitControls /> */}
      </Canvas>
      <div
        className="centered-circle"
        style={{ transform: `translate(-50%, -50%) rotate(${heading - angleToAttraction}deg)` }}
      >
        <ArrowBigUpDash
          style={{
            color: 'red',
            position: 'relative',
            top: '-30px',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          size={42}
        />
      </div>
      <IconButton
        icon={<RefreshCw />}
        position="topLeft"
        onClick={() => {
          setCameraHeight((prev) => (prev === MIN_CAMERA_HEIGHT ? 600 : MIN_CAMERA_HEIGHT))
          // controlsRef.current?.reset(true)
        }}
      />
    </>
  )
}
