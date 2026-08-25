import { ArrowLeft, Compass, Languages, LocateFixed } from 'lucide-react'
import type { Business, LocationPermission } from '../../domain/types'
import './SettingsView.css'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'

type SettingsViewProps = {
  business: Business
  locationPermission: LocationPermission
  headingPermission: LocationPermission
  position: GeolocationPosition | null
  onBack: () => void
}

function permissionLabel(
  permission: LocationPermission,
  keyPrefix: string,
  t: (key: string) => string,
) {
  if (permission === 'ready') return t(`${keyPrefix}Ready`)
  if (permission === 'requesting') return t(`${keyPrefix}Requesting`)
  if (permission === 'denied') return t(`${keyPrefix}Denied`)
  if (permission === 'unavailable') return t(`${keyPrefix}Unavailable`)
  return t(`${keyPrefix}Idle`)
}

export function SettingsView({
  business,
  locationPermission,
  headingPermission,
  position,
  onBack,
}: SettingsViewProps) {
  const { t } = useTranslation()
  const locationActive = locationPermission === 'ready'
  const headingActive = headingPermission === 'ready'
  const coordinates = position
    ? `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
    : t('settings.coordinatesUnavailable')

  return (
    <section className="settings-view">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={17} /> {t('settings.backToMap')}
      </button>
      <div className="settings-title-block">
        <p className="eyebrow">{business.eyebrow}</p>
        <h1>{t('settings.title')}</h1>
        <p className="settings-description">{t('settings.description')}</p>
      </div>
      <div className="settings-cards">
        <article className="settings-card">
          <div className="settings-card-head">
            <Languages size={16} aria-hidden="true" />
            <h2>{t('settings.languageTitle')}</h2>
          </div>
          <p className="settings-meta settings-language-copy">
            {t('settings.languageDescription')}
          </p>
          <div className="settings-language-switcher">
            <LanguageSwitcher />
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <LocateFixed size={18} />
            <h2>{t('settings.locationTitle')}</h2>
          </div>
          <p className="settings-status-row">
            <span
              className={`settings-status-light ${locationActive ? 'is-active' : 'is-inactive'}`}
              aria-hidden="true"
            />
            {permissionLabel(locationPermission, 'settings.location', t)}
          </p>
          <p className="settings-meta">{coordinates}</p>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <Compass size={18} />
            <h2>{t('settings.headingTitle')}</h2>
          </div>
          <p className="settings-status-row">
            <span
              className={`settings-status-light ${headingActive ? 'is-active' : 'is-inactive'}`}
              aria-hidden="true"
            />
            {permissionLabel(headingPermission, 'settings.heading', t)}
          </p>
          <p className="settings-meta">{t('settings.headingHint')}</p>
        </article>
      </div>
    </section>
  )
}
