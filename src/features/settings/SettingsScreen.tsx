import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Euler, PerspectiveCamera, Vector2, Vector3 } from 'three'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'
import { useSettings } from '../../data/useSettings'
import {
  LOCATION_OFFSET_DEFAULT,
  HEADING_OFFSET_DEFAULT,
  OPACITY_DEFAULT,
  CAMERA_FOV_DEFAULT,
  CAMERA_HEIGHT_DEFAULT,
  CAMERA_ROTATION_DEFAULT,
  LocationStorage,
  Settings,
  SnapshotRepository,
} from '../../data/storage-repository'
import './SettingsScreen.css'
import { IconButton } from '../layout/IconButton'
import { LocationEditIcon, Settings2Icon, TargetIcon } from 'lucide-react'
import { type SceneObject } from '../../domain/scene-model'
import { Canvas } from '@react-three/fiber'
import { SceneModelView } from '../map/SceneModelView'
import { toV3 } from '../../utils/utils'
import { SnapshotList } from './snapshots/SnapshotList'
import { MapSync } from './MapSync'

import { FirstPersonView } from './FirstPersonView'

export const SettingsIdle = ({
  scene,
  pos,
  offset,
  heading,
  opacity,
  fov,
  height,
  rotation,
}: {
  scene: SceneObject
  offset: Vector2
  pos: Vector3
  heading: number
  opacity: number
  fov: number
  height: number
  rotation: Euler
}) => {
  const camera = useMemo(() => {
    const cam = new PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.5, 2000)
    cam.position.set(0, height, 0)
    return cam
  }, [height, fov])
  const offsetPosition = useMemo(() => pos.clone().sub(toV3(offset)), [pos, offset])

  useEffect(() => {
    scene.setSceneOpacity(opacity)
    return () => scene.setSceneOpacity(1)
  }, [opacity])

  useEffect(() => {
    camera.rotation.copy(rotation)
  }, [rotation])

  useEffect(() => {
    camera.rotation.y = heading
  }, [heading])

  return (
    <div className="content">
      <Canvas camera={camera}>
        <directionalLight position={[1, 3, 1]} intensity={5} color="#fff" />
        <directionalLight position={[-1, 3, -1]} intensity={5} color="#fff" />
        <SceneModelView scene={scene} position={offsetPosition} />
        <mesh position={scene.getPosition()}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <mesh position={pos}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="violet" />
        </mesh>
        {/* <OrbitControls /> */}
      </Canvas>
      <div className="position-marker" />
    </div>
  )
}

export const SettingsApp = ({ scene, position }: { scene: SceneObject; position: Vector3 }) => {
  const [showSettings, setShowSettings] = useState(false)
  const [showSnapshotList, setShowSnapshotList] = useState(false)
  const [showIdle, setShowIdle] = useState(false)
  const [, setSettingsVersion] = useState(0)
  const settings = useSettings()
  return <FirstPersonView scene={scene} position={position} />
  return showSnapshotList ? (
    <SnapshotList scene={scene} onClose={() => setShowSnapshotList(false)} />
  ) : showIdle ? (
    <MapSync
      scene={scene}
      initialPosition={position}
      initialFov={settings.cameraFov}
      initialHeight={settings.cameraHeight}
      initialOpacity={settings.opacity}
      onSave={async (snapshot) => {
        try {
          await SnapshotRepository.addStoredSnapshot(snapshot)
          setShowIdle(false)
        } catch (error) {
          // Mostrar el error y mantener la pantalla abierta para reintentar.
        }
      }}
      onClose={() => setShowIdle(false)}
    />
  ) : (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SettingsIdle
        scene={scene}
        pos={position}
        offset={settings.locationOffset}
        heading={settings.headingOffset}
        opacity={settings.opacity}
        fov={settings.cameraFov}
        height={settings.cameraHeight}
        rotation={settings.cameraRotation}
      />
      <SettingsScreen
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onChange={() => setSettingsVersion((v) => v + 1)}
      />
      <IconButton
        position="topRight"
        icon={<Settings2Icon />}
        onClick={() => setShowSettings(true)}
      />
      <IconButton position="topLeft" icon={<TargetIcon />} onClick={() => setShowIdle(!showIdle)} />
      {!showIdle && (
        <IconButton
          position="bottomRight"
          icon={<LocationEditIcon />}
          onClick={() => setShowSnapshotList(true)}
        />
      )}
    </div>
  )
}

interface SettingsScreenProps {
  open: boolean
  onClose: () => void
  onChange: () => void
}

type FieldConfig = {
  key: string
  label: string
  unit?: string
  min?: number
  max?: number
  step?: number
  /** Shows a slider next to the input (requires min and max). */
  slider?: boolean
  /** Can be left empty. */
  optional?: boolean
}

type SettingConfig = {
  id: string
  label: string
  fields: FieldConfig[]
  /** Current values in the same order as `fields`; null = empty. */
  read: (settings: Settings) => (number | null)[]
  write: (settings: Settings, values: (number | null)[]) => void
  format: (settings: Settings) => string
  /** localStorage key; when absent the setting is using its default value. */
  storageKey: string
  /** Removes the stored value and reloads the default from storage. */
  reset: (settings: Settings) => void
  canUseCurrentLocation?: boolean
  isCustomized: (settings: Settings) => boolean
}

const formatNumber = (value: number, digits = 2) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)).toString() : '—'

const SETTINGS: SettingConfig[] = [
  {
    id: 'location',
    label: 'Location',
    storageKey: 'location',
    reset: (s) => s.removeLocation(),
    canUseCurrentLocation: true,
    fields: [
      { key: 'latitude', label: 'Latitude', unit: '°', min: -90, max: 90, step: 0.000001 },
      { key: 'longitude', label: 'Longitude', unit: '°', min: -180, max: 180, step: 0.000001 },
      { key: 'altitude', label: 'Altitude', unit: 'm', step: 0.1, optional: true },
    ],
    read: (s) => {
      const location = s.location
      return [location?.latitude ?? null, location?.longitude ?? null, location?.altitude ?? null]
    },
    write: (s, [latitude, longitude, altitude]) =>
      s.setLocation({ latitude: latitude!, longitude: longitude!, altitude }),
    format: (s) => {
      const location = s.location
      console.log('Location:', location)
      if (!location?.latitude || !location?.longitude) return 'Not set'
      const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      return location.altitude != null
        ? `${coords} · ${formatNumber(location.altitude, 1)} m`
        : coords
    },
    isCustomized: (s) => s.location !== null,
  },
  {
    id: 'locationOffset',
    label: 'Location offset',
    storageKey: 'locationOffset',
    reset: (s) => s.removeLocationOffset(),
    fields: [
      { key: 'x', label: 'X', step: 0.1 },
      { key: 'y', label: 'Y', step: 0.1 },
    ],
    read: (s) => s.locationOffset.toArray(),
    write: (s, [x, y]) => s.setLocationOffset(new Vector2(x!, y!)),
    format: (s) => {
      const { x, y } = s.locationOffset
      return `X ${formatNumber(x)} · Y ${formatNumber(y)}`
    },
    isCustomized: (s) => !s.locationOffset.equals(LOCATION_OFFSET_DEFAULT),
  },
  {
    id: 'headingOffset',
    label: 'Heading offset',
    storageKey: 'headingOffset',
    reset: (s) => s.removeHeadingOffset(),
    fields: [
      { key: 'heading', label: 'Offset', unit: '°', min: -180, max: 180, step: 1, slider: true },
    ],
    read: (s) => [s.headingOffset],
    write: (s, [heading]) => s.setHeadingOffset(heading!),
    format: (s) => `${formatNumber(s.headingOffset, 1)}°`,
    isCustomized: (s) => s.headingOffset !== HEADING_OFFSET_DEFAULT,
  },
  {
    id: 'opacity',
    label: 'Opacity',
    storageKey: 'opacity',
    reset: (s) => s.removeOpacity(),
    fields: [{ key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01, slider: true }],
    read: (s) => [s.opacity],
    write: (s, [opacity]) => s.setOpacity(opacity!),
    format: (s) => formatNumber(s.opacity, 2),
    isCustomized: (s) => s.opacity !== OPACITY_DEFAULT,
  },
  {
    id: 'cameraFov',
    label: 'Camera FOV',
    storageKey: 'cameraFov',
    reset: (s) => s.removeCameraFov(),
    fields: [
      { key: 'fov', label: 'Field of view', unit: '°', min: 10, max: 120, step: 1, slider: true },
    ],
    read: (s) => [s.cameraFov],
    write: (s, [fov]) => s.setCameraFov(fov!),
    format: (s) => `${formatNumber(s.cameraFov, 1)}°`,
    isCustomized: (s) => s.cameraFov !== CAMERA_FOV_DEFAULT,
  },
  {
    id: 'cameraHeight',
    label: 'Camera height',
    storageKey: 'cameraHeight',
    reset: (s) => s.removeCameraHeight(),
    fields: [
      { key: 'height', label: 'Height', unit: 'm', min: 1, max: 300, step: 1, slider: true },
    ],
    read: (s) => [s.cameraHeight],
    write: (s, [height]) => s.setCameraHeight(height!),
    format: (s) => formatNumber(s.cameraHeight),
    isCustomized: (s) => s.cameraHeight !== CAMERA_HEIGHT_DEFAULT,
  },
  {
    id: 'cameraRotation',
    label: 'Camera rotation',
    storageKey: 'cameraRotation',
    reset: (s) => s.removeCameraRotation(),
    // Stored in radians, edited in degrees.
    fields: [
      { key: 'x', label: 'X (pitch)', unit: '°', min: -180, max: 180, step: 1, slider: true },
      { key: 'y', label: 'Y (yaw)', unit: '°', min: -180, max: 180, step: 1, slider: true },
      { key: 'z', label: 'Z (roll)', unit: '°', min: -180, max: 180, step: 1, slider: true },
    ],
    read: (s) => {
      const { x, y, z } = s.cameraRotation
      return [radToDeg(x), radToDeg(y), radToDeg(z)]
    },
    write: (s, [x, y, z]) =>
      s.setCameraRotation(
        new Euler(degToRad(x!), degToRad(y!), degToRad(z!), s.cameraRotation.order || 'XYZ'),
      ),
    format: (s) => {
      const { x, y, z } = s.cameraRotation
      return `X ${formatNumber(radToDeg(x), 1)}° · Y ${formatNumber(radToDeg(y), 1)}° · Z ${formatNumber(radToDeg(z), 1)}°`
    },
    isCustomized: (s) => !s.cameraRotation.equals(CAMERA_ROTATION_DEFAULT),
  },
]

const toDraft = (values: (number | null)[]) =>
  values.map((v) => (v == null || !Number.isFinite(v) ? '' : String(Number(v.toFixed(6)))))

const validateField = (field: FieldConfig, raw: string): string | null => {
  if (raw.trim() === '') return field.optional ? null : 'Required'
  const value = Number(raw)
  if (!Number.isFinite(value)) return 'Enter a valid number'
  if (field.min != null && value < field.min) return `Min ${field.min}${field.unit ?? ''}`
  if (field.max != null && value > field.max) return `Max ${field.max}${field.unit ?? ''}`
  return null
}

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-4-4L4 16v4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface SettingEditorProps {
  config: SettingConfig
  initialValues: (number | null)[]
  onSave: (values: (number | null)[]) => void
  onUpdate: (values: (number | null)[]) => void
  onCancel: () => void
}

const SettingEditor = ({
  config,
  initialValues,
  onSave,
  onUpdate,
  onCancel,
}: SettingEditorProps) => {
  const idPrefix = useId()
  const [draft, setDraft] = useState(() => toDraft(initialValues))
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const errors = config.fields.map((field, i) => validateField(field, draft[i]))
  const isValid = errors.every((e) => e === null)

  const setValue = (index: number, value: string) => {
    console.log('Setting value at index', index, 'to', value)
    const newDraft = draft.map((v, i) => (i === index ? value : v))
    setDraft(newDraft)
    onUpdate(newDraft.map((v) => (v.trim() === '' ? null : Number(v))))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('Submitting draft:', draft, config.id)
    e.preventDefault()
    if (!isValid) {
      if (config.id === 'location') onCancel()
      return
    }
    onSave(draft.map((v) => (v.trim() === '' ? null : Number(v))))
  }

  const fillWithCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not available on this device.')
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDraft(toDraft([coords.latitude, coords.longitude, coords.altitude]))
        setLocating(false)
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied.'
            : 'Could not get your current location.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <form className="settings-editor" onSubmit={handleSubmit} noValidate>
      {config.canUseCurrentLocation && (
        <button
          type="button"
          className="settings-button settings-button-secondary settings-button-block"
          onClick={fillWithCurrentLocation}
          disabled={locating}
        >
          {locating ? 'Getting location…' : 'Use current location'}
        </button>
      )}
      {locationError && (
        <p className="settings-field-error" role="alert">
          {locationError}
        </p>
      )}

      <div className="settings-editor-fields">
        {config.fields.map((field, i) => {
          const inputId = `${idPrefix}-${field.key}`
          const errorId = `${inputId}-error`
          const showError = /* touched || */ draft[i] !== '' && errors[i]
          const numericValue = Number(draft[i])
          return (
            <div key={field.key} className="settings-field">
              <label htmlFor={inputId} className="settings-field-label">
                {field.label}
                {field.optional && <span className="settings-field-optional"> (optional)</span>}
              </label>
              <div className="settings-field-control">
                {field.slider && field.min != null && field.max != null && (
                  <input
                    type="range"
                    className="settings-range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={
                      Number.isFinite(numericValue) && draft[i] !== '' ? numericValue : field.min
                    }
                    onChange={(e) => {
                      console.log('Slider value changed:', e.target.value)
                      setValue(i, e.target.value)
                    }}
                    onChangeCapture={(e) => {
                      console.log('Slider value changed (capture):', e.target.value)
                    }}
                    aria-label={`${field.label} slider`}
                  />
                )}
                <div
                  className={`settings-input-wrapper${field.slider ? ' settings-input-compact' : ''}`}
                >
                  {/* type="number" (no inputMode) so iOS/Android keyboards include the minus sign. */}
                  <input
                    id={inputId}
                    type="number"
                    className="settings-input"
                    value={draft[i]}
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 'any'}
                    onChange={(e) => setValue(i, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    autoFocus={i === 0 && !field.slider && !config.canUseCurrentLocation}
                    aria-invalid={!!showError}
                    aria-describedby={showError ? errorId : undefined}
                  />
                  {field.unit && <span className="settings-input-unit">{field.unit}</span>}
                </div>
              </div>
              {showError && (
                <p id={errorId} className="settings-field-error">
                  {errors[i]}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <button type="submit" aria-label="Close" className="settings-modal-close">
        ✕
      </button>
    </form>
  )
}

export const SettingsScreen = ({ open, onClose, onChange }: SettingsScreenProps) =>
  // Mounted only while open, so the editing state resets every time it's closed.
  open ? <SettingsDialog onClose={onClose} onChange={onChange} /> : null

const SettingsDialog = ({
  onClose,
  onChange,
}: Pick<SettingsScreenProps, 'onClose' | 'onChange'>) => {
  const settings = useSettings()
  const [editingId, setEditingId] = useState<string | null>(null)
  // Settings is a mutable singleton, so force a re-render after saving.
  const [, setVersion] = useState(0)
  const [snapshotCount, setSnapshotCount] = useState(() => LocationStorage.getSnapshots().length)
  const [snapshotSaved, setSnapshotSaved] = useState(false)

  useEffect(() => {
    if (!snapshotSaved) return
    const timer = setTimeout(() => setSnapshotSaved(false), 2500)
    return () => clearTimeout(timer)
  }, [snapshotSaved])

  const addSnapshot = () => {
    LocationStorage.addSnapshot(settings.getSnapshot())
    setSnapshotCount(LocationStorage.getSnapshots().length)
    setSnapshotSaved(true)
  }

  const editingIdRef = useRef(editingId)
  useEffect(() => {
    editingIdRef.current = editingId
  }, [editingId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // First Escape cancels the current edit, the next one closes the popup.
      if (editingIdRef.current) setEditingId(null)
      else onClose()
    }
    // Prevent the screen behind from scrolling while the popup is open.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  // Portal to <body> so it renders above everything, regardless of where it's mounted.
  return createPortal(
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="settings-modal"
        style={{
          background: editingId !== null ? 'transparent' : undefined,
          padding: editingId !== null ? '0' : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {editingId === null && (
          <>
            <button
              type="button"
              aria-label="Close"
              className="settings-modal-close"
              onClick={onClose}
            >
              ✕
            </button>
            <h3 id="settings-title" className="settings-modal-title">
              Settings
            </h3>
          </>
        )}

        <ul className="settings-list">
          {SETTINGS.filter((config) => (editingId === null ? true : editingId === config.id)).map(
            (config) => {
              const isEditing = editingId === config.id
              const customized = config.isCustomized(settings)
              return (
                <li
                  key={config.id}
                  className={`settings-item${isEditing ? ' settings-item-editing' : ''}`}
                >
                  <div className="settings-item-header">
                    <div className="settings-item-text">
                      <span className="settings-item-label">
                        {config.label}
                        {!customized && <span className="settings-item-badge">Default</span>}
                      </span>
                      {editingId === null && (
                        <span className="settings-item-value">{config.format(settings)}</span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="settings-item-actions">
                        {customized && (
                          <button
                            type="button"
                            className="settings-icon-button settings-icon-button-danger"
                            aria-label={`Reset ${config.label} to default`}
                            title="Reset to default"
                            onClick={() => {
                              config.reset(settings)
                              setVersion((v) => v + 1)
                              onChange()
                            }}
                          >
                            <TrashIcon />
                          </button>
                        )}
                        <button
                          type="button"
                          className="settings-icon-button"
                          aria-label={`Edit ${config.label}`}
                          title="Edit"
                          aria-expanded={false}
                          onClick={() => setEditingId(config.id)}
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <SettingEditor
                      config={config}
                      initialValues={config.read(settings)}
                      onCancel={() => setEditingId(null)}
                      onUpdate={(values) => {
                        config.write(settings, values)
                        setVersion((v) => v + 1)
                        onChange()
                      }}
                      onSave={(values) => {
                        config.write(settings, values)
                        setVersion((v) => v + 1)
                        setEditingId(null)
                        onChange()
                      }}
                    />
                  )}
                </li>
              )
            },
          )}
        </ul>

        {editingId === null && (
          <section className="settings-snapshots" aria-labelledby="settings-snapshots-title">
            <div className="settings-item-text">
              <span id="settings-snapshots-title" className="settings-item-label">
                Snapshots
              </span>
              <span className="settings-item-value" role="status">
                {snapshotSaved
                  ? '✓ Snapshot added'
                  : `${snapshotCount} saved snapshot${snapshotCount === 1 ? '' : 's'}`}
              </span>
            </div>
            <button
              type="button"
              className="settings-button settings-button-primary"
              onClick={addSnapshot}
            >
              Add snapshot
            </button>
          </section>
        )}
      </div>
    </div>,
    document.body,
  )
}
