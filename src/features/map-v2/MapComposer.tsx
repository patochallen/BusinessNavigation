import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export const MapComposer = () => {
  return (
    <EffectComposer>
      {/* <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} /> */}
      <Bloom luminanceThreshold={0.6} intensity={0.5} mipmapBlur />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
    </EffectComposer>
  )
}
