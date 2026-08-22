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
import { Search } from 'lucide-react'
import './App.css'
import { demoBusinessRepository } from './domain/business-repository'
import { useGeolocation } from './services/location'
import { useDeviceHeading } from './services/orientation'
import { BusinessHome } from './features/explorer/BusinessHome'
import { AttractionDetail } from './features/explorer/AttractionDetail'
import { NavigationView } from './features/navigation/NavigationView'

function AppContent() {
  const { businessId, attractionId } = useParams<{
    businessId: string
    attractionId?: string
  }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const business = businessId ? demoBusinessRepository.findById(businessId) : undefined
  const isNavigation = location.pathname.endsWith('/navigate')
  const { position, permission, errorMessage, locate } = useGeolocation()
  const headingState = useDeviceHeading(isNavigation)
  const attraction =
    business && attractionId
      ? demoBusinessRepository.findAttraction(business, attractionId)
      : business?.attractions[0]
  const mapAttractionId = searchParams.get('attraction') ?? undefined
  const businessMark = business?.name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (!business || (attractionId && !attraction))
    return (
      <main className="not-found">
        <span className="brand-mark">{businessMark ?? 'BN'}</span>
        <h1>Este lugar no aparece en el mapa</h1>
        <p>Revisá el código QR e intentá nuevamente.</p>
        <Link className="button button-dark" to="/">
          Volver al inicio
        </Link>
      </main>
    )

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to={`/b/${business.id}`} className="wordmark">
          <span className="brand-mark">{businessMark}</span>
          <span>{business.name}</span>
        </Link>
        <button className="icon-button" aria-label="Buscar">
          <Search size={19} />
        </button>
      </header>
      <main>
        {isNavigation ? (
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
            locate={locate}
            onBack={() => navigate(`/b/${business.id}/a/${attraction?.id ?? ''}`)}
          />
        ) : attractionId && attraction ? (
          <AttractionDetail business={business} attraction={attraction} position={position} />
        ) : (
          <BusinessHome
            business={business}
            permission={permission}
            position={position}
            selectedAttractionId={mapAttractionId}
            locate={locate}
          />
        )}
      </main>
      <footer>
        <span>{business.name}</span>
        <span>Tu mapa, tu ritmo.</span>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/b/:businessId" element={<AppContent />} />
        <Route path="/b/:businessId/a/:attractionId" element={<AppContent />} />
        <Route path="/b/:businessId/a/:attractionId/navigate" element={<AppContent />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
