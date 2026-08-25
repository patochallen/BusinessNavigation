import { useTranslation } from 'react-i18next'
import type { LocationPermission } from '../../domain/types'

type AppFooterProps = {
  businessName: string
  permission: LocationPermission
  position: GeolocationPosition | null
}

export function AppFooter({ businessName, permission, position }: AppFooterProps) {
  const { t } = useTranslation()
  const geoActive = permission === 'ready'
  const geoCoordinatesLabel = position
    ? `${position.coords.latitude.toFixed(5)} ${position.coords.longitude.toFixed(5)}`
    : null
  const geoStatusLabel =
    permission === 'ready'
      ? (geoCoordinatesLabel ?? t('app.geoReady'))
      : permission === 'requesting'
        ? t('app.geoRequesting')
        : permission === 'denied'
          ? t('app.geoDenied')
          : permission === 'unavailable'
            ? t('app.geoUnavailable')
            : t('app.geoIdle')

  return (
    <footer>
      <div className="footer-business-block">
        <span className="footer-business-name">{businessName}</span>
        <span className="footer-geo-status" aria-live="polite">
          <span
            className={`footer-geo-light ${geoActive ? 'is-active' : 'is-inactive'}`}
            aria-hidden="true"
          />
          {geoStatusLabel}
        </span>
      </div>
      <span className="footer-tagline">{t('app.mapTagline')}</span>
    </footer>
  )
}
