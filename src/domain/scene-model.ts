import {
  Mesh,
  type Group,
  type Material,
  type MeshStandardMaterial,
  type Object3D,
} from 'three/src/Three.WebGPU.Nodes.js'
import { Vector3 } from 'three'
import { PositionMesh } from '@react-three/drei'

export class AttractionModel {
  private name: string
  private position: Vector3 = new Vector3()
  private floor: Mesh
  private building: Mesh

  constructor(attraction: Object3D) {
    this.name = attraction.name || ''
    this.position.copy(attraction.position)
    this.floor =
      (attraction.children.filter((child) => child.name.includes('Floor'))?.[0] as Mesh) ||
      new PositionMesh()
    this.building = attraction.children.filter((child) =>
      child.name.includes('Building'),
    )?.[0] as Mesh
  }
  getName() {
    return this.name
  }
  getFloor() {
    return this.floor.clone()
  }
  getPosition() {
    return this.position.clone()
  }
  getBuilding() {
    return this.building?.clone()
  }
}

export class SceneObject {
  private readonly MIN_OPACITY = 0.1
  private position: Vector3 = new Vector3()
  private attractions: AttractionModel[] = []
  private floor: Mesh | null = null
  private paths: Mesh | null = null
  private sceneWireframe: boolean = false
  private sceneOpacity: number = 1

  constructor(scene: Group) {
    this.position.copy(new Vector3(-3, 0, -16))
    this.attractions = (scene.getObjectByName('Attractions') as Object3D)?.children?.map(
      (child) => new AttractionModel(child),
    )
    this.floor = scene.getObjectByName('Floor2') as Mesh | null
    this.paths = scene.getObjectByName('Paths') as Mesh | null
    this.floor!.children.length = 0
  }

  getAttractions() {
    return this.attractions
  }
  getPosition() {
    return this.position.clone()
  }
  getFloor() {
    return this.floor?.clone()
  }
  getPaths() {
    return this.paths?.clone()
  }

  setSceneWireframe(wireframe: boolean) {
    this.sceneWireframe = wireframe
    this.updateWireframe(this.floor as Mesh, wireframe)
    this.updateWireframe(this.paths as Mesh, wireframe)
    this.attractions.forEach((attraction) => {
      this.updateWireframe(attraction.getFloor() as Mesh, wireframe)
    })
  }
  setSceneOpacity(opacity: number) {
    this.sceneOpacity = opacity
    this.updateMaterialOpacity(this.floor, opacity)
    this.updateMaterialOpacity(this.paths, opacity)
    this.attractions.forEach((attraction) => {
      this.updateMaterialOpacity(attraction.getFloor(), opacity)
      attraction.getBuilding()?.traverse((child) => {
        this.updateMaterialOpacity(child as Mesh, opacity)
      })
    })
  }

  setBuildingWireframe(wireframe: boolean) {
    this.attractions.forEach((attraction) => {
      const building = attraction.getBuilding()
      if (building) this.updateWireframe(building, wireframe)
    })
  }
  toggleSceneWireframe() {
    this.setSceneWireframe(!this.sceneWireframe)
  }

  toggleSceneOpacity() {
    this.setSceneOpacity(this.sceneOpacity === 1 ? this.MIN_OPACITY : 1)
  }

  toggleFloor() {
    this.floor?.traverse((child) => {
      this.updateMaterialOpacity(
        child as Mesh,
        (this.floor?.material as Material).opacity == 1 ? this.MIN_OPACITY : 1,
      )
    })
  }

  toggleAttractions() {
    this.sceneOpacity = this.sceneOpacity === 1 ? this.MIN_OPACITY : 1
    this.attractions.forEach((attraction) => {
      // const floor = attraction.getFloor()
      // this.updateMaterialOpacity(floor, this.sceneOpacity)
      attraction.getBuilding()?.traverse((child) => {
        this.updateMaterialOpacity(child as Mesh, this.sceneOpacity)
      })
    })
  }

  togglePaths() {
    this.paths?.traverse((child) => {
      this.updateMaterialOpacity(
        child as Mesh,
        (this.paths?.material as Material).opacity == 1 ? this.MIN_OPACITY : 1,
      )
    })
  }

  private updateMaterialOpacity(mesh: Mesh | null, opacity: number) {
    if (mesh?.isMesh) {
      const material = mesh.material as Material
      material.opacity = opacity
      material.transparent = opacity < 1
      material.needsUpdate = true
    }
  }

  private updateWireframe(mesh: Mesh | null, wireframe: boolean) {
    mesh?.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        if ((mesh.material as MeshStandardMaterial).isMeshStandardMaterial) {
          const material = mesh.material as MeshStandardMaterial
          material.wireframe = wireframe
          material.needsUpdate = true
        }
      }
    })
  }
}

export class SceneModel {
  private sceneObject: SceneObject | null = null

  constructor(scene: Group) {
    this.sceneObject = new SceneObject(scene)
    this.log()
  }

  log() {
    console.log(this)
  }

  getScene() {
    return this.sceneObject
  }
}
