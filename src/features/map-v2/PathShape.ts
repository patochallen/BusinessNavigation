import { Shape, type Vector2 } from 'three'

export const PathShape = ({ from, to }: { from: Vector2; to: Vector2 }) => {
  const deltaX = to.x - from.x
  const deltaZ = to.y - from.y
  const length = Math.hypot(deltaX, deltaZ)
  if (length === 0) return null

  const halfWidth = 2
  const perpendicularX = (-deltaZ / length) * halfWidth
  const perpendicularZ = (deltaX / length) * halfWidth
  const shape = new Shape()
  shape.moveTo(from.x + perpendicularX, from.y - perpendicularZ)
  shape.lineTo(from.x - perpendicularX, from.y + perpendicularZ)
  shape.lineTo(to.x - perpendicularX, to.y + perpendicularZ)
  shape.lineTo(to.x + perpendicularX, to.y - perpendicularZ)
  shape.closePath()
  return shape
}
