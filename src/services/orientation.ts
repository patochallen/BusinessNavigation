import { useEffect, useState } from "react";
import type { LocationPermission } from "../domain/types";

type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type PermissionCapableOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function useDeviceHeading(enabled = true) {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<LocationPermission>("idle");
  const supported =
    typeof window !== "undefined" && "DeviceOrientationEvent" in window;

  const enable = async () => {
    if (
      !enabled ||
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      setPermission("unavailable");
      return;
    }
    const orientation = DeviceOrientationEvent as PermissionCapableOrientation;
    if (orientation.requestPermission) {
      setPermission("requesting");
      const result = await orientation.requestPermission();
      if (result !== "granted") {
        setPermission("denied");
        return;
      }
    }
    setPermission("ready");
  };

  useEffect(() => {
    if (!enabled || !supported) return;
    const onOrientation = (event: CompassEvent) => {
      const rawHeading =
        event.webkitCompassHeading ??
        (event.alpha === null ? null : 360 - event.alpha);
      if (rawHeading !== null) setHeading((rawHeading + 360) % 360);
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [enabled, supported]);

  return {
    heading,
    permission: enabled && !supported ? "unavailable" : permission,
    enable,
  };
}
