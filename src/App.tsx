import {
  HashRouter,
  Link,
  Navigate,
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
import { NewNavigationView } from './features/navigation/NewNavigationView'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsView } from './features/settings/SettingsView'
import { AppHeader } from './features/layout/AppHeader'
import { AppFooter } from './features/layout/AppFooter'
import { LocationPermissionRequiredView } from './features/location/LocationPermissionRequiredView'
import { localPointFromGps } from './domain/coordinates'
import {
  getDistanceAndHeadingBetweenLocations,
  getDistanceBetweenLocations,
} from './utils/location'
import { SensorScreen } from './features/sensors/SensorScreen'

const DEFAULT_BUSINESS_ID = import.meta.env.VITE_DEFAULT_BUSINESS_ID

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
  const { position, permission, errorMessage, requestPermission } = useGeolocation()
  const attraction =
    business && attractionId
      ? demoBusinessRepository.findAttraction(business, attractionId)
      : business?.attractions[0]
  const headingState = useDeviceHeading(true)
  const enableHeading = headingState.enable
  const mapAttractionId = searchParams.get('attraction') ?? undefined
  const businessMark = business?.name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const shouldShowHeaderBack = isSettings || isNavigation || isAttractionDetail
  const requestedAfterDeniedRef = useRef(false)

  useEffect(() => {
    void enableHeading()
  }, [enableHeading])

  useEffect(() => {
    if (permission === 'ready' && requestedAfterDeniedRef.current && business) {
      requestedAfterDeniedRef.current = false
      navigate(`/b/${business.id}`, { replace: true })
    }
  }, [business, navigate, permission])

  if (!business || (attractionId && !attraction))
    return (
      <main className="not-found">
        <span className="app-brand-mark">{businessMark ?? 'BN'}</span>
        <h1>{t('app.notFoundTitle')}</h1>
        <p>{t('app.notFoundDescription')}</p>
        <Link className="button button-dark" to="/">
          {t('app.backHome')}
        </Link>
      </main>
    )

  if (isNavigation && attraction && position) {
    // const distanceAndHeading = getDistanceAndHeadingBetweenLocations(
    //   position.coords,
    //   attraction.origin,
    // )
    // console.log('Navigating to attraction:', distanceAndHeading)
    // const userPosition = localPointFromGps(business.mapOrigin, position.coords)
    return (
      <NewNavigationView
        business={business}
        selected={attraction}
        userPosition={position.coords}
        heading={360 - (headingState.heading ?? 0) + 11}
        onBack={() => navigate(-1)}
      />
    )
  }

  // return <SensorScreen />

  return (
    <div className="app-shell">
      <AppHeader
        businessMark={businessMark ?? 'BN'}
        businessName={business.name}
        isSettings={isSettings}
        showBack={shouldShowHeaderBack}
        showSettings={!isSettings}
        onBack={() => navigate(-1)}
        onOpenHome={() => navigate(`/b/${business.id}`, { replace: true })}
        onOpenSettings={() => navigate(`/b/${business.id}/settings`)}
      />
      <main>
        {permission === 'denied' ? (
          <LocationPermissionRequiredView
            requesting={false}
            errorMessage={errorMessage}
            onRetry={() => {
              requestedAfterDeniedRef.current = true
              void requestPermission()
            }}
          />
        ) : isSettings ? (
          <SettingsView
            business={business}
            locationPermission={permission}
            headingPermission={headingState.permission}
            position={position}
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
      <AppFooter businessName={business.name} permission={permission} position={position} />
    </div>
  )
}

function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/b/${DEFAULT_BUSINESS_ID}`} replace />} />
        <Route path="/b/:businessId" element={<AppContent />} />
        <Route path="/b/:businessId/settings" element={<AppContent />} />
        <Route path="/b/:businessId/a/:attractionId" element={<AppContent />} />
        <Route path="/b/:businessId/a/:attractionId/navigate" element={<AppContent />} />
        <Route path="*" element={<Navigate to={`/b/${DEFAULT_BUSINESS_ID}`} replace />} />
      </Routes>
    </HashRouter>
  )
}
export default App
