import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { type Group } from 'three';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { useCombatSpawnStore, liveSpawns, type CombatSpawn } from '../../stores/game/combatSpawnStore';

// Renders the live model-driven combat spawns (projectiles / summons / terrain) as REAL GLB models. Each
// entity follows its mutable spawn record (moved by CombatDirector.tickCombatSpawns) via a per-frame ref
// update — no per-frame store writes. A missing/blank modelAssetId falls back to a glowing geometry bolt so
// a skill is never invisible.

const SpawnGlb = ({ assetId, scale }: { assetId: string; scale: number }) => {
  const asset = resolveModelAsset(assetId);
  const { scene } = useGLTF(encodeURI(asset?.path ?? ''));
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const assetScale = asset?.scale;
  const baseScale = (typeof assetScale === 'number' ? assetScale : Array.isArray(assetScale) ? assetScale[0] : 1) * scale;
  return <primitive object={cloned} scale={baseScale} />;
};

const GeometryBolt = ({ color, kind }: { color: string; kind: CombatSpawn['kind'] }) => {
  if (kind === 'terrain') return <mesh><boxGeometry args={[1.4, 1.6, 1.4]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} /></mesh>;
  if (kind === 'summon') return <mesh><octahedronGeometry args={[0.6, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} /></mesh>;
  return <mesh><sphereGeometry args={[0.4, 12, 8]} /><meshBasicMaterial color={color} /></mesh>;
};

const SpawnEntity = ({ spawn }: { spawn: CombatSpawn }) => {
  const groupRef = useRef<Group>(null);
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(spawn.x, spawn.y, spawn.z);
    if (spawn.kind === 'projectile') g.rotation.y = Math.atan2(spawn.vx, spawn.vz);
    else g.rotation.y += 0.04;
  });
  return (
    <group ref={groupRef} position={[spawn.x, spawn.y, spawn.z]}>
      {spawn.modelAssetId ? (
        <Suspense fallback={<GeometryBolt color={spawn.color} kind={spawn.kind} />}>
          <SpawnGlb assetId={spawn.modelAssetId} scale={spawn.scale} />
        </Suspense>
      ) : (
        <GeometryBolt color={spawn.color} kind={spawn.kind} />
      )}
    </group>
  );
};

export const CombatSpawnLayer = () => {
  // Re-render when the SET of spawns changes (spawn / despawn).
  useCombatSpawnStore((s) => s.version);
  return (
    <>
      {liveSpawns.map((s) => (
        <SpawnEntity key={s.id} spawn={s} />
      ))}
    </>
  );
};
