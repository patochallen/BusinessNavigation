import { useEffect } from 'react'
import { useDeviceOrientation } from './useDeviceOrientation'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { CheckIcon, XIcon } from 'lucide-react'
import { useDeviceLocation } from './useDeviceLocation'
import { useCamera } from './useCamera'
import { DeviceOrientationTest } from './DeviceOrientationTest'
import { CameraMapView, CameraMapViewContent } from './CameraMapView'

export const PermissionsScreen = () => {
  const navigate = useNavigate()
  const { permission: orientationPermission, requestPermission: requestOrientationPermission } =
    useDeviceOrientation()
  const { permission: locationPermission, requestPermission: requestLocationPermission } =
    useDeviceLocation()
  const { permission: cameraPermission, requestPermission: requestCameraPermission } = useCamera()

  useEffect(() => {
    if (
      orientationPermission === 'granted' &&
      locationPermission === 'granted' &&
      cameraPermission === 'granted'
    ) {
      console.log('All permissions granted.')
      navigate('/camera')
    } else {
      console.log('Some permissions are not granted.')
    }
  }, [orientationPermission, locationPermission, cameraPermission])

  useEffect(() => {
    console.log('Device orientation permission changed:', orientationPermission)
  }, [orientationPermission])

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        Orientation Sensor{' '}
        {orientationPermission === 'granted' ? <CheckIcon color="green" /> : <XIcon color="red" />}{' '}
        &nbsp;
        {orientationPermission !== 'granted' && (
          <button onClick={requestOrientationPermission}>Request</button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
        Location{' '}
        {locationPermission === 'granted' ? <CheckIcon color="green" /> : <XIcon color="red" />}{' '}
        &nbsp;
        {locationPermission !== 'granted' && (
          <button onClick={requestLocationPermission}>Request</button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
        Camera{' '}
        {cameraPermission === 'granted' ? <CheckIcon color="green" /> : <XIcon color="red" />}{' '}
        &nbsp;
        {cameraPermission !== 'granted' && (
          <button onClick={requestCameraPermission}>Request</button>
        )}
      </div>
    </div>
  )
}

export const StartScreen = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/home" element={<PermissionsScreen />} />
        <Route path="/test" element={<DeviceOrientationTest />} />
        <Route path="/camera" element={<CameraMapView />} />
        <Route path="/camera/:attractionId" element={<CameraMapViewContent />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </HashRouter>
  )
}
