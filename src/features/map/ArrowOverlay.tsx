import './ArrowOverlay.css'
import { remap } from '../../utils/utils'

type ArrowOverlayProps = {
  distance: number
  heading: number
  fov: number
}

export const ArrowOverlay = ({ distance, heading, fov }: ArrowOverlayProps) => {
  const size = Math.min(Math.max(window.innerWidth * 0.1, 40), 70)
  const width = window.innerWidth
  const height = window.innerHeight
  const attractionVisible = Math.abs(heading) < fov / 2
  const offsetH = !attractionVisible
    ? remap((heading > 0 ? 180 : -180) - heading, 90, -90, size * 0.7, width - size * 0.7)
    : remap(heading, fov / 2, -fov / 2, size * 0.7, width - size * 0.7)
  const offsetV = remap(Math.abs(heading), 0, 160, height * 0.6, height - size)
  return (
    <div className="arrow-overlay">
      <img
        src={`${import.meta.env.BASE_URL}arrow.png`}
        className="arrow-image"
        aria-hidden={attractionVisible}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          top: `${offsetV}px`,
          left: `${offsetH}px`,
          opacity: attractionVisible ? 0 : 1,
          transform: `translate(-50%, -50%) rotate(${-heading}deg)`,
        }}
      />
      <div className="indication-overlay">
        <div className="indication-overlay-chip">{heading.toFixed(1)}º</div>
        <div className="indication-overlay-chip">{distance.toFixed()}m</div>
      </div>
    </div>
  )
}
