import { useEffect, useMemo } from 'react'
import type { Business, Category, Coordinate, MapPoint, Attraction } from '../../domain/types'
import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  ShapeUtils,
  TubeGeometry,
  Vector3,
  type Object3DEventMap,
  type Side,
} from 'three'
import { center, toPoint, toPoints } from '../../utils/utils'
import { Crosshair, Trees, Utensils, Zap } from 'lucide-react'
import { Html } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader, OBJLoader } from 'three/examples/jsm/Addons.js'
import { degToRad } from 'three/src/math/MathUtils.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const categoryIcons = {
  food: Utensils,
  adventure: Zap,
  services: Crosshair,
  nature: Trees,
} satisfies Record<Category, typeof Utensils>

type BusinessMapViewProps = {
  business: Business
  onSelectAttraction: (attraction: Attraction) => void
}

export function BusinessMapView({ business, onSelectAttraction }: BusinessMapViewProps) {
  // console.log('BusinessMapView:', business.id)
  const origin = center(business.boundary)
  // console.log('Origin:', origin)
  const geometry = useMemo(() => createShapeGeometry(business.boundary, origin), [business])
  // const paths: BufferGeometry[] =
  //   business.mapFeatures
  //     ?.filter((f) => f.type === 'path')
  //     .map((feature) => createTubeGeometry(feature.points, origin)) ?? []

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <group>
      <primitive
        object={createMesh(
          geometry,
          business.terrain.sideColor ?? business.terrain.color,
          true,
          true,
          business.terrain.opacity,
        )}
      />
      {/* {paths.length > 0 && <primitive object={createMesh(mergeGeometries(paths), 'red')} />} */}
      {/* {business.mapFeatures
        ?.filter((f) => f.type === 'path')
        .map((feature) => {
          const tube = createTubeGeometry(feature.points, origin)
          return <primitive key={feature.id} object={createMesh(tube, feature.color)} />
        })} */}
      {business.mapFeatures?.map((feature) => {
        if (feature.type === 'path') {
          const tube = createTubeGeometry(feature.points, origin)
          return <primitive key={feature.id} object={createMesh(tube, feature.color)} />
        }
        if (feature.type === 'building') {
          const box = createBoxGeometry(feature.size)
          return <primitive key={feature.id} object={createMesh(box, feature.color)} />
        }
        if (feature.type === 'area') {
          const area = createShapeGeometry(feature.points, origin) //createPlaneGeometry({ x: maxX - minX, z: maxZ - minZ })
          area.translate(0, 0.01, 0)
          return <primitive key={feature.id} object={createMesh(area, feature.color)} />
        }
      })}
      {business.attractions.map((attraction) => {
        if (attraction.modelUrl) {
          const point = toPoint(origin, attraction.origin ?? center(attraction.boundary))
          let scene: Group<Object3DEventMap> | null = null
          if (attraction.modelUrl.endsWith('.obj')) {
            scene = useLoader(OBJLoader, `${import.meta.env.BASE_URL}${attraction.modelUrl}`)
            const meshes = scene.children.flatMap((child) => {
              const mesh = child as Mesh
              if (!mesh.isMesh) return mesh.children.filter((c) => (c as Mesh).isMesh) as Mesh[]
              return mesh
            }) as Mesh[]
            meshes.forEach((mesh) => {
              const material = mesh.material as MeshStandardMaterial
              if (material) mesh.material = new MeshStandardMaterial({ color: attraction.color })
            })
          } else if (
            attraction.modelUrl.endsWith('.glb') ||
            attraction.modelUrl.endsWith('.gltf')
          ) {
            const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${attraction.modelUrl}`)
            scene = model.scene.clone(true)
          }
          if (!scene) return null
          // console.log('model', attraction.name, new Box3().setFromObject(scene))
          return (
            <primitive
              key={attraction.id}
              object={scene}
              position={[
                point.x + (attraction.offset?.x ?? 0) * (attraction.scale?.x ?? 1),
                (attraction.offset?.y ?? 0) * (attraction.scale?.y ?? 1),
                point.y + (attraction.offset?.z ?? 0) * (attraction.scale?.z ?? 1),
              ]}
              rotation={attraction.rotation?.toArray() ?? [0, 0, 0]}
              scale={attraction.scale ?? new Vector3(1, 1, 1)}
              castShadow
              receiveShadow
            />
          )
        }
      })}
      {business.attractions.map((attraction) => {
        const attractionGeometry = createShapeGeometry(attraction.boundary, origin)
        attractionGeometry.translate(0, 0.1, 0)
        return (
          <primitive
            key={attraction.id}
            object={createMesh(attractionGeometry, attraction.color)}
          />
        )
      })}
      {business.attractions.map((attraction) => {
        const point = toPoint(origin, center(attraction.boundary))
        const Icon = categoryIcons[attraction.category]
        return (
          <Html key={attraction.id} position={[point.x, 0.5, point.y]} sprite zIndexRange={[10, 0]}>
            <div className="attraction-marker-anchor">
              <button
                className={'attraction-marker'}
                style={{ backgroundColor: attraction.color }}
                title={attraction.name}
                onClick={() => onSelectAttraction(attraction)}
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
  )
}

function createMesh(
  geometry: BufferGeometry,
  color: string,
  receiveShadow: boolean = false,
  transparent: boolean = false,
  opacity: number = 1,
  side: Side = DoubleSide,
): Mesh {
  const mesh = new Mesh(
    geometry,
    new MeshStandardMaterial({ color, transparent: true, opacity: 0.3, side }),
  )
  mesh.receiveShadow = receiveShadow
  return mesh
}

export function createPlaneGeometry(size: MapPoint): PlaneGeometry {
  const geometry = new PlaneGeometry(size.x, size.z)
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, 0.01, 0)
  geometry.computeVertexNormals()
  return geometry
}

export function createBoxGeometry(size: MapPoint): BoxGeometry {
  const geometry = new BoxGeometry(size.x, 0.32, size.z)
  geometry.computeVertexNormals()
  return geometry
}

export function createTubeGeometry(coordinates: Coordinate[], origin?: Coordinate): TubeGeometry {
  const contour = toPoints(coordinates, origin)
  if (!ShapeUtils.isClockWise(contour)) contour.reverse()
  const curve = new CatmullRomCurve3(contour.map((p) => new Vector3(p.x, 0, p.y)))

  const geometry = new TubeGeometry(curve, 64, 1, 8, false)
  geometry.scale(1, 0.1, 1)
  geometry.translate(0, 0.1, 0)
  geometry.computeVertexNormals()
  return geometry
}

export function createShapeGeometry(coordinates: Coordinate[], origin?: Coordinate): ShapeGeometry {
  const contour = toPoints(coordinates, origin)
  if (!ShapeUtils.isClockWise(contour)) contour.reverse()

  const geometry = new ShapeGeometry(new Shape(contour))
  geometry.rotateX(Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}
