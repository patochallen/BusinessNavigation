import { Shape, ShapeUtils, Vector2, ShapeGeometry } from 'three'
import type { Business } from '../../domain/types'
import { getBusinessBoundaryMapPoints } from '../../domain/use-cases'

export function createBusinessTerrainGeometry(business: Business) {
  const boundary = getBusinessBoundaryMapPoints(business)
  const contour = boundary.map((point) => new Vector2(point.x, point.z))
  if (!ShapeUtils.isClockWise(contour)) contour.reverse()

  const shape = new Shape()
  shape.moveTo(contour[0].x, contour[0].y)
  contour.slice(1).forEach((point) => shape.lineTo(point.x, point.y))
  shape.closePath()

  const geometry = new ShapeGeometry(shape)
  // new ExtrudeGeometry(shape, {
  //   depth: business.terrain.thicknessMeters,
  //   bevelEnabled: true,
  //   steps: 1,
  // })
  geometry.rotateX(Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}
