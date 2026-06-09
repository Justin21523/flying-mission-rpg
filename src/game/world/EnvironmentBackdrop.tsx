import { BackSide, MeshBasicMaterial } from 'three';
import { Sky, GradientTexture, Clouds, Cloud } from '@react-three/drei';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import { resolveAreaEnvironment, sunPositionFrom } from '../environment/resolveAreaEnvironment';

// Phase 98a — pure-visual backdrop for the current area: a stable drei <Sky> dome (or vertical
// gradient / solid colour), plus a large ground-catch plane so the map edges never reveal void.
// Reads the per-area Environment override live, so editing the sky in the hub updates instantly.
// scene.background itself is owned by DynamicAmbience / EditModeAmbience (kept a stable colour when
// the mode isn't 'dynamic'); this component only adds meshes. Mounted in both play and edit ambience.
export const EnvironmentBackdrop = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  // Subscribe so the backdrop re-resolves when overrides / default mode change.
  useEditorEnvironmentStore((s) => s.overrides);
  useEditorEnvironmentStore((s) => s.defaultMode);
  const env = resolveAreaEnvironment(areaId);

  if (env.isIndoor) return null; // interiors keep their own look — no sky / catch plane

  return (
    <>
      {env.backgroundMode === 'sky' && (
        <>
          <Sky
            distance={450000}
            sunPosition={sunPositionFrom(env.sunElevationDeg, env.sunAzimuthDeg)}
            turbidity={env.turbidity}
            rayleigh={env.rayleigh}
            mieCoefficient={env.mieCoefficient}
            mieDirectionalG={env.mieDirectionalG}
          />
          {/* Soft white clouds across a blue sky. Sat at a moderate altitude (not overhead) so the sky reads
              lower in view. Unlit (MeshBasicMaterial) so they stay bright white; instanced + drift slowly. */}
          <Clouds material={MeshBasicMaterial} position={[0, 60, 0]} frustumCulled={false}>
            <Cloud seed={1} segments={28} bounds={[200, 12, 200]} volume={26} color="#ffffff" opacity={0.62} fade={140} speed={0.07} position={[0, 0, -50]} />
            <Cloud seed={2} segments={22} bounds={[170, 10, 170]} volume={20} color="#f7fafc" opacity={0.5} fade={140} speed={0.05} position={[90, 8, 60]} />
            <Cloud seed={3} segments={22} bounds={[170, 10, 170]} volume={20} color="#ffffff" opacity={0.55} fade={140} speed={0.06} position={[-95, 4, 40]} />
          </Clouds>
        </>
      )}

      {env.backgroundMode === 'gradient' && (
        <mesh scale={[1, 1, 1]} renderOrder={-1}>
          <sphereGeometry args={[490, 32, 16]} />
          <meshBasicMaterial side={BackSide} depthWrite={false} toneMapped={false}>
            <GradientTexture stops={[0, 1]} colors={[env.gradientTop, env.gradientBottom]} />
          </meshBasicMaterial>
        </mesh>
      )}

      {/* Large ground-catch plane: fills the distance so gaps never show void. Sits below valleys for
          heightfield areas (groundCatchY) so the terrain never clips through it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, env.groundCatchY - 0.06, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={env.groundCatchColor} roughness={1} metalness={0} />
      </mesh>
    </>
  );
};
