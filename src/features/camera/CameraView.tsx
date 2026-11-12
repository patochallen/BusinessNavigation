import { useCameraStream } from '../../services/camera'
// import { useEffect, useRef } from 'react'
import './CameraView.css'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface CameraViewHandle {
  capture: () => Promise<Blob>
}

export const CameraView = forwardRef<CameraViewHandle>(function CameraView(_, ref) {
  const cameraStream = useCameraStream()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      capture: () =>
        new Promise<Blob>((resolve, reject) => {
          const video = videoRef.current

          if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
            reject(new Error('La cámara todavía no tiene una imagen disponible.'))
            return
          }

          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const context = canvas.getContext('2d')
          if (!context) {
            reject(new Error('No se pudo crear el contexto de captura.'))
            return
          }

          context.drawImage(video, 0, 0)

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('No se pudo generar la imagen.'))
            },
            'image/jpeg',
            0.9,
          )
        }),
    }),
    [],
  )

  useEffect(() => {
    console.log('Camera stream updated:', cameraStream)
    cameraStream.start()
    return () => {
      console.log('Camera stream effect cleanup')
      cameraStream.stop()
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && cameraStream.stream) {
      videoRef.current.srcObject = cameraStream.stream
    }
    console.log('Camera stream element updated:', videoRef.current?.srcObject)
  }, [cameraStream.stream])

  return (
    <>
      {cameraStream.stream ? (
        <video ref={videoRef} className="camera-feed" autoPlay muted playsInline />
      ) : (
        <div className="camera-feed-placeholder">Camera not available</div>
      )}
    </>
  )
})
// export const CameraView = () => {
//   const cameraStream = useCameraStream()
//   const videoRef = useRef<HTMLVideoElement | null>(null)

//   useEffect(() => {
//     console.log('Camera stream updated:', cameraStream)
//     cameraStream.start()
//     return () => {
//       console.log('Camera stream effect cleanup')
//       cameraStream.stop()
//     }
//   }, [])

//   useEffect(() => {
//     if (videoRef.current && cameraStream.stream) {
//       videoRef.current.srcObject = cameraStream.stream
//     }
//     console.log('Camera stream element updated:', videoRef.current?.srcObject)
//   }, [cameraStream.stream])

//   return (
//     <>
//       {cameraStream.stream ? (
//         <video ref={videoRef} className="camera-feed" autoPlay muted playsInline />
//       ) : (
//         <div className="camera-feed-placeholder">Camera not available</div>
//       )}
//     </>
//   )
// }
