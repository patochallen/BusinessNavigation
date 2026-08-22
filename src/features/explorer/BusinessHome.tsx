import { Compass, Crosshair, LocateFixed, MapPin, Search, Utensils, Waves, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Business, Category } from '../../domain/types'
import { categoryLabels } from '../../domain/demo-data'
import {
  filterAttractions,
  localPointFromGps,
  routeDistanceToAttraction,
  walkingEtaFromDistance,
} from '../../domain/use-cases'
import { MapScene } from '../map/MapScene'
import './BusinessHome.css'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'
import { AttractionItemList } from './AttractionItemList'

type BusinessHomeProps = {
  business: Business
  permission: string
  position: GeolocationPosition | null
  selectedAttractionId?: string
  locate: () => void
}

const icons: Record<Category, typeof Compass> = {
  food: Utensils,
  adventure: Zap,
  services: Crosshair,
  nature: Waves,
}

export function BusinessHome({
  business,
  permission,
  position,
  selectedAttractionId,
  locate,
}: BusinessHomeProps) {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(selectedAttractionId ?? 'punto-encuentro')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const activeSelectedId = selectedAttractionId ?? selectedId
  const selected =
    business.attractions.find((item) => item.id === activeSelectedId) ?? business.attractions[0]
  const userPosition = position
    ? localPointFromGps(
        business.mapOrigin,
        { latitude: position.coords.latitude, longitude: position.coords.longitude },
        business.mapScaleMeters,
      )
    : undefined
  const filtered = useMemo(
    () => filterAttractions(business.attractions, category, query),
    [business.attractions, category, query],
  )
  return (
    <>
      <section className="intro">
        <p className="eyebrow">{business.eyebrow}</p>
        <h1>
          {business.name}
          <span className="period">.</span>
        </h1>
        <p className="intro-copy">{business.description}</p>
        <div className="location">
          <MapPin size={16} />
          <span>{business.location}</span>
          <span className="dot">•</span>
          <span>{business.statusLabel}</span>
        </div>
      </section>
      <section className="map-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Mapa del predio</p>
            <h2>Tu próxima pausa</h2>
          </div>
          <button className="outline-button" onClick={locate} disabled={permission === 'ready'}>
            <LocateFixed size={16} /> {permission === 'ready' ? 'Ubicación activa' : 'Ubicarme'}
          </button>
        </div>
        <div className="map-frame">
          <MapScene
            key={selectedAttractionId ?? 'overview'}
            business={business}
            userPosition={userPosition}
            selectedId={selected?.id}
            centerOnSelected={Boolean(selectedAttractionId)}
            onSelect={(attractionId) => {
              setSelectedId(attractionId)
              navigate(`/b/${business.id}?attraction=${attractionId}`, { replace: true })
            }}
            userActive={permission === 'ready'}
          />
          {business.mapLabels?.map((mapLabel) => (
            <div
              className="map-label"
              key={mapLabel.id}
              style={{
                left: `${50 + mapLabel.position.x * 5}%`,
                top: `${50 + mapLabel.position.z * 5}%`,
              }}
            >
              {mapLabel.label.toUpperCase()}
            </div>
          ))}
          <div className="map-legend">
            <span className="legend-dot" /> {business.attractions.length} puntos de interés
          </div>
          <button
            className="north-button"
            aria-label="Restablecer vista del mapa"
            title="Restablecer vista del mapa"
            onClick={() => navigate(`/b/${business.id}`, { replace: true })}
          >
            <Compass size={17} />
          </button>
        </div>
      </section>
      <section className="explore-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explorá el valle</p>
            <h2>Encontrá tu lugar</h2>
          </div>
          <span className="count">{filtered.length} lugares</span>
        </div>
        <div className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar una atracción"
          />
        </div>
        <div className="category-row">
          <button
            className={category === 'all' ? 'category active' : 'category'}
            onClick={() => setCategory('all')}
          >
            Todos
          </button>
          {(Object.keys(categoryLabels) as Category[]).map((key) => {
            const Icon = icons[key]
            return (
              <button
                key={key}
                className={category === key ? 'category active' : 'category'}
                onClick={() => setCategory(key)}
              >
                <Icon size={15} />
                {categoryLabels[key]}
              </button>
            )
          })}
        </div>
        <div className="attraction-list">
          {filtered.map((item) => {
            const { distanceMeters, headingDegrees } = getDistanceAndHeadingBetweenLocations(
              position?.coords ?? business.mapOrigin,
              item.coordinates,
            )
            const Icon = icons[item.category]
            return (
              <AttractionItemList
                key={item.id}
                selected={item.id === selectedAttractionId}
                color={item.color}
                name={item.name}
                description={item.description}
                category={categoryLabels[item.category]}
                walkingEta={
                  walkingEtaFromDistance(routeDistanceToAttraction(business, item)) ?? '—'
                }
                distanceMeters={`${Math.round(distanceMeters)} m.`}
                headingDegrees={headingDegrees}
                icon={Icon}
                onClick={() => {
                  setSelectedId(item.id)
                  navigate(`/b/${business.id}/a/${item.id}`)
                }}
              />
            )
          })}
        </div>
      </section>
    </>
  )
}
