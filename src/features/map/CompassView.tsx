import './CompassView.css'

export const CompassView = ({ heading }: { heading: number }) => {
  return (
    <div className="compass-view">
      <img
        className="compass-needle"
        src={`${import.meta.env.BASE_URL}compass-needle.png`}
        alt="Compass"
        style={{ transform: `rotate(${heading}deg)` }}
      />
      <p className="compass-heading">{heading.toFixed()}°</p>
    </div>
  )
}
