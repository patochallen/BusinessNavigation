import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import i18n from './i18n/i18n'
import { CameraMapView, CameraMapViewContent } from './features/map/CameraMapView'
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'

document.documentElement.lang = i18n.language

// const ParkLocation = { latitude: -34.550539413457, longitude: -58.48003697685765 }

// export const CameraCanvas = () => {
//   const videoRef = useRef<HTMLVideoElement | null>(null)
//   const streamRef = useRef<MediaStream | null>(null)
//   const showRef = useRef<boolean>(true)
//   const cameraStartedRef = useRef<boolean>(true)
//   const [size, setSize] = useState<Vector2>()

//   useEffect(() => {
//     const handleResize = (e: any) => {
//       if (videoRef.current) {
//         console.log('Window resized', videoRef.current)
//         // const box = videoRef.current?.getBoundingClientRect()
//         // const ratio = box.height / box.width
//         // const fov = radToDeg(Math.atan(ratio))
//         // const fov1 = radToDeg(Math.atan(box.width / box.height))
//         // const fov2 = radToDeg(2 * Math.atan(box.height / box.width))
//         // const fov3 = radToDeg(2 * Math.atan(box.width / box.height))
//         // // console.log(
//         // //   'RESIZED Aspect updated - ratio:',
//         // //   ratio,
//         // //   'size:',
//         // //   box,
//         // //   'Fov:',
//         // //   fov.toFixed(),
//         // //   'Fov1:',
//         // //   fov1.toFixed(),
//         // //   'Fov2:',
//         // //   fov2.toFixed(),
//         // //   'Fov3:',
//         // //   fov3.toFixed(),
//         // // )
//         // setSize(new Vector2(box.width, box.height))
//       }
//     }

//     console.log('Window resize listener added')
//     window.addEventListener('resize', handleResize)
//     return () => {
//       console.log('Window resize listener removed')
//       window.removeEventListener('resize', handleResize)
//     }
//   }, [])

//   const stopCamera = () => {
//     console.log('Stopping camera')
//     cameraStartedRef.current = false
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((track) => track.stop())
//       streamRef.current = null
//     }

//     if (videoRef.current) {
//       videoRef.current.srcObject = null
//     }
//     showRef.current = false
//   }

//   const startCamera = async () => {
//     console.log('Starting camera')
//     cameraStartedRef.current = true
//     if (!window.isSecureContext) {
//       alert('Camara requiere contexto seguro. Usa https o http://localhost.')
//       return
//     }

//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       alert('Tu navegador no soporta acceso a la camara.')
//       return
//     }

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: 'environment' },
//         audio: false,
//       })

//       streamRef.current = stream
//       if (videoRef.current) {
//         const box = videoRef.current.getBoundingClientRect()
//         const ratio = box.width / window.innerHeight
//         const ratio2 = window.innerWidth / box.height
//         const fov = radToDeg(2 * Math.atan(ratio))
//         const fov2 = radToDeg(2 * Math.atan(ratio2))
//         // const fov1 = toDegrees(Math.atan(ratio2));
//         // const fov2 = toDegrees(2 * Math.atan(ratio));
//         // const fov3 = toDegrees(2 * Math.atan(ratio2));
//         // const aspectRatio = box.width / box.height;
//         // const vFov = 2 * Math.atan(Math.tan(hFov * 0.5) / aspectRatio);
//         // const hFov = 2 * Math.atan(aspectRatio * Math.tan(vFov * 0.5));

//         // const aspectRation = hFov / vFov;

//         const size = new Vector2(window.innerWidth, box.height)
//         console.log(
//           'Aspect updated - size:',
//           size,
//           'ratio:',
//           ratio.toFixed(4),
//           'Fov:',
//           fov.toFixed(),
//           'ratio2:',
//           ratio2.toFixed(4),
//           'Fov2:',
//           fov2.toFixed(),
//         )
//         videoRef.current.srcObject = stream
//         showRef.current = true
//         setSize(size)
//       }
//     } catch (cameraError) {
//       if (cameraError instanceof Error && cameraError.name === 'NotAllowedError') {
//         alert('Permiso de camara bloqueado. Habilitalo en Chrome.')
//         return
//       }
//       alert(cameraError instanceof Error ? cameraError.message : 'No se pudo iniciar la camara.')
//     }
//   }

//   // start camera on mount and stop on unmount
//   // useEffect(() => {
//   //   console.log('CameraCanvas mounted, starting camera')
//   //   startCamera()

//   //   return () => {
//   //     console.log('CameraCanvas unmounting, stopping camera stream')
//   //     stopCamera()
//   //   }
//   // }, [])

//   return (
//     <div style={{ margin: '0px', backgroundColor: 'black' }}>
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         muted
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           width: '100%',
//           height: '100%',
//           objectFit: 'cover',
//         }}
//       />
//       {size && <></>}
//       <button
//         style={{ zIndex: 200, position: 'absolute', top: 50, left: 10 }}
//         onClick={() => {
//           if (showRef.current) {
//             stopCamera()
//           } else {
//             startCamera()
//           }
//         }}
//       >
//         Camera
//       </button>
//     </div>
//   )
// }

const Home = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])
  return (
    <HashRouter>
      <Routes>
        <Route path="/b/:businessId" element={<CameraMapView />} />
        <Route path="/b/:businessId/a/:attractionId" element={<CameraMapViewContent />} />
        <Route path="*" element={<Navigate to={`/b/${DEFAULT_BUSINESS_ID}`} replace />} />
      </Routes>
    </HashRouter>
  )
}
export const DEFAULT_BUSINESS_ID = import.meta.env.VITE_DEFAULT_BUSINESS_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
)

// const Map = ({
//   heading,
//   quaternion,
//   userPosition,
// }: {
//   heading: number
//   quaternion: Quaternion | null
//   userPosition: GeolocationCoordinates | Coordinate
// }) => {
//   const [orbitActive, setOrbitActive] = useState(true)
//   const position = useMemo(() => {
//     console.log('Converting user position to point:', userPosition)
//     return toPoint(pos, userPosition)
//   }, [userPosition])
//   const aspect = window.innerWidth / window.innerHeight
//   const camera = useMemo(() => {
//     const cam = new PerspectiveCamera(60, aspect, 0.5, 2000)
//     cam.position.set(0, 1.6, 0)
//     // cam.rotation.x = -Math.PI / 2
//     return cam
//   }, [])
//   const scene = useMemo(() => {
//     const model = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}scene3.glb`)
//     const sceneModel = new SceneModel(model.scene)
//     const sc = sceneModel.getScene()
//     console.log(
//       'Loading scene model',
//       sc.getAttractions().map((attraction) => attraction.getName()),
//     )
//     // sc.setSceneWireframe(true)
//     // sc.setBuildingWireframe(true)
//     sc.setSceneOpacity(0.01)
//     return sc
//   }, [])
//   const attraction = useMemo(() => {
//     const selectedAttraction = scene.getAttractions()[0]
//     // const attr = selectedAttraction.getObject3D()
//     const attr = selectedAttraction.getFloor()
//     attr.traverse((child) => {
//       const mesh = child as Mesh
//       if (!mesh.isMesh) return
//       mesh.geometry = mesh.geometry.clone()
//       const material: MeshStandardMaterial = (
//         Array.isArray(mesh.material)
//           ? mesh.material.map((material) => material.clone())
//           : mesh.material.clone()
//       ) as MeshStandardMaterial
//       material.emissive = new Color('#ffffff')
//       material.emissiveIntensity = 10
//       material.transparent = false
//       material.opacity = 1
//       mesh.material = material
//     })
//     // console.log('Attraction floor:', attr)
//     attr.position.add(scene.getPosition().add(selectedAttraction.getPosition()))
//     return attr
//   }, [scene])

//   const target = useMemo(() => attraction.position.clone(), [attraction])
//   const attractionPosition = useMemo(() => new Vector2(target.x, target.z), [target])
//   const distanceToAttraction = useMemo(
//     () => position.distanceTo(attractionPosition),
//     [position, attractionPosition],
//   )
//   const angleToAttraction = useMemo(() => {
//     let ang = (angle2D(position, attractionPosition) + 90) % 360
//     // let ang = (360 - ((angle2D(position, attractionPosition) + 90) % 360)) % 360
//     // if (Math.abs(ang) > 180) ang = (ang - 360) % 360
//     return ang
//   }, [position, attractionPosition])
//   const angleDifferenceToAttraction = useMemo(() => {
//     let ang = (angleToAttraction - heading) % 360
//     if (Math.abs(ang) > 180) ang = (ang - 360) % 360
//     return ang
//   }, [heading, angleToAttraction])

//   const hFov = useMemo(() => {
//     const vFOV = degToRad(camera.fov)
//     const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect)
//     const hFOVDegrees = radToDeg(hFOV)
//     return hFOVDegrees * 0.98
//   }, [camera.fov, camera.aspect])

//   useEffect(() => {
//     if (quaternion && camera && !orbitActive) {
//       camera.quaternion.copy(quaternion)
//     }
//   }, [quaternion, camera])
//   return (
//     <div
//       className="canvas-container"
//       style={{
//         overflow: 'hidden',
//         width: '100%',
//         height: '100%',
//         position: 'absolute',
//         backgroundColor: 'rgba(0, 0, 0, 0.8)',
//         zIndex: 100,
//       }}
//     >
//       <Canvas camera={camera}>
//         <gridHelper args={[6, 30]} />
//         <CardinalMarkers />
//         <directionalLight position={[1, 3, 1]} intensity={10} color="#fff" />
//         <directionalLight position={[-1, 3, -1]} intensity={10} color="#fff" />
//         <EffectComposer>
//           {/* <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} /> */}
//           <Bloom luminanceThreshold={0.6} intensity={5} mipmapBlur />
//           <Vignette eskil={false} offset={0.1} darkness={0.5} />
//         </EffectComposer>
//         <SceneModelView scene={scene} />
//         <primitive object={attraction} />
//         {orbitActive && <OrbitControls />}
//       </Canvas>
//       <div
//         style={{
//           position: 'absolute',
//           top: '20px',
//           left: '50%',
//           transform: 'translateX(-50%)',
//           color: 'white',
//           fontSize: '16px',
//           fontWeight: 'bold',
//         }}
//       >
//         {attraction ? attraction.name : ''}
//         <br />
//         angle: {angleToAttraction.toFixed(1)}º
//         <br />
//         difference: {angleDifferenceToAttraction.toFixed(1)}º
//       </div>
//       <CompassView heading={heading} size={50} />
//       <IconButton
//         icon={<Settings2 />}
//         position="topRight"
//         onClick={() => setOrbitActive(!orbitActive)}
//       />
//       <ArrowOverlay
//         distance={distanceToAttraction}
//         heading={angleDifferenceToAttraction}
//         fov={hFov}
//       />
//     </div>
//   )
// }
