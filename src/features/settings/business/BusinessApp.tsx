import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LocationStorage } from '../../../data/storage-repository'
import { BusinessSelection } from './BusinessSelection'

export const BusinessApp = () => {
  const navigate = useNavigate()
  const [currentBusinessId, setCurrentBusinessId] = useState(LocationStorage.getCurrentBusiness())

  useEffect(() => {
    if (currentBusinessId) {
      console.log('BusinessApp navigating to business:', currentBusinessId)
      navigate(`/${currentBusinessId}`)
    } else {
      console.log('BusinessApp no selected business')
    }
  }, [currentBusinessId])

  return <BusinessSelection onSelectModel={setCurrentBusinessId} />
}
