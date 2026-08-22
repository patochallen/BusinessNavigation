import { useEffect, useRef } from 'react'
import { Camera, LocateFixed, Navigation, X } from 'lucide-react'
import type { Attraction, CameraPermission } from '../../domain/types'
import './CameraNavigationView.css'

type CameraNavigationViewProps = {
  stream: MediaStream | null
  permission: CameraPermission
  errorMessage: string | null
  attraction?: Attraction
  direction: number | null
  distanceMeters: number | null
  overlayPosition: { left: number; top: number; scale: number }
  onStart: () => void
  onStop: () => void
}

export function CameraNavigationView({
  stream,
  permission,
  errorMessage,
  attraction,
  direction,
  distanceMeters,
  overlayPosition,
  onStart,
  onStop,
}: CameraNavigationViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <section className="camera-navigation">
      {stream && <video ref={videoRef} className="camera-feed" autoPlay muted playsInline />}
      <div className="camera-scrim" />
      <div className="camera-topbar">
        <span className="camera-live">
          <span /> Vista del predio
        </span>
        <button className="camera-close" aria-label="Cerrar cámara" onClick={onStop}>
          <X size={19} />
        </button>
      </div>
      {stream ? (
        <div
          className="camera-destination"
          style={{
            left: `${overlayPosition.left}%`,
            top: `${overlayPosition.top}%`,
            transform: `translate(-50%, -50%) scale(${overlayPosition.scale})`,
          }}
        >
          <Navigation size={32} />
          <strong>{attraction?.name ?? 'Destino'}</strong>
          <span>{direction === null ? 'Orientación pendiente' : `${distanceMeters ?? '—'} m`}</span>
        </div>
      ) : (
        <div className="camera-empty">
          <Camera size={28} />
          <strong>Vista de navegación</strong>
          <p>
            {permission === 'unavailable'
              ? 'Este navegador no permite usar la cámara.'
              : (errorMessage ?? 'Usá la cámara para ver una referencia sobre el entorno.')}
          </p>
          {permission !== 'requesting' && (
            <button className="button button-light" onClick={onStart}>
              <Camera size={17} /> Activar cámara
            </button>
          )}
          {permission === 'requesting' && (
            <span className="camera-status">
              <LocateFixed size={15} /> Solicitando permiso...
            </span>
          )}
        </div>
      )}
      <div className="camera-bottom">
        <span>
          <LocateFixed size={15} /> {attraction?.tag ?? 'Navegación'}
        </span>
        <small>La cámara no reemplaza las señales del predio.</small>
      </div>
    </section>
  )
}
