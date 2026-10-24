import { useCameraStream } from '../../services/camera'
import { useEffect, useRef } from 'react'
import './CameraView.css'

export const CameraView = () => {
  const cameraStream = useCameraStream()
  const videoRef = useRef<HTMLVideoElement | null>(null)

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
}
