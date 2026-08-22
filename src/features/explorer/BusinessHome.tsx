import {
  Compass,
  Crosshair,
  LocateFixed,
  MapPin,
  Search,
  Utensils,
  Waves,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Business, Category } from "../../domain/types";
import { categoryLabels } from "../../domain/demo-data";
import { filterAttractions } from "../../domain/use-cases";
import { MapScene } from "../map/MapScene";

type BusinessHomeProps = {
  business: Business;
  permission: string;
  selectedAttractionId?: string;
  locate: () => void;
};
const icons: Record<Category, typeof Compass> = {
  food: Utensils,
  adventure: Zap,
  services: Crosshair,
  nature: Waves,
};

export function BusinessHome({
  business,
  permission,
  selectedAttractionId,
  locate,
}: BusinessHomeProps) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(selectedAttractionId ?? "punto-encuentro");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [query, setQuery] = useState("");
  const selected =
    business.attractions.find((item) => item.id === selectedId) ??
    business.attractions[0];
  const filtered = useMemo(
    () => filterAttractions(business.attractions, category, query),
    [business.attractions, category, query],
  );
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
          <span>Abierto hoy</span>
        </div>
      </section>
      <section className="map-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Mapa del predio</p>
            <h2>Tu próxima pausa</h2>
          </div>
          <button className="outline-button" onClick={locate}>
            <LocateFixed size={16} />{" "}
            {permission === "ready" ? "Ubicación activa" : "Ubicarme"}
          </button>
        </div>
        <div className="map-frame">
          <MapScene
            attractions={business.attractions}
            selectedId={selected?.id}
            centerOnSelected={Boolean(selectedAttractionId)}
            onSelect={setSelectedId}
            userActive={permission === "ready"}
          />
          <div className="map-label label-top">MIRADOR NORTE</div>
          <div className="map-label label-bottom">ENTRADA PRINCIPAL</div>
          <div className="map-legend">
            <span className="legend-dot" /> {business.attractions.length} puntos
            de interés
          </div>
          <button className="north-button" aria-label="Norte">
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
            className={category === "all" ? "category active" : "category"}
            onClick={() => setCategory("all")}
          >
            Todos
          </button>
          {(Object.keys(categoryLabels) as Category[]).map((key) => {
            const Icon = icons[key];
            return (
              <button
                key={key}
                className={category === key ? "category active" : "category"}
                onClick={() => setCategory(key)}
              >
                <Icon size={15} />
                {categoryLabels[key]}
              </button>
            );
          })}
        </div>
        <div className="attraction-list">
          {filtered.map((item) => {
            const Icon = icons[item.category];
            return (
              <button
                className={`attraction-card ${selected?.id === item.id ? "selected" : ""}`}
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  navigate(`/b/${business.id}/a/${item.id}`);
                }}
              >
                <span
                  className="attraction-icon"
                  style={{ background: item.color }}
                >
                  <Icon size={18} />
                </span>
                <span className="attraction-copy">
                  <span className="attraction-top">
                    <strong>{item.name}</strong>
                    <span className="card-arrow">↗</span>
                  </span>
                  <span>{item.description}</span>
                  <span className="attraction-meta">
                    <span>{categoryLabels[item.category]}</span>
                    <span>•</span>
                    <span>{item.eta} a pie</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
