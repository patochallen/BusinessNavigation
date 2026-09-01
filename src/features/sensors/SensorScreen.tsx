import { useState, useEffect } from 'react'

export function SensorScreen() {
  const [heading, setHeading] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleOrientation = (event) => {
      // console.log('Device orientation event:', event)
      // iOS maneja una propiedad propietaria llamada webkitCompassHeading
      // if (event.webkitCompassHeading !== undefined) {
      //   console.log('Device orientation webkitCompassHeading value:', event.webkitCompassHeading)
      //   setHeading(Math.round(event.webkitCompassHeading))
      if (event.alpha !== undefined) {
        console.log('Device orientation alpha value:', event.alpha, Math.round(360 - event.alpha))
        // En Android (Chrome), alpha mide la rotación respecto al norte magnético
        // Nota: A veces requiere calibración restando 360 grados
        setHeading(Math.round(360 - event.alpha - 11))
      }
    }

    // Manejar solicitud de permisos explícitos para iOS 13+
    const requestPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        try {
          const permissionState = await DeviceOrientationEvent.requestPermission()
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          } else {
            setError('Permiso denegado para acceder a la orientación.')
          }
        } catch (err) {
          setError('Error de permisos: ' + err.message)
        }
      } else {
        // Navegadores normales (Android / Computadoras de escritorio compatibles)
        window.addEventListener('deviceorientationabsolute', handleOrientation)
      }
    }

    requestPermission()

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
    }
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h3>Orientación Magnética (Brújula)</h3>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>
          <strong>Rumbo:</strong> {heading !== null ? `${heading}°` : 'Cargando...'}
        </p>
      )}
    </div>
  )
}
