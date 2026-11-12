import { useEffect } from 'react'
import './ControlsView.css'
import {
  CameraIcon,
  ChartSplineIcon,
  CheckIcon,
  Move3dIcon,
  MoveVertical,
  Rotate3dIcon,
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
  type Settings,
  CAMERA_ROTATION_DEFAULT,
} from '../../data/storage-repository'
import { GestureControls, type GestureMode } from './GestureControls'
import { Euler, Vector2 } from 'three'
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js'

export type ControlsConfig = {
  label: string
  read: (settings: Settings) => string
  write: (settings: Settings, value: Vector2) => void
  reset: (settings: Settings) => void
  icon: React.ReactNode
  default: string
  hasChanged: (settings: Settings) => boolean
  mode: GestureMode
}

export const Controls: ControlsConfig[] = [
  {
    label: 'Location Offset',
    read: (settings) =>
      `(${settings.locationOffset.x.toFixed()}, ${settings.locationOffset.y.toFixed()})`,
    write: (settings, value) =>
      settings.setLocationOffset(settings.locationOffset.clone().add(value.multiplyScalar(0.1))),
    reset: (settings) => settings.removeLocationOffset(),
    icon: <Move3dIcon />,
    default: `(${LOCATION_OFFSET_DEFAULT.x.toFixed()}, ${LOCATION_OFFSET_DEFAULT.y.toFixed()})`,
    hasChanged: (settings) => !settings.locationOffset.equals(LOCATION_OFFSET_DEFAULT),
    mode: 'displacement',
  },
  {
    label: 'Heading Offset',
    read: (settings) => `${radToDeg(settings.headingOffset).toFixed()}º`,
    write: (settings, value) =>
      settings.setHeadingOffset(
        Math.max(-Math.PI, Math.min(Math.PI, settings.headingOffset + degToRad(value.x * 0.5))),
      ),
    reset: (settings) => settings.removeHeadingOffset(),
    icon: <RotateCcw />,
    default: `${HEADING_OFFSET_DEFAULT.toFixed()}º`,
    hasChanged: (settings) => settings.headingOffset !== HEADING_OFFSET_DEFAULT,
    mode: 'rotation',
  },
  {
    label: 'Opacity',
    read: (settings) => `${settings.opacity.toFixed(2)}`,
    write: (settings, value) =>
      settings.setOpacity(Math.min(1, Math.max(0, settings.opacity + value.x * -0.001))),
    reset: (settings) => settings.removeOpacity(),
    icon: <ChartSplineIcon />,
    default: `${OPACITY_DEFAULT.toFixed(2)}`,
    hasChanged: (settings) => settings.opacity !== OPACITY_DEFAULT,
    mode: 'displacement',
  },
  {
    label: 'Camera FOV',
    read: (settings) => `${settings.cameraFov.toFixed()}º`,
    write: (settings, value) =>
      settings.setCameraFov(
        Math.max(30, Math.min(90, settings.cameraFov + (value.x - value.y) * -0.05)),
      ),
    reset: (settings) => settings.removeCameraFov(),
    icon: <CameraIcon />,
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
    icon: <MoveVertical />,
    default: `${CAMERA_HEIGHT_DEFAULT.toFixed(1)} m`,
    hasChanged: (settings) => settings.cameraHeight !== CAMERA_HEIGHT_DEFAULT,
    mode: 'displacement',
  },
  {
    label: 'Camera Rotation',
    read: (settings) =>
      `(${radToDeg(settings.cameraRotation.x).toFixed()}, ${radToDeg(settings.cameraRotation.y).toFixed()}, ${radToDeg(settings.cameraRotation.z).toFixed()}, ${settings.cameraRotation.order})`,
    write: (settings, value) => {
      console.log('Camera rotation change:', value)
      settings.setCameraRotation(
        new Euler(
          Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, settings.cameraRotation.x + degToRad(value.y)),
          ),
          settings.cameraRotation.y,
          Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, settings.cameraRotation.z + degToRad(value.x * 0.5)),
          ),
          'XYZ',
        ),
      )
    },
    reset: (settings) => settings.removeCameraRotation(),
    icon: <Rotate3dIcon />,
    default: `${radToDeg(CAMERA_ROTATION_DEFAULT.x).toFixed()}, ${radToDeg(CAMERA_ROTATION_DEFAULT.y).toFixed()}, ${radToDeg(CAMERA_ROTATION_DEFAULT.z).toFixed()}, ${CAMERA_ROTATION_DEFAULT.order}`,
    hasChanged: (settings) => !settings.cameraRotation.equals(CAMERA_ROTATION_DEFAULT),
    mode: 'rotation',
  },
]

export const ControlsView = ({
  settings,
  expandedControl,
  showControls,
  setShowControls,
  setExpandedControl,
  onSettingsChange,
}: {
  settings: Settings
  expandedControl: ControlsConfig | null
  showControls: boolean
  setShowControls: (show: boolean) => void
  setExpandedControl: (control: ControlsConfig | null) => void
  onSettingsChange: () => void
}) => {
  // const [showControls, setShowControls] = useState(false)

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
                icon={control.icon}
                onClick={() => setExpandedControl(control)}
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
        </div>
      )}
    </>
  )
}

export const ControlItem = ({
  label,
  value,
  icon,
  onClick,
  onReset,
}: {
  label: string
  value: string
  defaultValue: string
  icon: React.ReactNode
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
      {onReset && (
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
}: {
  control: ControlsConfig
  settings: Settings
  onSettingsChange: () => void
  onClose: () => void
}) => {
  return (
    <>
      <GestureControls
        mode={control.mode}
        onChange={(values) => {
          control.write(settings, values)
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
