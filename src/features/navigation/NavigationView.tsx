import { ArrowLeft, LocateFixed, Navigation } from "lucide-react";
import type {
  Attraction,
  Business,
  LocationPermission,
} from "../../domain/types";
import { distanceInMeters } from "../../services/location";
import { MapScene } from "../map/MapScene";

type NavigationViewProps = {
  business: Business;
  selected?: Attraction;
  position: GeolocationPosition | null;
  permission: LocationPermission;
  locate: () => void;
  onBack: () => void;
};

export function NavigationView({
  business,
  selected,
  position,
  permission,
  locate,
  onBack,
}: NavigationViewProps) {
  return (
    <section className="navigation-view">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={17} /> Volver al mapa
      </button>
      <div className="navigation-title">
        <p className="eyebrow">Navegando hacia</p>
        <h1>{selected?.name ?? "un destino"}</h1>
        <span className="destination-tag" style={{ color: selected?.color }}>
          {selected?.tag}
        </span>
      </div>
      <div className="route-card">
        <div className="route-map">
          <MapScene
            attractions={business.attractions}
            selectedId={selected?.id}
            onSelect={() => undefined}
            userActive={permission === "ready"}
          />
          <div className="route-line" />
        </div>
        <div className="route-stats">
          <div>
            <strong>
              {position && selected
                ? `${distanceInMeters(position, selected)} m`
                : "—"}
            </strong>
            <span>distancia estimada</span>
          </div>
          <div>
            <strong>{selected?.eta ?? "—"}</strong>
            <span>caminando</span>
          </div>
        </div>
        {permission !== "ready" && (
          <div className="permission-box">
            <LocateFixed size={20} />
            <div>
              <strong>Activá tu ubicación</strong>
              <p>Para actualizar la distancia en tiempo real.</p>
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
