import { useId, useState } from 'react'
import { MapPin, ArrowUpRight } from 'lucide-react'
import { businessModels, type BusinessModel } from '../business-model'
import './BusinessSelection.css'

export type BusinessSelectionProps = {
  onSelectModel: (modelId: string) => void
}

export const BusinessSelection = ({ onSelectModel }: BusinessSelectionProps) => {
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

export const BusinessItem = ({
  business,
  onSelect,
}: {
  business: BusinessModel
  onSelect?: (modelId: string) => void
}) => {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const { latitude, longitude, altitude } = business.location

  return (
    <button type="button" className="business-model-card" onClick={() => onSelect?.(business.id)}>
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
          <span>{business.name}</span>
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
