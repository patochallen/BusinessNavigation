import { ArrowLeft, LocateFixed, Navigation } from "lucide-react";
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
  routeDistanceInMeters,
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
  locate: () => void;
  onBack: () => void;
};

export function NavigationView({
  business,
  selected,
  position,
  permission,
  errorMessage,
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
  const routeDistance = routeDistanceInMeters(
    routePoints,
    business.mapScaleMeters,
  );
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
    </section>
  );
}
