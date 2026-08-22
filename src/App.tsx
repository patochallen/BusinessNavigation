import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Search } from "lucide-react";
import "./App.css";
import { demoBusinessRepository } from "./domain/business-repository";
import { useGeolocation } from "./services/location";
import { BusinessHome } from "./features/explorer/BusinessHome";
import { AttractionDetail } from "./features/explorer/AttractionDetail";
import { NavigationView } from "./features/navigation/NavigationView";

function AppContent() {
  const { businessId, attractionId } = useParams<{
    businessId: string;
    attractionId?: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const business = businessId
    ? demoBusinessRepository.findById(businessId)
    : undefined;
  const { position, permission, errorMessage, locate } = useGeolocation();
  const attraction =
    business && attractionId
      ? demoBusinessRepository.findAttraction(business, attractionId)
      : business?.attractions[0];
  const isNavigation = location.pathname.endsWith("/navigate");

  if (!business || (attractionId && !attraction))
    return (
      <main className="not-found">
        <span className="brand-mark">VL</span>
        <h1>Este lugar no aparece en el mapa</h1>
        <p>Revisá el código QR e intentá nuevamente.</p>
        <Link className="button button-dark" to="/b/valle-lumina">
          Volver a Valle Lúmina
        </Link>
      </main>
    );

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to={`/b/${business.id}`} className="wordmark">
          <span className="brand-mark">VL</span>
          <span>Valle Lúmina</span>
        </Link>
        <button className="icon-button" aria-label="Buscar">
          <Search size={19} />
        </button>
      </header>
      <main>
        {isNavigation ? (
          <NavigationView
            business={business}
            selected={attraction}
            position={position}
            permission={permission}
            errorMessage={errorMessage}
            locate={locate}
            onBack={() =>
              navigate(`/b/${business.id}/a/${attraction?.id ?? ""}`)
            }
          />
        ) : attractionId && attraction ? (
          <AttractionDetail business={business} attraction={attraction} />
        ) : (
          <BusinessHome
            business={business}
            permission={permission}
            locate={locate}
          />
        )}
      </main>
      <footer>
        <span>Valle Lúmina</span>
        <span>Tu mapa, tu ritmo.</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/b/:businessId" element={<AppContent />} />
        <Route path="/b/:businessId/a/:attractionId" element={<AppContent />} />
        <Route
          path="/b/:businessId/a/:attractionId/navigate"
          element={<AppContent />}
        />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
