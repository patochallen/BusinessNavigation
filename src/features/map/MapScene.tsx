import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { Attraction, MapFeature } from "../../domain/types";

type MapSceneProps = {
  attractions: Attraction[];
  mapFeatures?: MapFeature[];
  selectedId?: string;
  centerOnSelected?: boolean;
  onSelect: (id: string) => void;
  userActive: boolean;
};

export function MapScene({
  attractions,
  mapFeatures = [],
  selectedId,
  centerOnSelected = false,
  onSelect,
  userActive,
}: MapSceneProps) {
  return (
    <Canvas className="map-canvas" dpr={[1, 2]}>
      <PerspectiveCamera
        makeDefault
        position={[
          centerOnSelected
            ? (attractions.find((attraction) => attraction.id === selectedId)?.position.x ?? 0)
            : 0,
          12,
          centerOnSelected
            ? (attractions.find((attraction) => attraction.id === selectedId)?.position.z ?? 0)
            : 0,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fov={42}
      />
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 8, 2]} intensity={2.5} color="#fff1d0" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 12]} />
        <meshStandardMaterial color="#e7e1d4" />
      </mesh>
      <gridHelper
        args={[15, 15, "#bdb7a8", "#d7d1c4"]}
        rotation={[0, 0, 0]}
        position={[0, 0.02, 0]}
      />
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.18]} />
        <meshStandardMaterial color="#34413d" />
      </mesh>
      {mapFeatures.map((feature) => {
        if (feature.type === "path") {
          return <Line key={feature.id} points={feature.points.map((point) => [point.x, 0.12, point.z])} color="#f3f0e7" lineWidth={4} />;
        }
        if (feature.type === "building") {
          return <mesh key={feature.id} position={[feature.position.x, 0.18, feature.position.z]}><boxGeometry args={[feature.size.x, 0.32, feature.size.z]} /><meshStandardMaterial color={feature.color} /></mesh>;
        }
        const minX = Math.min(...feature.points.map((point) => point.x));
        const maxX = Math.max(...feature.points.map((point) => point.x));
        const minZ = Math.min(...feature.points.map((point) => point.z));
        const maxZ = Math.max(...feature.points.map((point) => point.z));
        return <mesh key={feature.id} position={[(minX + maxX) / 2, 0.04, (minZ + maxZ) / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[maxX - minX, maxZ - minZ]} /><meshBasicMaterial color={feature.color} transparent opacity={0.55} /></mesh>;
      })}
      {attractions.map((attraction) => (
        <group
          key={attraction.id}
          position={[attraction.position.x, 0.22, attraction.position.z]}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(attraction.id);
          }}
        >
          <mesh scale={selectedId === attraction.id ? 1.35 : 1}>
            <cylinderGeometry args={[0.28, 0.22, 0.16, 24]} />
            <meshStandardMaterial
              color={attraction.color}
              emissive={attraction.color}
              emissiveIntensity={selectedId === attraction.id ? 0.4 : 0.05}
            />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.12, 12, 8]} />
            <meshStandardMaterial color={attraction.color} />
          </mesh>
        </group>
      ))}
      {userActive && (
        <mesh position={[0, 0.3, 0]}>
          <ringGeometry args={[0.18, 0.25, 24]} />
          <meshBasicMaterial color="#477e78" />
        </mesh>
      )}
      <OrbitControls
        enableRotate={false}
        minZoom={35}
        maxZoom={80}
        zoomSpeed={0.8}
      />
    </Canvas>
  );
}
