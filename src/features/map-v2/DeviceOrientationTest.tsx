import { useDeviceOrientation } from './useDeviceOrientation'

const format = (value: number | null | undefined, digits = 2) =>
  value == null ? '—' : value.toFixed(digits)

export const DeviceOrientationTest = () => {
  const { heading, quaternion, event, permission, isAbsolute, isListening, error, start, stop } =
    useDeviceOrientation()

  const webkitCompassHeading = (
    event as (DeviceOrientationEvent & { webkitCompassHeading?: number }) | null
  )?.webkitCompassHeading

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 14, overflow: 'hidden' }}>
      <h3>Device Orientation Test</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={start} disabled={isListening || permission === 'unsupported'}>
          Start
        </button>
        <button onClick={stop} disabled={!isListening}>
          Stop
        </button>
      </div>

      <div
        style={{
          width: 120,
          height: 120,
          margin: '0 auto 16px',
          borderRadius: '50%',
          border: '2px solid #333',
          position: 'relative',
        }}
      >
        <span style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)' }}>
          N
        </span>
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            width: 4,
            height: 50,
            marginLeft: -2,
            background: 'red',
            transformOrigin: '50% 100%',
            transform: `rotate(${heading ?? 0}deg)`,
            transition: 'transform 0.1s linear',
          }}
        />
      </div>

      <table>
        <tbody>
          <tr>
            <td>Permission</td>
            <td>{permission}</td>
          </tr>
          <tr>
            <td>Listening</td>
            <td>{String(isListening)}</td>
          </tr>
          <tr>
            <td>Is absolute</td>
            <td>{String(isAbsolute)}</td>
          </tr>
          <tr>
            <td>Heading</td>
            <td>{format(heading, 1)}°</td>
          </tr>
          <tr>
            <td>Quaternion x</td>
            <td>{format(quaternion?.x, 4)}</td>
          </tr>
          <tr>
            <td>Quaternion y</td>
            <td>{format(quaternion?.y, 4)}</td>
          </tr>
          <tr>
            <td>Quaternion z</td>
            <td>{format(quaternion?.z, 4)}</td>
          </tr>
          <tr>
            <td>Quaternion w</td>
            <td>{format(quaternion?.w, 4)}</td>
          </tr>
          <tr>
            <td>alpha</td>
            <td>{format(event?.alpha)}</td>
          </tr>
          <tr>
            <td>beta</td>
            <td>{format(event?.beta)}</td>
          </tr>
          <tr>
            <td>gamma</td>
            <td>{format(event?.gamma)}</td>
          </tr>
          <tr>
            <td>webkitCompassHeading</td>
            <td>{format(webkitCompassHeading)}</td>
          </tr>
        </tbody>
      </table>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
