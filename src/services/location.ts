import { useState } from "react";
import type {
  Attraction,
  Business,
  Coordinate,
  LocationPermission,
  MapPoint,
} from "../domain/types";
import {
  distanceBetweenPoints,
  localPointFromGps,
} from "../domain/use-cases";

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
  return localPointFromGps(origin, coordinate, 1);
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
  return distanceBetweenPoints(userPoint, attraction.position, business.mapScaleMeters);
}
