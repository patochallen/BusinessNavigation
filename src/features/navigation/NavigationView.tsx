import { Camera, Compass, LocateFixed, Navigation } from 'lucide-react'
import { useState } from 'react'
import type { Attraction, Business, LocationPermission } from '../../domain/types'
import { center } from '../../utils/utils'
import {
  distanceToNetwork,
  getBusinessMapWaypoints,
  isOffRoute,
  localPointFromGps,
  cameraOverlayPosition,
  nextRouteInstruction,
  relativeBearing,
  progressOnRoute,
  routeDistanceInMeters,
  routeDistanceToAttraction,
  routeFromCoordinate,
  routeToAttraction,
  walkingEtaFromDistance,
} from '../../domain/use-cases'
import { MapScene } from '../map/MapScene'
import { CameraNavigationView } from './CameraNavigationView'
import { useCameraStream } from '../../services/camera'
import './NavigationView.css'
import { getDistanceBetweenLocations } from '../../utils/location'
import { useTranslation } from 'react-i18next'

type NavigationViewProps = {
  business: Business
  selected?: Attraction
  position: GeolocationPosition | null
  permission: LocationPermission
  errorMessage: string | null
  heading: number | null
  headingPermission: LocationPermission
  enableHeading: () => Promise<void>
  calibrateHeading: () => void
  headingStable: boolean
}

export function NavigationView({
  business,
  selected,
  position,
  permission,
  errorMessage,
  heading,
  headingPermission,
  enableHeading,
  calibrateHeading,
  headingStable,
}: NavigationViewProps) {
  const { t } = useTranslation()
  const [cameraVisible, setCameraVisible] = useState(false)
  const camera = useCameraStream()
  const distance =
    position && selected
      ? getDistanceBetweenLocations(position.coords, selected.origin ?? center(selected.boundary))
      : null //distanceInMeters(position, business, selected) : null
  const navigationState =
    permission === 'requesting'
      ? 'locating'
      : permission !== 'ready'
        ? 'idle'
        : distance !== null && distance <= 20
          ? 'arrived'
          : 'navigating'
  const routePoints = selected
    ? position
      ? routeFromCoordinate(business, position.coords, selected)
      : routeToAttraction(business, selected)
    : []
  const userPoint = position ? localPointFromGps(business.mapOrigin, position.coords) : null
  const routeDistance = selected
    ? (routeDistanceToAttraction(business, selected, userPoint ?? undefined) ??
      routeDistanceInMeters(routePoints))
    : 0
  const referenceRoute = selected ? routeToAttraction(business, selected) : []
  const progress = progressOnRoute(referenceRoute, userPoint)
  const nextWaypoint = getBusinessMapWaypoints(business).find(
    (waypoint) =>
      waypoint.position.x === progress.nextPoint?.x &&
      waypoint.position.z === progress.nextPoint?.z,
  )
  const instruction = nextRouteInstruction(referenceRoute, userPoint)
  const nextDirection =
    userPoint && progress.nextPoint ? relativeBearing(userPoint, progress.nextPoint, heading) : null
  const overlayPosition = cameraOverlayPosition(nextDirection, distance)
  const networkDistance =
    userPoint && business.waypoints
      ? distanceToNetwork(getBusinessMapWaypoints(business), userPoint)
      : null
  const offRoute =
    userPoint && business.waypoints
      ? isOffRoute(getBusinessMapWaypoints(business), userPoint, 30)
      : false

  return (
    <section className="navigation-view">
      <div className="navigation-title">
        <p className="eyebrow">
          {navigationState === 'arrived'
            ? t('navigation.arrived')
            : navigationState === 'locating'
              ? t('navigation.locating')
              : navigationState === 'idle'
                ? t('navigation.pending')
                : t('navigation.headingTo')}
        </p>
        <h1>{selected?.name ?? 'un destino'}</h1>
        <span className="destination-tag" style={{ color: selected?.color }}>
          {selected?.tag}
        </span>
      </div>
      <div className="route-card">
        <div className="route-map">
          <MapScene
            business={business}
            routePoints={routePoints}
            userPosition={routePoints[0]}
            heading={heading ?? 0}
            selectedId={selected?.id}
            onSelect={() => undefined}
            userActive={permission === 'ready'}
          />
        </div>
        <div className="route-stats">
          <div>
            <strong>{distance !== null ? `${Math.round(distance)} m` : '—'}</strong>
            <span>{t('navigation.estimatedDistance')}</span>
          </div>
          <div>
            <strong>{walkingEtaFromDistance(routeDistance) ?? '—'}</strong>
            <span>{t('navigation.walking')}</span>
          </div>
          <div>
            <strong>{routeDistance > 0 ? `${routeDistance} m` : '—'}</strong>
            <span>{t('navigation.trailRoute')}</span>
          </div>
        </div>
        <div className="route-progress">
          <div className="route-progress-heading">
            <span>{t('navigation.progress')}</span>
            <strong>{Math.round(progress.ratio * 100)}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress.ratio * 100}%` }} />
          </div>
          <div className="route-progress-meta">
            <span>{t('navigation.completed', { count: progress.completedMeters })}</span>
            <span>{t('navigation.remaining', { count: progress.remainingMeters })}</span>
          </div>
          {nextWaypoint && (
            <span className="next-waypoint">
              {t('navigation.nextReference', { name: nextWaypoint.id })}
            </span>
          )}
        </div>
        {instruction && (
          <div className="route-instruction">
            <Navigation size={18} />
            <div>
              <strong>{instruction.label}</strong>
              <span>{instruction.distanceToTurn} m aproximadamente</span>
            </div>
          </div>
        )}
        {offRoute && (
          <div className="route-warning">
            <strong>{t('navigation.offRouteTitle')}</strong>
            <span>{t('navigation.offRouteDescription', { count: networkDistance })}</span>
          </div>
        )}
        {permission !== 'ready' && (
          <div className="permission-box">
            <LocateFixed size={20} />
            <div>
              <strong>
                {permission === 'requesting'
                  ? t('navigation.locating')
                  : t('navigation.locationUnavailable')}
              </strong>
              <p>{errorMessage ?? t('navigation.locationFallback')}</p>
            </div>
          </div>
        )}
      </div>
      <p className="route-note">
        <Navigation size={15} /> {t('navigation.directRoute')}
      </p>
      <div className="heading-panel">
        <Compass
          size={20}
          className="direction-arrow"
          style={{ transform: `rotate(${nextDirection ?? 0}deg)` }}
        />
        <div>
          <strong>
            {heading === null ? t('navigation.compassNoSignal') : `${Math.round(heading)}°`}
          </strong>
          <span>
            {headingPermission === 'unavailable'
              ? t('navigation.noOrientation')
              : heading === null
                ? t('navigation.activateCompassDescription')
                : headingStable
                  ? t('navigation.stableOrientation')
                  : t('navigation.stabilizeOrientation')}
          </span>
        </div>
        {headingPermission !== 'ready' && headingPermission !== 'unavailable' ? (
          <button className="outline-button" onClick={enableHeading}>
            {headingPermission === 'requesting'
              ? t('camera.requesting')
              : t('navigation.activateCompass')}
          </button>
        ) : headingPermission === 'ready' ? (
          <button className="outline-button" onClick={calibrateHeading}>
            {t('navigation.calibrate')}
          </button>
        ) : null}
      </div>
      {cameraVisible ? (
        <CameraNavigationView
          stream={camera.stream}
          permission={camera.permission}
          errorMessage={camera.errorMessage}
          attraction={selected}
          direction={nextDirection}
          distanceMeters={distance}
          overlayPosition={overlayPosition}
          onStart={camera.start}
          onStop={() => {
            camera.stop()
            setCameraVisible(false)
          }}
        />
      ) : (
        <button className="camera-launch" onClick={() => setCameraVisible(true)}>
          <Camera size={17} /> {t('navigation.camera')}
        </button>
      )}
    </section>
  )
}
