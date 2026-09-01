import { useState, useEffect } from 'react'

export function useMagnetometer() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 })
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Check if the constructor exists in the window object
    if (!('Magnetometer' in window)) {
      setIsSupported(false)
      setError('Magnetometer API is not supported by this browser.')
      return
    }

    let magnetometer = null

    const startSensor = () => {
      try {
        // Frequency dictates reads per second
        magnetometer = new window.Magnetometer({ frequency: 10 })

        magnetometer.onreading = () => {
          setData({
            x: magnetometer.x,
            y: magnetometer.y,
            z: magnetometer.z,
          })
        }

        magnetometer.onerror = (event) => {
          setError(`Sensor error: ${event.error.name}`)
        }

        magnetometer.start()
      } catch (err) {
        setError(`Initialization error: ${err.message}`)
      }
    }

    // Request permissions before starting the sensor
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'magnetometer' })
        .then((result) => {
          if (result.state === 'granted') {
            startSensor()
          } else if (result.state === 'prompt') {
            // Some browsers start directly if it's allowed on prompt
            startSensor()
          } else {
            setError('Permission to use magnetometer was denied.')
          }
        })
        .catch(() => {
          // Fallback if the browser doesn't support querying 'magnetometer' specifically
          startSensor()
        })
    } else {
      startSensor()
    }

    // Clean up hardware connections when the component unmounts
    return () => {
      if (magnetometer) {
        magnetometer.stop()
      }
    }
  }, [])

  return { data, error, isSupported }
}
