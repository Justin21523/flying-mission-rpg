import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, type Mesh } from 'three';
import { GradientTexture } from '@react-three/drei';

// Open-sky ambience for the high-altitude world flight. The ground-area DynamicAmbience uses a short fog
// range that whites out everything at altitude, and a tone-mapped drei <Sky> gets blown out by Bloom — both
// caused the "all white" bug. Instead we paint an UNLIT vertical gradient dome (meshBasicMaterial +
// toneMapped:false, like the kit's EnvironmentBackdrop gradient path): predictable blue sky above, pale
// horizon, no whiteout. The dome follows the camera so it always surrounds the craft. Props (from the 🌦
// Environment tab via WorldFlightEnvironment) recolour the sky, set a far/soft fog, and dial the lights.
export const WorldSkyAmbience = ({
  top = '#3f8fe0',
  bottom = '#cfe7ff',
  fog,
  fogNear,
  fogFar,
  ambient = 0.8,
  sun = 1.15,
}: {
  top?: string;
  bottom?: string;
  fog?: string;
  fogNear?: number;
  fogFar?: number;
  ambient?: number;
  sun?: number;
}) => {
  const dome = useRef<Mesh>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (dome.current) dome.current.position.copy(camera.position);
  });

  return (
    <>
      <color attach="background" args={[bottom]} />
      {/* optional far/soft fog (only when authored) — kept far so it never whites out the view */}
      {fogFar && fogFar > 0 && <fog attach="fog" args={[fog ?? bottom, fogNear ?? 2200, fogFar]} />}
      {/* unlit gradient dome — bloom-safe (toneMapped false); follows the camera */}
      <mesh ref={dome} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[8000, 32, 16]} />
        <meshBasicMaterial side={BackSide} depthWrite={false} toneMapped={false} fog={false}>
          <GradientTexture stops={[0, 1]} colors={[top, bottom]} />
        </meshBasicMaterial>
      </mesh>
      <ambientLight intensity={ambient} />
      <hemisphereLight color="#cfe8ff" groundColor="#9fb6c9" intensity={0.7} />
      <directionalLight position={[80, 130, 50]} intensity={sun} />
    </>
  );
};
