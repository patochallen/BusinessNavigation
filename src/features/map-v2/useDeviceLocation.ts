import { useState, useEffect } from 'react'

export const useDeviceLocation = () => {
  const [permission, setPermission] = useState<PermissionState>('prompt')

  const requestPermission = async () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      () => setPermission('granted'),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission('denied')
      },
    )
  }

  useEffect(() => {
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      setPermission(status.state)
      status.onchange = () => setPermission(status.state)
    })
  }, [])

  return { permission, requestPermission }
}
