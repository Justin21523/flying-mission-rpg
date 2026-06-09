import { BackSide, MeshBasicMaterial } from 'three';
import { Sky, GradientTexture, Clouds, Cloud, Environment } from '@react-three/drei';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import { resolveAreaEnvironment, sunPositionFrom } from '../environment/resolveAreaEnvironment';
import { resolveHdriUrl } from './hdriLibrary';

// Phase 98a — pure-visual backdrop for the current area: a stable drei <Sky> dome (or vertical
// gradient / solid colour), plus a large ground-catch plane so the map edges never reveal void.
// Reads the per-area Environment override live, so editing the sky in the hub updates instantly.
// scene.background itself is owned by DynamicAmbience / EditModeAmbience (kept a stable colour when
// the mode isn't 'dynamic'); this component only adds meshes. Mounted in both play and edit ambience.
export const EnvironmentBackdrop = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const editMode = useUiStore((s) => s.editMode);
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
          {/* Realistic scattered cumulus (Play Mode only — hidden in Edit Mode so they never obscure editing).
              Unlit (MeshBasicMaterial) → stays bright white; instanced; drift slowly; puffy outward edges. */}
          {!editMode && (
          <Clouds material={MeshBasicMaterial} limit={400} range={400} frustumCulled={false}>
            <Cloud seed={1} segments={48} bounds={[150, 14, 150]} volume={32} smallestVolume={0.5} concentrate="outside" growth={6} opacity={0.85} fade={220} speed={0.05} color="#ffffff" position={[-30, 58, -70]} />
            <Cloud seed={2} segments={42} bounds={[130, 12, 130]} volume={26} smallestVolume={0.4} concentrate="outside" growth={6} opacity={0.78} fade={220} speed={0.04} color="#f4f7fb" position={[110, 70, 30]} />
            <Cloud seed={3} segments={40} bounds={[140, 12, 140]} volume={28} smallestVolume={0.4} concentrate="outside" growth={5} opacity={0.8} fade={220} speed={0.05} color="#ffffff" position={[-120, 64, 60]} />
            <Cloud seed={4} segments={36} bounds={[110, 10, 110]} volume={20} smallestVolume={0.3} concentrate="outside" growth={5} opacity={0.7} fade={220} speed={0.03} color="#eef2f8" position={[40, 82, 130]} />
            <Cloud seed={5} segments={34} bounds={[100, 10, 100]} volume={18} smallestVolume={0.3} concentrate="outside" growth={5} opacity={0.72} fade={220} speed={0.04} color="#ffffff" position={[150, 54, -120]} />
            <Cloud seed={6} segments={30} bounds={[90, 9, 90]} volume={15} smallestVolume={0.3} concentrate="outside" growth={4} opacity={0.66} fade={220} speed={0.03} color="#f4f7fb" position={[-150, 76, -40]} />
          </Clouds>
          )}
        </>
      )}

      {/* Photoreal HDRI panorama (CC0 .hdr/.exr dropped in public/hdri or src/assets/hdri) — sets the sky
          background AND image-based lighting. Mounts after the background colour so it owns scene.background. */}
      {env.backgroundMode === 'hdri' && resolveHdriUrl(env.hdriUrl) && (
        <Environment files={resolveHdriUrl(env.hdriUrl)!} background />
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
