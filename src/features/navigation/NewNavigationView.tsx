import './NewNavigationView.css'
import type { Attraction, Business, MapPoint } from '../../domain/types'
import { IconButton } from '../layout/IconButton'
import { X } from 'lucide-react'
import { NavigationMap } from '../map/NavigationMap'

type NewNavigationViewProps = {
  business: Business
  selected: Attraction
  userPosition: GeolocationCoordinates
  heading: number
  onBack: () => void
}

export const NewNavigationView = ({
  business,
  selected,
  userPosition,
  heading,
  onBack,
}: NewNavigationViewProps) => {
  return (
    <section className="new-navigation-view" aria-label="Navegación">
      <NavigationMap
        business={business}
        selectedAttraction={selected}
        userPosition={userPosition}
        heading={heading}
      />
      <IconButton icon={<X />} position="topRight" onClick={onBack} />
    </section>
  )
}
