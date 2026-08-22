import { ArrowLeft, ArrowUp, Clock3, MapPin, Navigation, ShieldCheck } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Attraction, Business } from '../../domain/types'
import { categoryLabels } from '../../domain/demo-data'
import { routeDistanceToAttraction, walkingEtaFromDistance } from '../../domain/use-cases'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'

type AttractionDetailProps = {
  business: Business
  attraction: Attraction
  position?: GeolocationPosition | null
}

export function AttractionDetail({ business, attraction, position }: AttractionDetailProps) {
  const navigate = useNavigate()
  const { distanceMeters, headingDegrees } = getDistanceAndHeadingBetweenLocations(
    position?.coords ?? business.mapOrigin,
    attraction.coordinates,
  )

  return (
    <section className="attraction-detail">
      <Link className="back-link" to={`/b/${business.id}`}>
        <ArrowLeft size={17} /> Volver al mapa
      </Link>
      <div
        className="detail-visual"
        style={{ '--detail-color': attraction.color } as CSSProperties}
      >
        <span className="detail-glyph">
          <ArrowUp size={60} style={{ transform: `rotate(${headingDegrees}deg)` }} />
        </span>
        <span className="detail-coordinate">{distanceMeters.toFixed(1)} m.</span>
        <span className="detail-orbit detail-orbit-one" />
        <span className="detail-orbit detail-orbit-two" />
      </div>
      <div className="detail-heading">
        <p className="eyebrow">{categoryLabels[attraction.category]}</p>
        <h1>
          {attraction.name}
          <span className="period">.</span>
        </h1>
        <span className="destination-tag" style={{ color: attraction.color }}>
          {attraction.tag}
        </span>
      </div>
      <p className="detail-description">{attraction.description}</p>
      <div className="detail-facts">
        <div>
          <Clock3 size={17} />
          <span>
            <strong>
              {walkingEtaFromDistance(routeDistanceToAttraction(business, attraction)) ?? '—'}
            </strong>{' '}
            a pie
          </span>
        </div>
        <div>
          <MapPin size={17} />
          <span>
            <strong>Predio</strong> {business.name}
          </span>
        </div>
        <div>
          <ShieldCheck size={17} />
          <span>
            <strong>Acceso</strong> señalizado
          </span>
        </div>
      </div>
      <div className="detail-actions">
        <button
          className="button button-dark"
          onClick={() => navigate(`/b/${business.id}/a/${attraction.id}/navigate`)}
        >
          <Navigation size={17} /> Comenzar navegación
        </button>
        <button
          className="outline-button"
          onClick={() => navigate(`/b/${business.id}?attraction=${attraction.id}`)}
        >
          <MapPin size={16} /> Ver en el mapa
        </button>
      </div>
    </section>
  )
}
