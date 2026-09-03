import { Compass, Crosshair, MapPin, Search, Utensils, Waves, Zap } from 'lucide-react'
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
// import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'
import { AttractionItemList } from './AttractionItemList'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../layout/IconButton'
import { center } from '../../utils/utils'
import { getDistanceAndHeadingBetweenLocations } from '../../utils/location'
// import { center } from '../../domain/coordinates'

type BusinessHomeProps = {
  business: Business
  permission: string
  position: GeolocationPosition | null
  selectedAttractionId?: string
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
}: BusinessHomeProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(selectedAttractionId)
  const [category, setCategory] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const activeSelectedId = selectedAttractionId ?? selectedId
  const selected = business.attractions.find((item) => item.id === activeSelectedId)
  const userPosition = position ? localPointFromGps(business.mapOrigin, position.coords) : undefined
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
        <div className="map-frame">
          <MapScene
            key={selectedAttractionId ?? 'overview'}
            business={business}
            userPosition={userPosition}
            selectedId={selected?.id}
            centerOnSelected={Boolean(selectedAttractionId)}
            onSelect={(attractionId) => {
              setSelectedId(attractionId)
              navigate(`/b/${business.id}/a/${attractionId}`)
              // setSelectedId(attractionId)
              // navigate(`/b/${business.id}?attraction=${attractionId}`, { replace: true })
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
            <span className="legend-dot" />{' '}
            {t('explorer.pointsOfInterest', { count: business.attractions.length })}
          </div>
          <IconButton
            icon={<Compass />}
            position="topRight"
            onClick={() => {
              setSelectedId(undefined)
              navigate(`/b/${business.id}`, { replace: true })
            }}
          />
        </div>
      </section>
      <section className="explore-section">
        <p className="eyebrow">
          {t('explorer.exploreTitle')} ({filtered.length})
        </p>
        <div className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('explorer.searchPlaceholder')}
          />
        </div>
        <div className="category-row">
          <button
            className={category === 'all' ? 'category active' : 'category'}
            onClick={() => setCategory('all')}
          >
            {t('categories.all')}
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
                {t(`categories.${key}`)}
              </button>
            )
          })}
        </div>
        <div className="attraction-list">
          {filtered.map((item) => {
            const { distanceMeters, headingDegrees } = getDistanceAndHeadingBetweenLocations(
              position?.coords ?? business.mapOrigin,
              item.origin ?? center(item.boundary),
            )
            const Icon = icons[item.category]
            return (
              <AttractionItemList
                key={item.id}
                selected={item.id === selectedAttractionId}
                color={item.color}
                name={item.name}
                description={item.description}
                category={t(`categories.${item.category}`)}
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
