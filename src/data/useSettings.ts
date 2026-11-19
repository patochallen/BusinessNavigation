export const useSettings = (businessId: string) => {
  const settings = useMemo(() => Settings.getInstance(businessId), [businessId])
  return settings
}

import { useMemo } from 'react'
import { Settings } from './storage-repository'
