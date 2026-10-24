import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useState, useEffect } from 'react'
import { SceneModel } from './scene-model'

export const useModels = () => {
  const [sceneModels, setSceneModels] = useState<[string, SceneModel][]>([])

  useEffect(() => {
    console.log('Scene models updated:', sceneModels)
  }, [sceneModels])

  const getModel = (url: string) => {
    let sceneModel = sceneModels.find((model) => model[0] === url)
    if (!sceneModel) {
      console.log('Loading scene model for URL:', url)
      sceneModel = [
        url,
        new SceneModel(useLoader(GLTFLoader, import.meta.env.BASE_URL + url).scene),
      ]
      if (!sceneModel) return undefined
      setSceneModels((prev) => [...prev, sceneModel!])
    }
    return sceneModel[1].getScene()
  }
  return { getModel }
}
