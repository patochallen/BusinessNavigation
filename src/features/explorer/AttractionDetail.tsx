import { ArrowUp, Clock3, MapPin, Navigation, Ruler, ShieldCheck } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Attraction, Business } from '../../domain/types'
import { categoryLabels } from '../../domain/demo-data'
import './AttractionDetail.css'
import { routeDistanceToAttraction, walkingEtaFromDistance } from '../../domain/use-cases'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'
import { useTranslation } from 'react-i18next'

type AttractionDetailProps = {
  business: Business
  attraction: Attraction
  position?: GeolocationPosition | null
  heading?: number | null
  onNavigate: () => void
  onViewMap: () => void
}

export function AttractionDetail({
  business,
  attraction,
  position,
  heading,
  onNavigate,
  onViewMap,
}: AttractionDetailProps) {
  const { t } = useTranslation()
  const { distanceMeters, headingDegrees: calculatedHeadingDegrees } =
    getDistanceAndHeadingBetweenLocations(
      position?.coords ?? business.mapOrigin,
      attraction.coordinates,
    )
  const deg = heading ? (calculatedHeadingDegrees - heading + 360) % 360 : calculatedHeadingDegrees
  const headingDegrees = deg

  return (
    <section className="attraction-detail">
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
            {t('common.walking')}
          </span>
        </div>
        <div>
          <Ruler size={17} />
          <span>
            <strong>{t('detail.distance')}</strong> {distanceMeters.toFixed(1)} m.
          </span>
        </div>
        <div>
          <ShieldCheck size={17} />
          <span>
            <strong>{t('detail.heading')}</strong> {headingDegrees.toFixed(0)}° N
          </span>
        </div>
      </div>
      <div className="detail-actions">
        <button className="button button-dark" onClick={onNavigate}>
          <Navigation size={17} /> {t('detail.startNavigation')}
        </button>
        <button className="outline-button" onClick={onViewMap}>
          <MapPin size={16} /> {t('detail.viewMap')}
        </button>
      </div>
    </section>
  )
}
