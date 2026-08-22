import { useEffect, useRef } from 'react'
import { Camera, LocateFixed, Navigation, X } from 'lucide-react'
import type { Attraction, CameraPermission } from '../../domain/types'
import './CameraNavigationView.css'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
          <span /> {t('camera.liveView')}
        </span>
        <button className="camera-close" aria-label={t('camera.close')} onClick={onStop}>
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
          <strong>{t('camera.viewTitle')}</strong>
          <p>
            {permission === 'unavailable'
              ? t('camera.unavailable')
              : (errorMessage ?? t('camera.description'))}
          </p>
          {permission !== 'requesting' && (
            <button className="button button-light" onClick={onStart}>
              <Camera size={17} /> {t('camera.activate')}
            </button>
          )}
          {permission === 'requesting' && (
            <span className="camera-status">
              <LocateFixed size={15} /> {t('camera.requesting')}
            </span>
          )}
        </div>
      )}
      <div className="camera-bottom">
        <span>
          <LocateFixed size={15} /> {attraction?.tag ?? 'Navegación'}
        </span>
        <small>{t('camera.warning')}</small>
      </div>
    </section>
  )
}
