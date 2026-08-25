import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import './App.css'
import { demoBusinessRepository } from './domain/business-repository'
import { useGeolocation } from './services/location'
import { useDeviceHeading } from './services/orientation'
import { BusinessHome } from './features/explorer/BusinessHome'
import { AttractionDetail } from './features/explorer/AttractionDetail'
import { NavigationView } from './features/navigation/NavigationView'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsView } from './features/settings/SettingsView'
import { AppHeader } from './features/layout/AppHeader'

function AppContent() {
  const { t } = useTranslation()
  const { businessId, attractionId } = useParams<{
    businessId: string
    attractionId?: string
  }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const business = businessId ? demoBusinessRepository.findById(businessId) : undefined
  const isNavigation = location.pathname.endsWith('/navigate')
  const isSettings = location.pathname.endsWith('/settings')
  const isAttractionDetail = Boolean(attractionId) && !isNavigation
  const { position, permission, errorMessage } = useGeolocation()
  const attraction =
    business && attractionId
      ? demoBusinessRepository.findAttraction(business, attractionId)
      : business?.attractions[0]
  const headingState = useDeviceHeading(true) // isNavigation || (attractionId !== undefined && attraction !== undefined),
  const mapAttractionId = searchParams.get('attraction') ?? undefined
  const businessMark = business?.name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
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
  const shouldShowHeaderBack = isSettings || isNavigation || isAttractionDetail

  useEffect(() => {
    headingState.enable()
  }, [])

  console.log('headingState', headingState.heading)

  if (!business || (attractionId && !attraction))
    return (
      <main className="not-found">
        <span className="brand-mark">{businessMark ?? 'BN'}</span>
        <h1>{t('app.notFoundTitle')}</h1>
        <p>{t('app.notFoundDescription')}</p>
        <Link className="button button-dark" to="/">
          {t('app.backHome')}
        </Link>
      </main>
    )

  return (
    <div className="app-shell">
      <AppHeader
        businessMark={businessMark ?? 'BN'}
        businessName={business.name}
        isSettings={isSettings}
        showBack={shouldShowHeaderBack}
        onBack={() => navigate(-1)}
        onOpenHome={() => navigate(`/b/${business.id}`, { replace: true })}
        onOpenSettings={() => navigate(`/b/${business.id}/settings`)}
      />
      <main>
        {isSettings ? (
          <SettingsView
            business={business}
            locationPermission={permission}
            headingPermission={headingState.permission}
            position={position}
          />
        ) : isNavigation ? (
          <NavigationView
            business={business}
            selected={attraction}
            position={position}
            permission={permission}
            errorMessage={errorMessage}
            heading={headingState.heading}
            headingPermission={headingState.permission}
            enableHeading={headingState.enable}
            calibrateHeading={headingState.calibrate}
            headingStable={headingState.headingStable}
          />
        ) : attractionId && attraction ? (
          <AttractionDetail
            business={business}
            attraction={attraction}
            position={position}
            heading={headingState.heading}
            onNavigate={() => navigate(`/b/${business.id}/a/${attraction.id}/navigate`)}
            onViewMap={() => navigate(`/b/${business.id}?attraction=${attraction.id}`)}
          />
        ) : (
          <BusinessHome
            business={business}
            permission={permission}
            position={position}
            selectedAttractionId={mapAttractionId}
          />
        )}
      </main>
      <footer>
        <div className="footer-business-block">
          <span className="footer-business-name">{business.name}</span>
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
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/b/:businessId" element={<AppContent />} />
        <Route path="/b/:businessId/settings" element={<AppContent />} />
        <Route path="/b/:businessId/a/:attractionId" element={<AppContent />} />
        <Route path="/b/:businessId/a/:attractionId/navigate" element={<AppContent />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
