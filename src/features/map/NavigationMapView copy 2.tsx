import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type { Coordinate } from '../../domain/types'
import type { AttractionModel } from '../../domain/scene-model'
import './MapView.css'
import {
  Frustum,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector2,
  Vector3,
} from 'three'
import type { Object3D } from 'three'
import { useMemo } from 'react'
import { DeviceOrientationControls, Line } from '@react-three/drei'
import { angle2D, toPoint } from '../../utils/utils'
import { SceneModel } from '../../domain/scene-model'
import { SceneModelView } from './SceneModelView'
import { IconButton } from '../layout/IconButton'
import { ArrowBigUpDash, RefreshCwOff, X } from 'lucide-react'
import { CompassView } from './CompassView'
import { degToRad } from 'three/src/math/MathUtils.js'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three-stdlib'
import { ArrowOverlay } from './ArrowOverlay'

const CAMERA_FOV = 50
const MAX_CAMERA_HEIGHT = 2000
const pos: Coordinate = { latitude: -34.55071, longitude: -58.47992 }
const showTopView = false
const cameraHeight = showTopView ? 445 : 2

function BuildingBloom({ building, active }: { building: Object3D; active: boolean }) {
  const { gl, scene, camera, size } = useThree()
  const composer = useRef<EffectComposer | null>(null)
  const bloomComposer = useRef<EffectComposer | null>(null)
  const bloom = useRef<UnrealBloomPass | null>(null)
  const maskMaterial = useRef<MeshBasicMaterial | null>(null)
  const elapsed = useRef(0)
  const buildingObjects = useMemo(() => {
    const objects = new Set<Object3D>()
    building.traverse((child) => objects.add(child))
    return objects
  }, [building])
  const bloomStrength = 0.01
  const bloomRadius = 0.02
  const bloomUmbral = 1.2 // frecuencia de oscilación del resplandor

  useEffect(() => {
    const mask = new MeshBasicMaterial({ toneMapped: false })
    mask.color.setRGB(2, 5, 6)
    const glowComposer = new EffectComposer(gl)
    glowComposer.renderToScreen = false
    const glowRenderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(
      gl.getSize(new Vector2()),
      bloomStrength,
      bloomRadius,
      bloomUmbral,
    )
    glowComposer.addPass(glowRenderPass)
    glowComposer.addPass(bloomPass)

    const effectComposer = new EffectComposer(gl)
    const renderPass = new RenderPass(scene, camera)
    const haloPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        bloomTexture: { value: null },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          vec4 base = texture2D(tDiffuse, vUv);
          vec3 halo = texture2D(bloomTexture, vUv).rgb;
          gl_FragColor = vec4(base.rgb + halo, base.a);
        }
      `,
    })
    haloPass.uniforms.bloomTexture.value = bloomPass.renderTargetsHorizontal[0].texture
    const outputPass = new OutputPass()
    effectComposer.addPass(renderPass)
    effectComposer.addPass(haloPass)
    effectComposer.addPass(outputPass)
    composer.current = effectComposer
    bloomComposer.current = glowComposer
    bloom.current = bloomPass
    maskMaterial.current = mask

    return () => {
      composer.current = null
      bloomComposer.current = null
      bloom.current = null
      maskMaterial.current = null
      renderPass.dispose()
      glowRenderPass.dispose()
      bloomPass.dispose()
      haloPass.dispose()
      outputPass.dispose()
      effectComposer.dispose()
      glowComposer.dispose()
      mask.dispose()
    }
  }, [gl, scene, camera])

  useEffect(() => {
    ;[composer.current, bloomComposer.current].forEach((effectComposer) => {
      effectComposer?.setPixelRatio(gl.getPixelRatio())
      effectComposer?.setSize(size.width, size.height)
    })
  }, [gl, camera, size.width, size.height])

  useFrame((_, delta) => {
    if (
      !active ||
      !composer.current ||
      !bloomComposer.current ||
      !bloom.current ||
      !maskMaterial.current
    ) {
      elapsed.current = 0
      gl.render(scene, camera)
      return
    }
    elapsed.current += delta
    bloom.current.strength = bloomStrength + Math.sin(elapsed.current * Math.PI * 2) * bloomStrength
    // bloom.current.strength = 2.5 + Math.sin(elapsed.current * Math.PI * 2) * 2.5
    const visibility = new Map<Object3D, boolean>()
    const background = scene.background
    const overrideMaterial = scene.overrideMaterial
    try {
      scene.traverse((child) => {
        if ('material' in child && !buildingObjects.has(child)) {
          visibility.set(child, child.visible)
          child.visible = false
        }
      })
      scene.background = null
      scene.overrideMaterial = maskMaterial.current
      bloomComposer.current.render(delta)
    } finally {
      scene.background = background
      scene.overrideMaterial = overrideMaterial
      visibility.forEach((visible, child) => {
        child.visible = visible
      })
    }
    composer.current.render(delta)
  }, 1)

  return null
}

function AttractionVisibility({
  camera,
  target,
  onChange,
}: {
  camera: PerspectiveCamera
  target: Vector3
  onChange: (visible: boolean) => void
}) {
  const frustum = useMemo(() => new Frustum(), [])
  const matrix = useMemo(() => new Matrix4(), [])
  const previous = useRef<boolean | null>(null)

  useFrame(() => {
    camera.updateMatrixWorld()
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(matrix)

    const visible = frustum.containsPoint(target)
    if (visible !== previous.current) {
      previous.current = visible
      onChange(visible)
    }
  })

  return null
}

type NavigationMapViewProps = {
  userPosition: GeolocationCoordinates | Coordinate
  heading?: number | undefined
  selectedAttraction: AttractionModel
  onClose: () => void
}

export function NavigationMapView({
  userPosition,
  heading,
  selectedAttraction,
  onClose,
}: NavigationMapViewProps) {
  const aspect = window.innerWidth / window.innerHeight
  const position = useMemo(() => {
    console.log('Converting user position to point:', userPosition)
    return toPoint(pos, userPosition)
  }, [userPosition])
  const scene = useMemo(() => {
    console.log('Loading scene model')
    const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
    const clonedScene = model.scene.clone(true)
    clonedScene.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.geometry = mesh.geometry.clone()
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => material.clone())
        : mesh.material.clone()
    })
    const sceneModel = new SceneModel(clonedScene)
    return sceneModel.getScene()
  }, [])
  const attraction = useMemo(
    () =>
      scene.getAttractions().find((a) => a.getName() === selectedAttraction.getName()) ??
      selectedAttraction,
    [scene, selectedAttraction],
  )
  const building = useMemo(() => {
    const attr =
      selectedAttraction.getBuilding().clone(true).children.at(0) ??
      selectedAttraction.getBuilding().clone(true)
    attr.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.geometry = mesh.geometry.clone()
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => material.clone())
        : mesh.material.clone()
      mesh.scale.set(...mesh.scale.clone().multiplyScalar(3).toArray())
      // mesh.scale.set(9, 9, 9)
      // mesh.material.wireframe = true
    })
    attr.position.add(scene.getPosition().clone().add(selectedAttraction.getPosition()).setY(10))
    return attr
  }, [selectedAttraction])

  const target = useMemo(
    () => attraction.getPosition().add(scene.getPosition()),
    [attraction, scene],
  )
  const attractionPosition = useMemo(() => new Vector2(target.x, target.z), [target])
  const [attractionInView, setAttractionInView] = useState(false)
  const distanceToAttraction = useMemo(
    () => position.distanceTo(attractionPosition),
    [position, attractionPosition],
  )
  const angleToAttraction = useMemo(() => {
    let ang = (360 - ((angle2D(position, attractionPosition) + 90) % 360)) % 360
    // if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [position, attractionPosition])
  const angleDifferenceToAttraction = useMemo(() => {
    let ang = (angleToAttraction - (heading ?? 0)) % 360
    if (Math.abs(ang) > 180) ang = (ang - 360) % 360
    return ang
  }, [heading, angleToAttraction])
  const camera: PerspectiveCamera = useMemo(() => {
    console.log('Creating camera')
    const cam = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, MAX_CAMERA_HEIGHT)
    cam.position.set(0, cameraHeight, 0)
    showTopView && (cam.rotation.x = -Math.PI / 2)
    return cam
  }, [])
  const controls = useRef<DeviceOrientationControlsImp>(null)
  const [fov, setFov] = useState(CAMERA_FOV)
  const hFov = useMemo(() => {
    const vFOV = camera.fov * (Math.PI / 180) // convert vertical FOV to radians
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect)
    const hFOVDegrees = hFOV * (180 / Math.PI)
    return hFOVDegrees * 0.98
  }, [fov])

  useEffect(() => {
    const pos = new Vector3(position.x, cameraHeight, position.y)
    camera.position.set(...pos.toArray())
    console.log('Camera position updated to:', pos)
  }, [position])

  useEffect(() => {
    console.log('Attraction in view changed:', attractionInView)
    attraction.setVisible(!attractionInView)
  }, [attractionInView])

  useEffect(() => {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }, [fov])

  return (
    <div
      data-attraction-in-view={attractionInView}
      style={{ overflow: 'hidden', width: '100%', height: '100%', position: 'absolute' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }}
      tabIndex={0}
    >
      <Canvas className="map-canvas" dpr={[1, 2]} camera={camera} shadows>
        <AttractionVisibility camera={camera} target={target} onChange={setAttractionInView} />
        {/* <cameraHelper args={[camera]} /> */}
        <hemisphereLight intensity={1} />
        {/* <ambientLight intensity={0.8} /> */}
        <directionalLight
          position={[-2, 52, 1.1]}
          intensity={5}
          color="#fff1d0"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <SceneModelView scene={scene} />
        <mesh position={[position.x, 0, position.y]}>
          <sphereGeometry args={[2.5, 32, 32]} />
          <meshStandardMaterial color="#d3f206" />
        </mesh>
        <mesh>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial color="#f21e06" />
        </mesh>
        <mesh position={[attractionPosition.x, 0, attractionPosition.y]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#f366cd" />
        </mesh>
        {attractionInView && <primitive object={building} />}
        <BuildingBloom building={building} active={attractionInView} />
        <group name="Navigation Lines">
          <Line
            position={[position.x, 0.2, position.y]}
            rotation={[0, degToRad((angleToAttraction + 90) % 360), 0]}
            lineWidth={10}
            points={[new Vector3(), new Vector3(distanceToAttraction, 0, 0)]}
            color="#ff0000"
          />
          <Line
            position={[position.x, 0.23, position.y]}
            rotation={[
              0,
              degToRad((angleToAttraction + 90 - angleDifferenceToAttraction) % 360),
              0,
            ]}
            lineWidth={2}
            points={[new Vector3(), new Vector3(distanceToAttraction, 0, 0)]}
            color="#1013e8"
          />
        </group>
        <group name="Camera Fov">
          <Line
            position={[position.x, 0.25, position.y]}
            rotation={[
              0,
              degToRad((angleToAttraction + 90 - angleDifferenceToAttraction + hFov / 2) % 360),
              0,
            ]}
            lineWidth={5}
            points={[new Vector3(), new Vector3(600, 0, 0)]}
            color="#dae810"
          />
          <Line
            position={[position.x, 0.25, position.y]}
            rotation={[
              0,
              degToRad((angleToAttraction + 90 - angleDifferenceToAttraction - hFov / 2) % 360),
              0,
            ]}
            lineWidth={5}
            points={[new Vector3(), new Vector3(600, 0, 0)]}
            color="#dae810"
          />
        </group>
        {/* <CameraControls /> */}
        {!showTopView && <DeviceOrientationControls camera={camera} ref={controls} />}
      </Canvas>
      <>
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
          }}
        >
          {attraction.getName()}, {angleToAttraction.toFixed(0)}º
        </div>
        <div
          className="centered-circle"
          style={{ transform: `translate(-50%, 0%) rotate(${-angleDifferenceToAttraction}deg)` }}
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
          <h2
            style={{
              transform: `translate(-50%, -50%) rotate(${angleDifferenceToAttraction}deg)`,
              left: '50%',
              top: '50%',
              position: 'absolute',
              color: 'white',
            }}
          >
            {angleDifferenceToAttraction.toFixed(1)}°
          </h2>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '70px',
            paddingTop: '20px',
            backgroundColor: 'rgba(243, 237, 237, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <label>FOV: {fov}</label>
            <input
              type="range"
              min="10"
              max="100"
              value={fov}
              onChange={(e) => setFov(Number(e.target.value))}
            />
          </div>
        </div>
        <IconButton
          icon={<RefreshCwOff />}
          position="topLeft"
          onClick={() => {
            attraction.setVisible(true)
          }}
        />
        <CompassView heading={heading ?? 0} />
        <IconButton
          icon={<X />}
          position="topRight"
          onClick={() => {
            attraction.setVisible(false)
          }}
        />
      </>
      <ArrowOverlay
        distance={distanceToAttraction}
        heading={angleDifferenceToAttraction}
        fov={hFov}
      />
    </div>
  )
}
