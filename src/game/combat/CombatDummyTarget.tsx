import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Group, type Mesh, type MeshStandardMaterial } from 'three';
import { useCombatTargetStore, liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';
import { getDamageable } from '../../stores/game/editorCombatStore';

// Renders the live dummy combat targets. Each target body + HP (and shield) bar updates per-frame from the
// mutable target record (hp/shield change in place without store writes; the store only bumps `version` when
// the SET changes — spawn/defeat). On defeat the body shrinks into a quick poof.

const DummyTarget = ({ target }: { target: CombatTarget }) => {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const hpRef = useRef<Mesh>(null);
  const shieldRef = useRef<Mesh>(null);
  const def = getDamageable(target.definitionId);
  const color = def?.editorMeta?.color ?? '#94a3b8';
  const hasShield = (target.maxShield ?? 0) > 0;

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    if (target.defeatedAt) {
      const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 - target.defeatedAt;
      const k = Math.max(0, 1 - t / 0.5);
      g.scale.setScalar(k);
      return;
    }
    if (hpRef.current) hpRef.current.scale.x = Math.max(0.001, target.hp / target.maxHp);
    if (shieldRef.current && hasShield) shieldRef.current.scale.x = Math.max(0.001, target.shield / target.maxShield);
    const body = bodyRef.current?.material as MeshStandardMaterial | undefined;
    if (body) body.emissiveIntensity = 0.2;
  });

  return (
    <group ref={groupRef} position={[target.x, target.y, target.z]}>
      <mesh ref={bodyRef} position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.6, 1, 6, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* HP bar (red bg + green fill) */}
      <group position={[0, 2.4, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.4, 0.16]} />
          <meshBasicMaterial color="#3f1d1d" depthWrite={false} />
        </mesh>
        <mesh ref={hpRef} position={[-0.7, 0, 0.01]}>
          <planeGeometry args={[1.4, 0.16]} />
          <meshBasicMaterial color="#22c55e" depthWrite={false} />
        </mesh>
      </group>
      {hasShield && (
        <group position={[0, 2.62, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.4, 0.1]} />
            <meshBasicMaterial color="#1e3a5f" depthWrite={false} />
          </mesh>
          <mesh ref={shieldRef} position={[-0.7, 0, 0.01]}>
            <planeGeometry args={[1.4, 0.1]} />
            <meshBasicMaterial color="#38bdf8" depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export const CombatDummyTargetLayer = () => {
  // Re-render when the SET of targets changes (spawn / defeat sweep).
  useCombatTargetStore((s) => s.version);
  return (
    <>
      {liveTargets.map((t) => (
        <DummyTarget key={t.id} target={t} />
      ))}
    </>
  );
};
