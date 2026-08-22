export type Category = "food" | "adventure" | "services" | "nature";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type MapPoint = {
  x: number;
  z: number;
};

export type Attraction = {
  id: string;
  name: string;
  category: Category;
  description: string;
  position: MapPoint;
  color: string;
  tag: string;
  eta: string;
};

export type Business = {
  id: string;
  name: string;
  location: string;
  description: string;
  eyebrow: string;
  mapOrigin: Coordinate;
  mapScaleMeters: number;
  attractions: Attraction[];
};

export type LocationPermission =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable";
