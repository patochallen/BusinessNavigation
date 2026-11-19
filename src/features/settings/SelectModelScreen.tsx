import { useEffect, useId, useMemo, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { businessModels, type BusinessModel } from './business-model'
import './SelectModelScreen.css'
import { useGeolocation } from '../../services/location'
import { FirstPersonView } from './FirstPersonView'
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { LocationStorage } from '../../data/storage-repository'

export function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<BusinessApp />} />
        <Route path="/:businessId" element={<BusinessDetails />} />
        <Route path="/map/:businessId" element={<BusinessMap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export const BusinessApp = () => {
  const navigate = useNavigate()
  const [currentBusinessId, setCurrentBusinessId] = useState(LocationStorage.getCurrentBusiness())

  useEffect(() => {
    if (currentBusinessId) {
      console.log('BusinessApp navigating to business:', currentBusinessId)
      navigate(`/${currentBusinessId}`)
    } else {
      console.log('BusinessApp no selected business')
    }
  }, [currentBusinessId])

  return <SelectModelScreen onSelectModel={setCurrentBusinessId} />
}

const BusinessMap = () => {
  const { business } = useLocation().state
  const model = useMemo(
    () => useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${business.sceneUrl}`).scene.clone(),
    [business.sceneUrl],
  )
  const { position: geoPosition } = useGeolocation()
  const location = useMemo(() => geoPosition?.coords, [geoPosition])

  return (
    <div className="business-details">
      <FirstPersonView
        scene={model}
        location={location}
        destination={business.location}
        businessId={business.id}
      />
    </div>
  )
}

const BusinessDetails = () => {
  const navigate = useNavigate()
  const { businessId } = useParams<{ businessId: string }>()
  const business = useMemo(() => businessModels.find((b) => b.id === businessId), [businessId])
  if (!business) return <div>Business not found</div>

  return (
    <div className="business-details">
      <BusinessItem
        business={business}
        onSelect={() => navigate(`/map/${businessId}`, { state: { business } })}
      />
    </div>
  )
}

export type SelectModelScreenProps = {
  onSelectModel: (modelId: string) => void
}

export const SelectModelScreen = ({ onSelectModel }: SelectModelScreenProps) => {
  const titleId = useId()

  return (
    <section className="model-selection" aria-labelledby={titleId}>
      <header className="model-selection-header">
        <h1 id={titleId}>Seleccioná un modelo</h1>
      </header>
      <div className="model-selection-scroll">
        <ul className="model-list">
          {businessModels.map((model) => (
            <li key={model.id}>
              <BusinessItem business={model} onSelect={onSelectModel} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const BusinessItem = ({
  business,
  onSelect,
}: {
  business: BusinessModel
  onSelect: (modelId: string) => void
}) => {
  const titleId = useId()
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const { latitude, longitude, altitude } = business.location

  return (
    <button
      type="button"
      className="business-model-card"
      aria-labelledby={titleId}
      onClick={() => onSelect(business.id)}
    >
      <span className="business-model-card-preview">
        {business.imageUrl && failedImageUrl !== business.imageUrl ? (
          <img
            src={business.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedImageUrl(business.imageUrl)}
          />
        ) : (
          <span className="business-model-card-placeholder">
            <MapPin size={24} aria-hidden="true" />
            Vista previa no disponible
          </span>
        )}
        <span className="business-model-card-badge">ID {business.id}</span>
      </span>

      <span className="business-model-card-content">
        <span className="business-model-card-heading">
          <span id={titleId}>{business.name}</span>
          <ArrowUpRight size={20} aria-hidden="true" />
        </span>
        <span className="business-model-card-description">{business.description}</span>
        <span className="business-model-card-details">
          <span className="business-model-card-detail">
            <MapPin size={16} aria-hidden="true" />
            <span>
              <span className="business-model-card-label">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
                {altitude != null && ` · ${altitude} m`}
              </span>
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
