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
  readonly id: string
  private attraction: Object3D
  private name: string
  private description: string | null = null
  private position: Vector3 = new Vector3()
  private floor: Mesh
  private building: Mesh
  private isVisible: boolean = false

  constructor(attraction: Object3D) {
    this.id = crypto.randomUUID()
    this.attraction = attraction
    this.name = attraction.name || ''
    this.description = attraction.userData?.description
    this.position.copy(attraction.position.clone())
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
  getDescription() {
    return this.description
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
  getObject3D() {
    return this.attraction.clone()
  }
  toggleVisible() {
    this.setVisible(!this.isVisible)
  }
  setVisible(visible: boolean) {
    if (visible === this.isVisible) return
    this.isVisible = visible
    // const scale = this.isVisible ? 3 : 1 / 3
    // console.log('Setting attraction visibility to:', visible)
    this.attraction?.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        if ((mesh.material as MeshStandardMaterial).isMeshStandardMaterial) {
          const material = mesh.material as MeshStandardMaterial
          material.wireframe = visible
          material.needsUpdate = true
        }
      }
    })
    // this.floor?.scale.set(
    //   this.floor?.scale?.x * scale,
    //   this.floor?.scale?.y * scale,
    //   this.floor?.scale?.z * scale,
    // )
    // this.building?.scale.set(
    //   this.building?.scale?.x * scale,
    //   this.building?.scale?.y * scale,
    //   this.building?.scale?.z * scale,
    // )
    // this.attraction?.scale.set(
    //   this.attraction?.scale?.x * scale,
    //   this.attraction?.scale?.y * scale,
    //   this.attraction?.scale?.z * scale,
    // )
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
  // private selectedAttraction: AttractionModel | null = null

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

  // setSelectedAttraction(attraction: AttractionModel | null) {
  //   this.selectedAttraction = attraction
  //   console.log('Selected attraction set to:', attraction)
  // }
}

export class SceneModel {
  private sceneObject: SceneObject

  constructor(scene: Group) {
    const clonedScene = scene.clone(true)
    const geometries = new Map<Mesh['geometry'], Mesh['geometry']>()
    const materials = new Map<Material, Material>()

    clonedScene.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return

      let geometry = geometries.get(mesh.geometry)
      if (!geometry) {
        geometry = mesh.geometry.clone()
        geometries.set(mesh.geometry, geometry)
      }
      mesh.geometry = geometry

      const cloneMaterial = (material: Material) => {
        let clonedMaterial = materials.get(material)
        if (!clonedMaterial) {
          clonedMaterial = material.clone()
          materials.set(material, clonedMaterial)
        }
        return clonedMaterial
      }

      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(cloneMaterial)
        : cloneMaterial(mesh.material)
    })

    this.sceneObject = new SceneObject(clonedScene)
    this.log()
  }

  log() {
    // console.log(this)
  }

  getScene() {
    return this.sceneObject
  }
}
