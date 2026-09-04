import { LocateFixed, Monitor, ShieldAlert, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './LocationPermissionRequiredView.css'
import { isMobile } from '../../utils/utils'

type LocationPermissionRequiredViewProps = {
  requesting: boolean
  errorMessage?: string | null
  onRetry: () => void
}

export function LocationPermissionRequiredView({
  requesting,
  errorMessage,
  onRetry,
}: LocationPermissionRequiredViewProps) {
  const { t } = useTranslation()

  const openHelp = () => {
    if (typeof window === 'undefined') return
    const ua = window.navigator.userAgent

    if (/Edg\//.test(ua)) {
      window.open(
        'https://support.microsoft.com/microsoft-edge/website-permissions-in-microsoft-edge-eafe7c86-0a13-4257-8d2b-e1b32d7f6f88',
        '_blank',
        'noopener,noreferrer',
      )
      return
    }

    if (/Firefox/i.test(ua)) {
      window.open(
        'https://support.mozilla.org/kb/site-permissions-panel',
        '_blank',
        'noopener,noreferrer',
      )
      return
    }

    if (/Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg\//i.test(ua)) {
      window.open(
        'https://support.apple.com/guide/safari/customize-website-settings-sfri40734/mac',
        '_blank',
        'noopener,noreferrer',
      )
      return
    }

    window.open('https://support.google.com/chrome/answer/142065', '_blank', 'noopener,noreferrer')
  }

  const webSteps = [
    t('locationRequired.webStep1'),
    t('locationRequired.webStep2'),
    t('locationRequired.webStep3'),
  ]
  const mobileSteps = [
    t('locationRequired.mobileStep1'),
    t('locationRequired.mobileStep2'),
    t('locationRequired.mobileStep3'),
  ]
  const activeGuide = isMobile
    ? {
        title: t('locationRequired.mobileTitle'),
        steps: mobileSteps,
        Icon: Smartphone,
      }
    : {
        title: t('locationRequired.webTitle'),
        steps: webSteps,
        Icon: Monitor,
      }

  return (
    <section className="location-required-view">
      <div className="location-required-card">
        <div className="location-required-icon" aria-hidden="true">
          <ShieldAlert size={26} />
        </div>
        <p className="eyebrow">{t('locationRequired.eyebrow')}</p>
        <h1>{t('locationRequired.title')}</h1>
        <p className="location-required-copy">{t('locationRequired.description')}</p>
        {errorMessage ? <p className="location-required-error">{errorMessage}</p> : null}

        <div className="location-required-guides">
          <article className="location-guide-card">
            <h2>
              <activeGuide.Icon size={16} /> {activeGuide.title}
            </h2>
            <ol>
              {activeGuide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </div>

        <div className="location-required-actions">
          <button className="button button-dark" onClick={onRetry} disabled={requesting}>
            <LocateFixed size={16} />
            {requesting ? t('locationRequired.retrying') : t('locationRequired.retry')}
          </button>
          <button className="outline-button" onClick={openHelp}>
            {t('locationRequired.openSettings')}
          </button>
        </div>
        <p className="location-required-hint">{t('locationRequired.settingsHint')}</p>
      </div>
    </section>
  )
}
