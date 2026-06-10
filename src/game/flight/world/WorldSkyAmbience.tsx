import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, type Mesh } from 'three';
import { GradientTexture } from '@react-three/drei';

// Open-sky ambience for the high-altitude world flight. The ground-area DynamicAmbience uses a short fog
// range that whites out everything at altitude, and a tone-mapped drei <Sky> gets blown out by Bloom — both
// caused the "all white" bug. Instead we paint an UNLIT vertical gradient dome (meshBasicMaterial +
// toneMapped:false, like the kit's EnvironmentBackdrop gradient path): predictable blue sky above, pale
// horizon, no whiteout, no fog. The dome follows the camera so it always surrounds the craft (which travels
// far out along x). Props let WorldFlightEnvironment recolour it per-route (editorEnvironment override).
export const WorldSkyAmbience = ({ top = '#3f8fe0', bottom = '#cfe7ff' }: { top?: string; bottom?: string }) => {
  const dome = useRef<Mesh>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (dome.current) dome.current.position.copy(camera.position);
  });

  return (
    <>
      <color attach="background" args={[bottom]} />
      {/* unlit gradient dome — bloom-safe (toneMapped false), no fog; follows the camera */}
      <mesh ref={dome} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[8000, 32, 16]} />
        <meshBasicMaterial side={BackSide} depthWrite={false} toneMapped={false} fog={false}>
          <GradientTexture stops={[0, 1]} colors={[top, bottom]} />
        </meshBasicMaterial>
      </mesh>
      <ambientLight intensity={0.8} />
      <hemisphereLight color="#cfe8ff" groundColor="#9fb6c9" intensity={0.7} />
      <directionalLight position={[80, 130, 50]} intensity={1.15} />
    </>
  );
};
