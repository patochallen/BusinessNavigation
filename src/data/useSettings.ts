export const useSettings = () => {
  const settings = useMemo(() => Settings.getInstance(), [])
  return settings
}

import { useMemo } from 'react'
import { Settings } from './storage-repository'
