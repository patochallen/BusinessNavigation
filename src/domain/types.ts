export type Category = "food" | "adventure" | "services" | "nature";

export type Attraction = {
  id: string;
  name: string;
  category: Category;
  description: string;
  x: number;
  z: number;
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
  attractions: Attraction[];
};

export type LocationPermission =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable";
