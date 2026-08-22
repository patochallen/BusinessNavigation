import { ArrowUp, Compass } from 'lucide-react'
import './AttractionItemList.css'

type AttractionItemListProps = {
  selected: boolean
  color: string
  name: string
  description: string
  category: string
  walkingEta: string
  distanceMeters: string
  headingDegrees: number
  icon: typeof Compass
  onClick: () => void
}

export const AttractionItemList = ({
  selected,
  color,
  name,
  description,
  category,
  distanceMeters,
  headingDegrees,
  walkingEta,
  icon: Icon,
  onClick,
}: AttractionItemListProps) => {
  return (
    <button
      className={`attraction-card ${selected ? 'selected' : ''}`}
      key={name + description}
      onClick={onClick}
    >
      <span className="attraction-icon" style={{ background: color }}>
        <Icon size={18} />
      </span>
      <span className="attraction-copy">
        <strong className="attraction-top">{name}</strong>
        <span>{description}</span>
        <span className="attraction-meta">
          <span>{category}</span>
          <span>•</span>
          <span>{walkingEta} a pie</span>
        </span>
      </span>
      <span className="card-distance">
        <ArrowUp className="card-arrow" style={{ transform: `rotate(${headingDegrees}deg)` }} />
        <span>{distanceMeters}</span>
      </span>
    </button>
  )
}
