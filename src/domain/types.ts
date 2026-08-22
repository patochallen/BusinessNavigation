export type Category = 'food' | 'adventure' | 'services' | 'nature'

export type Coordinate = {
  latitude: number
  longitude: number
  altitude?: number | null
}

export type MapPoint = {
  x: number
  z: number
}

export type MapLabel = {
  id: string
  label: string
  position: MapPoint
}

export type MapFeature =
  | { type: 'path'; id: string; points: MapPoint[] }
  | {
      type: 'area'
      id: string
      label: string
      points: MapPoint[]
      color: string
    }
  | {
      type: 'building'
      id: string
      label: string
      position: MapPoint
      size: MapPoint
      color: string
    }

export type Waypoint = { id: string; position: MapPoint }
export type PathSegment = {
  id: string
  from: string
  to: string
  distanceInMeters: number
  accessible?: boolean
}

export type Attraction = {
  id: string
  name: string
  category: Category
  description: string
  coordinates: Coordinate
  imageUrl?: string
  iconUrl?: string
  color: string
  tag: string
  waypointId?: string
}

export type Business = {
  id: string
  name: string
  location: string
  description: string
  eyebrow: string
  statusLabel: string
  mapOrigin: Coordinate
  mapScaleMeters: number
  entryWaypointId: string
  mapLabels?: MapLabel[]
  mapFeatures?: MapFeature[]
  waypoints?: Waypoint[]
  pathSegments?: PathSegment[]
  attractions: Attraction[]
}

export type LocationPermission = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable'

export type CameraPermission = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable' | 'error'
