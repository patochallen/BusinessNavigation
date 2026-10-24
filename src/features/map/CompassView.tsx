import './CompassView.css'

export const CompassView = ({ heading, size = 31 }: { heading: number; size?: number }) => {
  return (
    <div className="compass-view" style={{ width: `${size}px`, height: `${size}px` }}>
      <img
        className="compass-needle"
        src={`${import.meta.env.BASE_URL}compass-needle.png`}
        alt="Compass"
        style={{ transform: `rotate(${heading}deg)` }}
      />
      <p className="compass-heading" style={{ fontSize: `${size / 3}px` }}>
        {heading.toFixed()}°
      </p>
    </div>
  )
}
