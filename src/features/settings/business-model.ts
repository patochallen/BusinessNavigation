import type { Coordinate } from '../../domain/types'

export interface BusinessModel {
  id: string
  name: string
  description: string
  imageUrl: string
  location: Coordinate
  sceneUrl: string
}

export const businessModels: BusinessModel[] = [
  {
    id: '1',
    name: 'Parque Saavedra',
    description: 'Parque Saavedra is a public park located in Buenos Aires, Argentina.',
    imageUrl: 'https://i.pinimg.com/736x/ed/a9/fb/eda9fbffc10ca2c1b752eb163b039995.jpg',
    location: { latitude: -34.550539413457, longitude: -58.48003697685765 },
    sceneUrl: 'scene3.glb',
  },
  {
    id: '2',
    name: 'Larralde y Freire',
    description: 'Larralde y Freire is a location in Buenos Aires, Argentina.',
    imageUrl:
      'https://www.waze.com/row-tiles/live/base/17/44246/78956/tile.png?highres=true&_olSalt=0.326908144634217',
    location: { latitude: -34.55317554356185, longitude: -58.476032809630276 },
    sceneUrl: 'scene2.glb',
  },
]
