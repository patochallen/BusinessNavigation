import { ArrowLeft, Compass, LocateFixed, Navigation } from "lucide-react";
import type {
  Attraction,
  Business,
  LocationPermission,
} from "../../domain/types";
import { distanceInMeters } from "../../services/location";
import {
  distanceToNetwork,
  isOffRoute,
  localPointFromGps,
  nextRouteInstruction,
  relativeBearing,
  progressOnRoute,
  routeDistanceInMeters,
  routeDistanceToAttraction,
  routeFromCoordinate,
  routeToAttraction,
} from "../../domain/use-cases";
import { MapScene } from "../map/MapScene";

type NavigationViewProps = {
  business: Business;
  selected?: Attraction;
  position: GeolocationPosition | null;
  permission: LocationPermission;
  errorMessage: string | null;
  heading: number | null;
  headingPermission: LocationPermission;
  enableHeading: () => Promise<void>;
  locate: () => void;
  onBack: () => void;
};

export function NavigationView({
  business,
  selected,
  position,
  permission,
  errorMessage,
  heading,
  headingPermission,
  enableHeading,
  locate,
  onBack,
}: NavigationViewProps) {
  const distance =
    position && selected
      ? distanceInMeters(position, business, selected)
      : null;
  const navigationState =
    permission === "requesting"
      ? "locating"
      : permission !== "ready"
        ? "idle"
        : distance !== null && distance <= 20
          ? "arrived"
          : "navigating";
  const routePoints = selected
    ? position
      ? routeFromCoordinate(
          business,
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          selected,
        )
      : routeToAttraction(business, selected)
    : [];
  const userPoint = position
    ? localPointFromGps(
        business.mapOrigin,
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        business.mapScaleMeters,
      )
    : null;
  const routeDistance = selected
    ? (routeDistanceToAttraction(business, selected, userPoint ?? undefined) ??
      routeDistanceInMeters(routePoints, business.mapScaleMeters))
    : 0;
  const referenceRoute = selected ? routeToAttraction(business, selected) : [];
  const progress = progressOnRoute(
    referenceRoute,
    userPoint,
    business.mapScaleMeters,
  );
  const nextWaypoint = business.waypoints?.find(
    (waypoint) =>
      waypoint.position.x === progress.nextPoint?.x &&
      waypoint.position.z === progress.nextPoint?.z,
  );
  const instruction = nextRouteInstruction(
    referenceRoute,
    userPoint,
    business.mapScaleMeters,
  );
  const nextDirection = userPoint && progress.nextPoint
    ? relativeBearing(userPoint, progress.nextPoint, heading)
    : null;
  const networkDistance =
    userPoint && business.waypoints
      ? distanceToNetwork(
          business.waypoints,
          userPoint,
          business.mapScaleMeters,
        )
      : null;
  const offRoute =
    userPoint && business.waypoints
      ? isOffRoute(business.waypoints, userPoint, 30, business.mapScaleMeters)
      : false;

  return (
    <section className="navigation-view">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={17} /> Volver al mapa
      </button>
      <div className="navigation-title">
        <p className="eyebrow">
          {navigationState === "arrived"
            ? "Llegaste"
            : navigationState === "locating"
              ? "Buscando tu ubicación"
              : navigationState === "idle"
                ? "Ubicación pendiente"
                : "Navegando hacia"}
        </p>
        <h1>{selected?.name ?? "un destino"}</h1>
        <span className="destination-tag" style={{ color: selected?.color }}>
          {selected?.tag}
        </span>
      </div>
      <div className="route-card">
        <div className="route-map">
          <MapScene
            attractions={business.attractions}
            mapFeatures={business.mapFeatures}
            routePoints={routePoints}
            userPosition={routePoints[0]}
            selectedId={selected?.id}
            onSelect={() => undefined}
            userActive={permission === "ready"}
          />
        </div>
        <div className="route-stats">
          <div>
            <strong>{distance !== null ? `${distance} m` : "—"}</strong>
            <span>distancia estimada</span>
          </div>
          <div>
            <strong>{selected?.eta ?? "—"}</strong>
            <span>caminando</span>
          </div>
          <div>
            <strong>{routeDistance > 0 ? `${routeDistance} m` : "—"}</strong>
            <span>ruta por senderos</span>
          </div>
        </div>
        <div className="route-progress">
          <div className="route-progress-heading">
            <span>Progreso del recorrido</span>
            <strong>{Math.round(progress.ratio * 100)}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress.ratio * 100}%` }} />
          </div>
          <div className="route-progress-meta">
            <span>{progress.completedMeters} m recorridos</span>
            <span>{progress.remainingMeters} m restantes</span>
          </div>
          {nextWaypoint && (
            <span className="next-waypoint">
              Siguiente referencia: <strong>{nextWaypoint.id}</strong>
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
            <strong>Estás fuera del sendero</strong>
            <span>
              A {networkDistance} m de la red señalizada. Volvé al camino para
              retomar la ruta.
            </span>
          </div>
        )}
        {permission !== "ready" && (
          <div className="permission-box">
            <LocateFixed size={20} />
            <div>
              <strong>Activá tu ubicación</strong>
              <p>
                {errorMessage ?? "Para actualizar la distancia en tiempo real."}
              </p>
            </div>
            <button className="button button-dark" onClick={locate}>
              {permission === "requesting"
                ? "Solicitando..."
                : "Permitir ubicación"}
            </button>
          </div>
        )}
      </div>
      <p className="route-note">
        <Navigation size={15} /> Ruta visual directa. Seguí los senderos
        señalizados del predio.
      </p>
      <div className="heading-panel">
        <Compass
          size={20}
          className="direction-arrow"
          style={{ transform: `rotate(${nextDirection ?? 0}deg)` }}
        />
        <div>
          <strong>
            {heading === null
              ? "Brújula sin señal"
              : `${Math.round(heading)}° de orientación`}
          </strong>
          <span>
            {headingPermission === "unavailable"
              ? "Este dispositivo no informa orientación."
              : "Orientación aproximada del dispositivo."}
          </span>
        </div>
        {headingPermission !== "ready" &&
          headingPermission !== "unavailable" && (
            <button className="outline-button" onClick={enableHeading}>
              {headingPermission === "requesting"
                ? "Solicitando..."
                : "Activar brújula"}
            </button>
          )}
      </div>
    </section>
  );
}
