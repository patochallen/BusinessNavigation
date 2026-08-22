import { useState } from "react";
import type {
  Attraction,
  Business,
  Coordinate,
  LocationPermission,
  MapPoint,
} from "../domain/types";

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [permission, setPermission] = useState<LocationPermission>("idle");

  const locate = () => {
    if (!navigator.geolocation) {
      setPermission("unavailable");
      return;
    }
    setPermission("requesting");
    navigator.geolocation.getCurrentPosition(
      (next) => {
        setPosition(next);
        setPermission("ready");
      },
      () => setPermission("denied"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return { position, permission, locate };
}

export function gpsToLocalMeters(
  origin: Coordinate,
  coordinate: Coordinate,
): MapPoint {
  const metersPerDegreeLatitude = 111_320;
  const metersPerDegreeLongitude =
    metersPerDegreeLatitude * Math.cos((origin.latitude * Math.PI) / 180);

  return {
    x: (coordinate.longitude - origin.longitude) * metersPerDegreeLongitude,
    z: -(coordinate.latitude - origin.latitude) * metersPerDegreeLatitude,
  };
}

export function distanceInMeters(
  position: GeolocationPosition | null,
  business: Business,
  attraction: Attraction,
) {
  if (!position) return null;
  const userPoint = gpsToLocalMeters(business.mapOrigin, {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  const dx = userPoint.x - attraction.position.x * business.mapScaleMeters;
  const dz = userPoint.z - attraction.position.z * business.mapScaleMeters;
  return Math.round(Math.sqrt(dx * dx + dz * dz));
}
