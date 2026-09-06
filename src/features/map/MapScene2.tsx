import { Canvas } from '@react-three/fiber'
import { CameraControls, Html, PerspectiveCamera } from '@react-three/drei'
import { useRef, useState } from 'react'
import { CatmullRomCurve3, DoubleSide, Shape, ShapeGeometry, Vector2, Vector3 } from 'three'
import type { Attraction, Business, Category } from '../../domain/types'
import {
  getAttractionMapPoint,
  getAttractionBoundaryMapPoints,
  getMapFeatureMapPoints,
  getBusinessBoundaryMapPoints,
  localPointFromGps,
} from '../../domain/use-cases'
import { BusinessTerrain } from './BusinessTerrain'
import './MapScene.css'
import { Crosshair, Navigation, RefreshCwOff, Trees, Utensils, X, Zap } from 'lucide-react'
import { IconButton } from '../layout/IconButton'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'
import { Earth, SphericalUtil } from '../../utils/utils'
import { CompassView } from './CompassView'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'
import * as THREE from 'three'

const CAMERA_FOV = 60
const MIN_CAMERA_HEIGHT = 3
// const CONTROLS_SPEED = 0.5
const MAP_FEATURE_PATH_RADIUS = 1
const ATTRACTION_MARKER_ELEVATION = 0.5

const categoryIcons = {
  food: Utensils,
  adventure: Zap,
  services: Crosshair,
  nature: Trees,
} satisfies Record<Category, typeof Utensils>

type MapScene2Props = {
  business: Business
  userPosition: GeolocationCoordinates
  heading: number
  onSelect: (id: string) => void
}

// type PosRot = {
//   position: Vector3
//   rotation: Vector3
// }

export function MapScene2({ business, userPosition, heading, onSelect }: MapScene2Props) {
  const [popupAttraction, setPopupAttraction] = useState<Attraction | null>(null)
  const boundaryPoints = getBusinessBoundaryMapPoints(business)
  const headingNorth = SphericalUtil.computeHeading(userPosition, Earth.NORTH) * 0
  const position = localPointFromGps(business.mapOrigin, userPosition)
  // const [posRot, setPosRot] = useState<PosRot>({
  //   position: new Vector3(),
  //   rotation: new Vector3(),
  // })
  const headingToBusiness = SphericalUtil.computeHeading(userPosition, business.mapOrigin)
  const distanceToBusiness = SphericalUtil.computeDistanceBetween(userPosition, business.mapOrigin)
  // const degreesToNorth = radToDeg(posRot.rotation.z)
  // const [degreesToNorth, setDegreesToNorth] = useState(headingNorth)

  // const selectedAttraction = business.attractions.find((attraction) => attraction.id === selectedId)
  // const selectedPoint = selectedAttraction && getAttractionMapPoint(business, selectedAttraction)
  const focusPoint = { x: 0, z: 0 }
  const focusRadius = Math.max(
    ...boundaryPoints.map((point) => Math.hypot(point.x - focusPoint.x, point.z - focusPoint.z)),
  )
  const cameraHeight = Math.max(
    MIN_CAMERA_HEIGHT,
    (focusRadius * 1.4) / Math.tan((CAMERA_FOV * Math.PI) / 360),
  )
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  // const cameraPos = useMemo(
  //   () => new Vector3(position.x, cameraHeight, position.z),
  //   [position, cameraHeight],
  // )
  const controlsRef = useRef<CameraControls | null>(null)
  console.log('distanceToBusiness:', distanceToBusiness, cameraHeight)

  // useEffect(() => {
  //   // console.log('Camera position check', controlsRef.current)
  //   if (controlsRef.current) {
  //     controlsRef.current?.setLookAt(
  //       cameraPos.x,
  //       cameraPos.y,
  //       cameraPos.z,
  //       0,
  //       -cameraPos.y * 0.7,
  //       0,
  //       true,
  //     )
  //     // controlsRef.current.saveState()
  //     // controlsRef.current?.setTarget(0, -120, 0, true)
  //     // console.log('Camera position:', controlsRef.current.getPosition(new Vector3()))
  //   }
  // }, [controlsRef.current])

  return (
    <>
      <Canvas
        className="map-canvas"
        dpr={[1, 2]}
        onKeyDown={(event) => {
          if (event.key === 'R' || event.key === 'r') {
            controlsRef.current?.reset(true)
          } else if (event.key === 'Escape') {
            setPopupAttraction(null)
          } else if (event.key === 'F' || event.key === 'f') {
            controlsRef.current?.rotateAzimuthTo(degToRad(-headingToBusiness), true)
          }
        }}
        tabIndex={0}
      >
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[0, cameraHeight, 0]}
          rotation={[-Math.PI / 2, 0, degToRad(-headingToBusiness), 'XYZ']}
          fov={CAMERA_FOV}
          near={0.5}
        />
        <ambientLight intensity={1.8} />
        <directionalLight position={[3, 8, 2]} intensity={2.5} color="#fff1d0" />
        <group rotation={[0, degToRad(headingNorth), 0]}>
          <BusinessTerrain business={business} />
          <mesh position={[position.x, 0, position.z]}>
            <sphereGeometry args={[4, 32, 32]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[4, 32, 32]} />
            <meshStandardMaterial color="#94f405" />
          </mesh>
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
          {/* {routePoints.length > 1 && (
            <Line
              points={routePoints.map((point) => [point.x, 0.2, point.z])}
              color="#e8b84a"
              lineWidth={5}
            />
          )} */}
          {business.attractions.map((attraction) => {
            const boundary = getAttractionBoundaryMapPoints(business, attraction)
            if (boundary.length < 3) return null
            const shape = new Shape(boundary.map((point) => new Vector2(point.x, point.z)))
            const geometry = new ShapeGeometry(shape)
            geometry.rotateX(Math.PI / 2)
            geometry.computeVertexNormals()
            return (
              <mesh
                receiveShadow
                key={`${attraction.id}-boundary`}
                position={[0, (attraction.elevationOrder ?? 0) * 0.3, 0]}
                geometry={geometry}
              >
                <meshStandardMaterial
                  color={attraction.color}
                  side={DoubleSide}
                  transparent
                  opacity={attraction.opacity ?? 1}
                  // wireframe
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
                  <button
                    className={`attraction-marker ${popupAttraction?.id === attraction.id ? 'is-selected' : ''}`}
                    style={{ '--marker-color': attraction.color } as React.CSSProperties}
                    type="button"
                    title={attraction.name}
                    aria-label={attraction.name}
                    aria-expanded={popupAttraction?.id === attraction.id}
                    onClick={() => setPopupAttraction(attraction)}
                  >
                    <span className="attraction-marker-icon" aria-hidden="true">
                      <Icon size={16} strokeWidth={2.8} />
                    </span>
                  </button>
                </div>
              </Html>
            )
          })}
        </group>
        {/* {userActive && (
          <group position={[0, 0.3, 0]}>
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
        )} */}
        {/* <DeviceOrientationControls
          ref={controlsRef}
          onChange={(e: any) => {
            if (!e.target?.object?.rotation) return
            console.log(
              'Device orientation changed',
              e.target.object.rotation
                .toArray()
                .filter((v: any) => typeof v === 'number')
                .map((v: number) => radToDeg(v).toFixed(2)),
            )
            // if (e.target?.object?.rotation) {
            //   setPosRot({
            //     position: posRot.position,
            //     rotation: new Vector3().setFromEuler(e.target.object.rotation),
            //   })
            // }
          }}
        /> */}
        {/* <CameraControls
          ref={controlsRef}
          // enabled={false}
          minDistance={MIN_CAMERA_HEIGHT}
          // maxDistance={cameraHeight * 1.5}
          dollySpeed={CONTROLS_SPEED}
          azimuthRotateSpeed={CONTROLS_SPEED}
          polarRotateSpeed={CONTROLS_SPEED}
          truckSpeed={CONTROLS_SPEED}
          azimuthAngle={degToRad(-headingToBusiness)}
          // polarAngle={degToRad(55)}
          maxPolarAngle={Math.PI / 2}
          onUpdate={() => {
            if (controlsRef.current) {
              const camera = controlsRef.current.camera
              setPosRot({
                position: camera.position.clone(),
                rotation: new Vector3().setFromEuler(camera.rotation),
              })
            }
          }}
        /> */}
      </Canvas>
      {popupAttraction && (
        <div
          className="attraction-popup-container"
          onClick={() => {
            // cameraRef.current?.lookAt(new Vector3(0, 0, 0))
            // cameraRef.current?.position.setY(cameraHeight)
            setPopupAttraction(null)
          }}
        >
          <section
            className="attraction-popup"
            aria-label={popupAttraction.name}
            onClick={(e) => {
              if (!cameraRef.current) return
              const pos = getAttractionMapPoint(business, popupAttraction)
              cameraRef.current.lookAt(new Vector3(pos.x, 0, pos.z))
              cameraRef.current.zoom = 6
              cameraRef.current.updateProjectionMatrix()
              console.log('Attraction map point:', cameraRef.current)
              e.stopPropagation()
            }}
          >
            <button
              className="attraction-popup-close"
              type="button"
              aria-label="Cerrar información"
              onClick={() => setPopupAttraction(null)}
            >
              <X size={14} aria-hidden="true" />
            </button>
            <span className="attraction-popup-tag" style={{ color: popupAttraction.color }}>
              {popupAttraction.tag}
            </span>
            <strong>{popupAttraction.name}</strong>
            <p>{popupAttraction.description}</p>
            <button
              className="attraction-popup-navigate"
              type="button"
              onClick={() => onSelect(popupAttraction.id)}
            >
              <Navigation size={15} aria-hidden="true" />
              Ir
            </button>
          </section>
        </div>
      )}
      <IconButton
        icon={<RefreshCwOff />}
        position="topLeft"
        onClick={() => {
          // setPopupAttractionId(null)
          if (!cameraRef.current) return
          // controlsRef.current?.reset(true)
          cameraRef.current.zoom = 1
          cameraRef.current.lookAt(new Vector3(0, 0, 0))
          cameraRef.current.updateProjectionMatrix()
        }}
      />
      <IconButton
        icon={<RefreshCwOff />}
        position="topRight"
        onClick={() => {
          // controlsRef.current?.rotateAzimuthTo(degToRad(-headingToBusiness), true)
          // controlsRef.current?.setLookAt(
          //   controlsRef.current?.camera?.position.x,
          //   controlsRef.current?.camera?.position.y,
          //   controlsRef.current?.camera?.position.z,
          //   0,
          //   -cameraHeight * 0.7,
          //   0,
          //   true,
          // )
          // controlsRef.current?.setTarget(...[0, -cameraHeight * 0.7, 0], true)
        }}
      />
      <CompassView heading={heading} />
      {/* <div className="map-position-info">
        Pos x: {posRot.position.x.toFixed(2)}, y: {posRot.position.y.toFixed(2)}, z:{' '}
        {posRot.position.z.toFixed(2)}
        <br />
        Rot x: {radToDeg(posRot.rotation.x).toFixed(2)}, y: {radToDeg(posRot.rotation.y).toFixed(2)}
        , z: {radToDeg(posRot.rotation.z).toFixed(2)}
      </div> */}
      <IconButton
        icon={<RefreshCwOff />}
        position="bottomLeft"
        onClick={() => {
          console.log(
            'Button clicked',
            controlsRef.current?.camera?.rotation
              .toArray()
              .filter((v: any) => typeof v === 'number')
              .map((v: number) => radToDeg(v).toFixed(2)),
            'target',
            controlsRef.current?.getTarget(new Vector3()),
          )
          // const headingNorth = SphericalUtil.computeHeading(userPosition, Earth.NORTH)
          // const heading = SphericalUtil.computeHeading(userPosition, business.mapOrigin)
          const distance = SphericalUtil.computeDistanceBetween(userPosition, business.mapOrigin)
          // const newPos = SphericalUtil.computeOffset(userPosition, 10, heading)
          // const newPoint = localPointFromGps(business.mapOrigin, newPos)
          // const vec = controlsRef.current?.getTarget(new Vector3()) ?? new Vector3()
          const { distanceMeters, headingDegrees } = getDistanceAndHeadingBetweenLocations(
            userPosition,
            business.mapOrigin,
          )
          console.log(
            'distanceMeters:',
            distanceMeters.toFixed(2),
            distance.toFixed(2),
            'headingDegrees:',
            headingDegrees.toFixed(2),
            headingToBusiness.toFixed(2),
            headingNorth.toFixed(2),
            SphericalUtil.computeHeading(business.mapOrigin, Earth.NORTH).toFixed(2),
          )
          // if (vec.x === 0 && vec.z === 0) {
          //   controlsRef.current?.setTarget(newPoint.x, 0, newPoint.z)
          // } else {
          //   controlsRef.current?.setTarget(0, 0, 0)
          // }
          // setPopupAttractionId(null)
          // controlsRef.current?.reset(true)
        }}
      />
    </>
  )
}
