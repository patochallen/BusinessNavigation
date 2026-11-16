import { useEffect } from 'react'
import './ControlsView.css'
import {
  CameraIcon,
  ChartSplineIcon,
  CheckIcon,
  LocateIcon,
  LocateOffIcon,
  Move3dIcon,
  MoveVertical,
  PointerIcon,
  PointerOffIcon,
  RotateCcw,
  SettingsIcon,
  Trash2Icon,
  X,
} from 'lucide-react'
import {
  CAMERA_HEIGHT_DEFAULT,
  CAMERA_FOV_DEFAULT,
  HEADING_OFFSET_DEFAULT,
  LOCATION_OFFSET_DEFAULT,
  OPACITY_DEFAULT,
  MANUAL_ORIENTATION_DEFAULT,
  type Settings,
  LOCATION_ENABLED_DEFAULT,
} from '../../data/storage-repository'
import { GestureControls } from './GestureControls'
import { Vector2 } from 'three'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'

export type GestureMode = 'displacement' | 'rotation' | 'toggle'

export type ControlsConfig = {
  label: string
  read: (settings: Settings) => string
  write: (settings: Settings, value: Vector2) => void
  reset: (settings: Settings) => void
  icon: (settings: Settings) => React.ReactNode
  default: string
  hasChanged: (settings: Settings) => boolean
  mode: GestureMode
}

export const Controls: ControlsConfig[] = [
  {
    label: 'Location Enabled',
    read: (settings) => (settings.locationEnabled ? 'On' : 'Off'),
    write: (settings) => settings.setLocationEnabled(!settings.locationEnabled),
    reset: (settings) => settings.removeLocationEnabled(),
    icon: (settings) => (settings.locationEnabled ? <LocateIcon /> : <LocateOffIcon />),
    default: LOCATION_ENABLED_DEFAULT ? 'On' : 'Off',
    hasChanged: (settings) => settings.locationEnabled !== LOCATION_ENABLED_DEFAULT,
    mode: 'toggle',
  },
  {
    label: 'Manual Orientation',
    read: (settings) => `${settings.manualOrientation ? 'On' : 'Off'}`,
    write: (settings) => settings.setManualOrientation(!settings.manualOrientation),
    reset: (settings) => settings.removeManualOrientation(),
    icon: (settings) => (settings.manualOrientation ? <PointerIcon /> : <PointerOffIcon />),
    default: MANUAL_ORIENTATION_DEFAULT ? 'On' : 'Off',
    hasChanged: (settings) => settings.manualOrientation !== MANUAL_ORIENTATION_DEFAULT,
    mode: 'toggle',
  },
  {
    label: 'Location Offset',
    read: (settings) =>
      `(${settings.locationOffset.x.toFixed()}, ${settings.locationOffset.y.toFixed()})`,
    write: (settings, value) =>
      settings.setLocationOffset(settings.locationOffset.clone().add(value.multiplyScalar(0.05))),
    reset: (settings) => settings.removeLocationOffset(),
    icon: () => <Move3dIcon />,
    default: `(${LOCATION_OFFSET_DEFAULT.x.toFixed()}, ${LOCATION_OFFSET_DEFAULT.y.toFixed()})`,
    hasChanged: (settings) => !settings.locationOffset.equals(LOCATION_OFFSET_DEFAULT),
    mode: 'displacement',
  },
  {
    label: 'Heading Offset',
    read: (settings) => `${radToDeg(settings.headingOffset).toFixed()}º`,
    write: (settings, value) =>
      settings.setHeadingOffset(
        Math.max(-Math.PI, Math.min(Math.PI, settings.headingOffset + degToRad(value.x))),
      ),
    reset: (settings) => settings.removeHeadingOffset(),
    icon: () => <RotateCcw />,
    default: `${HEADING_OFFSET_DEFAULT.toFixed()}º`,
    hasChanged: (settings) => settings.headingOffset !== HEADING_OFFSET_DEFAULT,
    mode: 'rotation',
  },
  {
    label: 'Opacity',
    read: (settings) => `${settings.opacity.toFixed(2)}`,
    write: (settings, value) =>
      settings.setOpacity(Math.min(1, Math.max(0, settings.opacity + value.x * -0.005))),
    reset: (settings) => settings.removeOpacity(),
    icon: () => <ChartSplineIcon />,
    default: `${OPACITY_DEFAULT.toFixed(2)}`,
    hasChanged: (settings) => settings.opacity !== OPACITY_DEFAULT,
    mode: 'displacement',
  },
  {
    label: 'Camera FOV',
    read: (settings) => `${settings.cameraFov.toFixed()}º`,
    write: (settings, value) =>
      settings.setCameraFov(
        Math.max(30, Math.min(90, settings.cameraFov + (value.x - value.y) * -0.1)),
      ),
    reset: (settings) => settings.removeCameraFov(),
    icon: () => <CameraIcon />,
    default: `${CAMERA_FOV_DEFAULT.toFixed()}º`,
    hasChanged: (settings) => settings.cameraFov !== CAMERA_FOV_DEFAULT,
    mode: 'displacement',
  },
  {
    label: 'Camera Height',
    read: (settings) => `${settings.cameraHeight.toFixed(1)} m`,
    write: (settings, value) =>
      settings.setCameraHeight(Math.max(0.5, settings.cameraHeight + value.y * 0.01)),
    reset: (settings) => settings.removeCameraHeight(),
    icon: () => <MoveVertical />,
    default: `${CAMERA_HEIGHT_DEFAULT.toFixed(1)} m`,
    hasChanged: (settings) => settings.cameraHeight !== CAMERA_HEIGHT_DEFAULT,
    mode: 'displacement',
  },
]

export const ControlsView = ({
  settings,
  expandedControl,
  showControls,
  setShowControls,
  setExpandedControl,
  onSettingsChange,
  scale = 1,
  heading,
}: {
  settings: Settings
  expandedControl: ControlsConfig | null
  showControls: boolean
  setShowControls: (show: boolean) => void
  setExpandedControl: (control: ControlsConfig | null) => void
  onSettingsChange: () => void
  scale?: number
  heading: number
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (expandedControl) setExpandedControl(null)
      else setShowControls(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expandedControl])
  if (!showControls)
    return (
      <button className="controls-view-button" onClick={() => setShowControls(true)}>
        <SettingsIcon />
      </button>
    )
  return (
    <>
      {expandedControl ? (
        <ExpandedControl
          control={expandedControl}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onClose={() => setExpandedControl(null)}
          scale={scale}
          heading={heading}
        />
      ) : (
        <div className="controls-view">
          <button className="controls-view-button" onClick={() => setShowControls(false)}>
            <X />
          </button>
          <div className="controls-view-content">
            {Controls.map((control) => (
              <ControlItem
                key={control.label}
                label={control.label}
                value={control.read(settings)}
                defaultValue={control.default}
                icon={control.icon(settings)}
                onClick={() => {
                  if (control.mode === 'toggle') {
                    control.write(settings, new Vector2())
                    onSettingsChange()
                  } else {
                    setExpandedControl(control)
                  }
                }}
                mode={control.mode}
                onReset={
                  control.hasChanged(settings)
                    ? () => {
                        control.reset(settings)
                        onSettingsChange()
                      }
                    : undefined
                }
              />
            ))}
          </div>
          <button
            type="button"
            className="controls-reset-button"
            title="Reset to default"
            onClick={() => {
              settings.clear()
              onSettingsChange()
            }}
          >
            <Trash2Icon />
          </button>
        </div>
      )}
    </>
  )
}

export const ControlItem = ({
  label,
  value,
  icon,
  mode,
  onClick,
  onReset,
}: {
  label: string
  value: string
  defaultValue: string
  icon: React.ReactNode
  mode: GestureMode
  onClick: () => void
  onReset?: () => void
}) => {
  return (
    <div className="control-item" onClick={onClick}>
      <div className="control-item-button">{icon}</div>
      <div className="control-item-info">
        <span className="control-item-label">{label}</span>
        <span className="control-item-value">{value}</span>
      </div>
      {mode !== 'toggle' && onReset && (
        <Trash2Icon
          className="control-item-delete-icon"
          size={18}
          onClick={(e) => {
            e.stopPropagation()
            onReset()
          }}
        />
      )}
    </div>
  )
}

const ExpandedControl = ({
  control,
  settings,
  onSettingsChange,
  onClose,
  scale = 1,
  heading,
}: {
  control: ControlsConfig
  settings: Settings
  onSettingsChange: () => void
  onClose: () => void
  scale?: number
  heading: number
}) => {
  return (
    <>
      <GestureControls
        mode={control.mode}
        onChange={(values) => {
          const value = values.clone().multiplyScalar(scale).rotateAround(new Vector2(), heading)
          control.write(settings, value)
          onSettingsChange()
        }}
      />
      <button
        className="control-item-button control-item-button-expanded"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
      >
        <CheckIcon />
      </button>
      <div className="control-item-expanded">
        <div className="control-item-expanded-title">
          <span>{control.label}:</span>
          <span>{control.read(settings)}</span>
        </div>
      </div>
    </>
  )
}
