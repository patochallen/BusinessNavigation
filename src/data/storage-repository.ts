import { Euler, Vector2, type EulerOrder } from 'three'
import type { Coordinate } from '../domain/types'

export const LOCATION_OFFSET_DEFAULT = new Vector2(0, 0)
export const HEADING_OFFSET_DEFAULT = 0
export const OPACITY_DEFAULT = 1

export const CAMERA_FOV_DEFAULT = 60
export const CAMERA_HEIGHT_DEFAULT = 1.8
export const CAMERA_ROTATION_DEFAULT = new Euler(0, 0, 0, 'XYZ')

export type StateSnapshot = {
  timestamp?: number
  date?: number
  position: Vector2
  cameraFov: number
  cameraHeight: number
  cameraRotation: Euler
}

export type StoredSnapshot = {
  id?: string
  createdAt?: number
  position: Vector2
  cameraFov: number
  cameraHeight: number
  cameraRotation: Euler
  image: Blob
}

export type SettingsSnapshot = {
  location: Coordinate | null
  locationOffset: Vector2
  headingOffset: number
  opacity: number
  cameraFov: number
  cameraHeight: number
  cameraRotation: Euler
}

export class Settings {
  private static instance: Settings | null = null
  private _location: Coordinate | null
  private _locationOffset: Vector2
  private _headingOffset: number
  private _cameraFov: number
  private _cameraRotation: Euler
  private _cameraHeight: number
  private _opacity: number
  private constructor() {
    this._location = LocationStorage.getLocation()
    this._locationOffset = LocationStorage.getLocationOffset()
    this._headingOffset = LocationStorage.getHeadingOffset()
    this._cameraFov = LocationStorage.getCameraFov()
    this._cameraRotation = LocationStorage.getCameraRotation()
    this._cameraHeight = LocationStorage.getCameraHeight()
    this._opacity = LocationStorage.getOpacity()
  }

  get location(): Coordinate | null {
    return this._location
  }
  get locationOffset(): Vector2 {
    return this._locationOffset
  }
  get headingOffset(): number {
    return this._headingOffset
  }
  get cameraFov(): number {
    return this._cameraFov
  }
  get cameraRotation(): Euler {
    return this._cameraRotation
  }
  get cameraHeight(): number {
    return this._cameraHeight
  }
  get opacity(): number {
    return this._opacity
  }

  static getInstance(): Settings {
    if (!Settings.instance) {
      Settings.instance = new Settings()
    }
    return Settings.instance
  }

  clear() {
    LocationStorage.clear()
  }

  setLocation(location: Coordinate) {
    LocationStorage.setLocation(location)
    this._location = location
  }
  setLocationOffset(offset: Vector2) {
    LocationStorage.setLocationOffset(offset)
    this._locationOffset = offset
  }
  setHeadingOffset(offset: number) {
    LocationStorage.setHeadingOffset(offset)
    this._headingOffset = offset
  }
  setCameraFov(fov: number) {
    LocationStorage.setCameraFov(fov)
    this._cameraFov = fov
  }
  setCameraRotation(rotation: Euler) {
    LocationStorage.setCameraRotation(rotation)
    this._cameraRotation = rotation
  }
  setCameraHeight(height: number) {
    LocationStorage.setCameraHeight(height)
    this._cameraHeight = height
  }
  setOpacity(opacity: number) {
    LocationStorage.setOpacity(opacity)
    this._opacity = opacity
  }

  removeLocation() {
    LocationStorage.removeLocation()
    this._location = null
  }
  removeLocationOffset() {
    LocationStorage.removeLocationOffset()
    this._locationOffset = LOCATION_OFFSET_DEFAULT
  }
  removeHeadingOffset() {
    LocationStorage.removeHeadingOffset()
    this._headingOffset = HEADING_OFFSET_DEFAULT
  }
  removeCameraFov() {
    LocationStorage.removeCameraFov()
    this._cameraFov = CAMERA_FOV_DEFAULT
  }
  removeCameraHeight() {
    LocationStorage.removeCameraHeight()
    this._cameraHeight = CAMERA_HEIGHT_DEFAULT
  }
  removeOpacity() {
    LocationStorage.removeOpacity()
    this._opacity = OPACITY_DEFAULT
  }
  removeCameraRotation() {
    LocationStorage.removeCameraRotation()
    this._cameraRotation = CAMERA_ROTATION_DEFAULT
  }

  getSnapshot(): SettingsSnapshot {
    return {
      location: this._location,
      locationOffset: this._locationOffset,
      headingOffset: this._headingOffset,
      opacity: this._opacity,
      cameraFov: this._cameraFov,
      cameraHeight: this._cameraHeight,
      cameraRotation: this._cameraRotation,
    }
  }
}

export const StorageRepository = {
  getItem: (key: string) => {
    return localStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value)
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
  },
  clear: () => {
    localStorage.clear()
  },
}

// JSON preserves the components of Three.js objects, but not their prototypes.
const reviveSnapshotValue = (key: string, value: unknown): unknown => {
  if (key !== 'position' && key !== 'locationOffset' && key !== 'cameraRotation') return value
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Invalid stored snapshot ${key}`)
  }

  const component = (name: string): number => {
    const number = name in value ? Reflect.get(value, name) : undefined
    if (typeof number !== 'number' || !Number.isFinite(number)) {
      throw new Error(`Invalid stored snapshot ${key}.${name}`)
    }
    return number
  }

  if (key !== 'cameraRotation') return new Vector2(component('x'), component('y'))

  // Euler serializes its internal properties (_x, _y, _z, _order).
  const order = Reflect.get(value, '_order') ?? Reflect.get(value, 'order')
  if (
    order !== 'XYZ' &&
    order !== 'YXZ' &&
    order !== 'ZXY' &&
    order !== 'ZYX' &&
    order !== 'YZX' &&
    order !== 'XZY'
  ) {
    throw new Error(`Invalid stored snapshot camera rotation order: ${order}`)
  }
  return new Euler(
    component('_x' in value ? '_x' : 'x'),
    component('_y' in value ? '_y' : 'y'),
    component('_z' in value ? '_z' : 'z'),
    order,
  )
}

export const LocationStorage = {
  setLocation: (location: Coordinate) =>
    StorageRepository.setItem('location', JSON.stringify(location)),
  setLocationOffset: (offset: Vector2) =>
    StorageRepository.setItem('locationOffset', offset.toArray().toString()),
  setHeadingOffset: (offset: number) =>
    StorageRepository.setItem('headingOffset', offset.toString()),
  setOpacity: (opacity: number) => StorageRepository.setItem('opacity', opacity.toString()),
  setCameraFov: (fov: number) => StorageRepository.setItem('cameraFov', fov.toString()),
  setCameraHeight: (height: number) => StorageRepository.setItem('cameraHeight', height.toString()),
  setCameraRotation: (rotation: Euler) =>
    StorageRepository.setItem('cameraRotation', rotation.toArray().toString()),

  getLocation: (): Coordinate | null => {
    const location = StorageRepository.getItem('location')
    return location ? JSON.parse(location) : null
  },
  getLocationOffset: (): Vector2 => {
    const offset = StorageRepository.getItem('locationOffset')
    return offset ? new Vector2(...offset.split(',').map(parseFloat)) : LOCATION_OFFSET_DEFAULT
  },
  getHeadingOffset: (): number => {
    const offset = StorageRepository.getItem('headingOffset')
    return offset ? parseFloat(offset) : HEADING_OFFSET_DEFAULT
  },
  getOpacity: (): number => {
    const opacity = StorageRepository.getItem('opacity')
    return opacity ? parseFloat(opacity) : OPACITY_DEFAULT
  },
  getCameraHeight: (): number => {
    const height = StorageRepository.getItem('cameraHeight')
    return height ? parseFloat(height) : CAMERA_HEIGHT_DEFAULT
  },
  getCameraFov: (): number => {
    const fov = StorageRepository.getItem('cameraFov')
    return fov ? parseFloat(fov) : CAMERA_FOV_DEFAULT
  },
  getCameraRotation: (): Euler => {
    const rotation = StorageRepository.getItem('cameraRotation')
    if (!rotation) return CAMERA_ROTATION_DEFAULT

    const [x, y, z, w] = rotation.split(',')
    let order: EulerOrder
    switch (w) {
      case 'XYZ':
        order = 'XYZ'
        break
      case 'YXZ':
        order = 'YXZ'
        break
      case 'ZXY':
        order = 'ZXY'
        break
      case 'ZYX':
        order = 'ZYX'
        break
      case 'YZX':
        order = 'YZX'
        break
      case 'XZY':
        order = 'XZY'
        break
      default:
        throw new Error(`Invalid stored camera rotation order: ${w}`)
    }
    return new Euler(parseFloat(x), parseFloat(y), parseFloat(z), order)
  },

  removeLocation: () => StorageRepository.removeItem('location'),
  removeLocationOffset: () => StorageRepository.removeItem('locationOffset'),
  removeHeadingOffset: () => StorageRepository.removeItem('headingOffset'),
  removeOpacity: () => StorageRepository.removeItem('opacity'),
  removeCameraFov: () => StorageRepository.removeItem('cameraFov'),
  removeCameraHeight: () => StorageRepository.removeItem('cameraHeight'),
  removeCameraRotation: () => StorageRepository.removeItem('cameraRotation'),

  addSnapshot: (snapshot: SettingsSnapshot) => {
    const snapshots = StorageRepository.getItem('snapshots')
    const snapshotArray = snapshots ? JSON.parse(snapshots) : []
    snapshotArray.push(snapshot)
    StorageRepository.setItem('snapshots', JSON.stringify(snapshotArray))
  },
  getSnapshots: (): SettingsSnapshot[] => {
    const snapshots = StorageRepository.getItem('snapshots')
    return snapshots ? JSON.parse(snapshots, reviveSnapshotValue) : []
  },
  removeSnapshots: () => StorageRepository.removeItem('snapshots'),
  addStateSnapshot: (snapshot: StateSnapshot) => {
    const snapshots = StorageRepository.getItem('stateSnapshots')
    const snapshotArray = snapshots ? JSON.parse(snapshots) : []
    snapshot.timestamp = Date.now()
    snapshot.date = new Date().getTime()
    snapshotArray.push(snapshot)
    StorageRepository.setItem('stateSnapshots', JSON.stringify(snapshotArray))
  },
  getStateSnapshots: (): StateSnapshot[] => {
    const snapshots = StorageRepository.getItem('stateSnapshots')
    return snapshots ? JSON.parse(snapshots, reviveSnapshotValue) : []
  },
  removeStateSnapshot: (index: number) => {
    const stored = StorageRepository.getItem('stateSnapshots')
    const snapshots: unknown = stored ? JSON.parse(stored) : []
    if (
      !Array.isArray(snapshots) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= snapshots.length
    ) {
      throw new Error(`Invalid state snapshot index: ${index}`)
    }
    snapshots.splice(index, 1)
    StorageRepository.setItem('stateSnapshots', JSON.stringify(snapshots))
  },
  removeStateSnapshots: () => StorageRepository.removeItem('stateSnapshots'),
  clear: () => {
    StorageRepository.removeItem('location')
    StorageRepository.removeItem('locationOffset')
    StorageRepository.removeItem('headingOffset')
    StorageRepository.removeItem('opacity')
    StorageRepository.removeItem('cameraFov')
    StorageRepository.removeItem('cameraHeight')
    StorageRepository.removeItem('cameraRotation')
    StorageRepository.removeItem('snapshots')
    StorageRepository.removeItem('stateSnapshots')
  },
}

const SNAPSHOT_STORE = 'snapshots'

const openSnapshotDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }

    const request = indexedDB.open('BusinessNavigationSnapshots', 1)
    let blocked = false
    request.onupgradeneeded = () => {
      // Auto-incremented keys preserve insertion order, independently of timestamps.
      const store = request.result.createObjectStore(SNAPSHOT_STORE, { autoIncrement: true })
      store.createIndex('id', 'id', { unique: true })
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      blocked = true
      reject(new Error('Snapshot database upgrade is blocked by another tab.'))
    }
    request.onsuccess = () => {
      const database = request.result
      if (blocked) {
        database.close()
        return
      }
      database.onversionchange = () => database.close()
      resolve(database)
    }
  })

const withSnapshotStore = async <T>(
  mode: IDBTransactionMode,
  operation: (
    store: IDBObjectStore,
    resolve: (value: T) => void,
    reject: (error: Error | DOMException) => void,
  ) => void,
): Promise<T> => {
  const database = await openSnapshotDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(SNAPSHOT_STORE, mode)
      let result: T
      let failure: Error | DOMException | null = null
      transaction.oncomplete = () => resolve(result)
      transaction.onabort = () =>
        reject(failure ?? transaction.error ?? new Error('Snapshot transaction was aborted.'))

      const fail = (error: Error | DOMException) => {
        failure = error
        transaction.abort()
      }

      try {
        operation(
          transaction.objectStore(SNAPSHOT_STORE),
          (value) => {
            result = value
          },
          fail,
        )
      } catch (error) {
        fail(error instanceof Error ? error : new Error('Snapshot operation failed.'))
      }
    })
  } finally {
    database.close()
  }
}

export const SnapshotRepository = {
  /** Persists the image and snapshot together; resolves only after the transaction commits. */
  addStoredSnapshot: (snapshot: StoredSnapshot): Promise<void> =>
    withSnapshotStore<void>('readwrite', (store, resolve) => {
      const request = store.add({
        ...snapshot,
        id: snapshot.id ?? crypto.randomUUID(),
        createdAt: snapshot.createdAt ?? Date.now(),
      })
      request.onsuccess = () => resolve(undefined)
    }),

  /** Returns snapshots in insertion order, with images restored as Blobs. */
  getStoredSnapshots: (): Promise<StoredSnapshot[]> =>
    withSnapshotStore<StoredSnapshot[]>('readonly', (store, resolve) => {
      const request: IDBRequest<StoredSnapshot[]> = store.getAll()
      request.onsuccess = () => resolve(request.result)
    }),

  /** Removes only the entry at this index in insertion order. */
  removeStoredSnapshot: (index: number): Promise<void> =>
    withSnapshotStore<void>('readwrite', (store, resolve, reject) => {
      if (!Number.isInteger(index) || index < 0) {
        reject(new Error(`Invalid stored snapshot index: ${index}`))
        return
      }
      const request = store.openCursor()
      let currentIndex = 0
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) {
          reject(new Error(`Invalid stored snapshot index: ${index}`))
          return
        }
        if (currentIndex === index) {
          const deletion = cursor.delete()
          deletion.onsuccess = () => resolve(undefined)
        } else {
          currentIndex += 1
          cursor.continue()
        }
      }
    }),

  /** Clears snapshots and images without touching other application settings. */
  removeStoredSnapshots: (): Promise<void> =>
    withSnapshotStore<void>('readwrite', (store, resolve) => {
      const request = store.clear()
      request.onsuccess = () => resolve(undefined)
    }),
}
