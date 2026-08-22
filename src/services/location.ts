import { useState } from "react";
import type { Attraction, LocationPermission } from "../domain/types";

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

export function distanceInMeters(
  position: GeolocationPosition | null,
  attraction: Attraction,
) {
  if (!position) return null;
  const metersPerDegree = 111_320;
  const dx = position.coords.longitude * metersPerDegree - attraction.x * 10;
  const dz = position.coords.latitude * metersPerDegree - attraction.z * 10;
  return Math.round(Math.sqrt(dx * dx + dz * dz));
}
