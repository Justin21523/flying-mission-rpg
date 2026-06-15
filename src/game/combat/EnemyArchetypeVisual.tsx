import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import type { CombatTarget } from '../../stores/game/combatTargetStore';

// Geometry archetype accents drawn alongside the enemy GLB body (Batch C, model-first). Crusher = forward
// charge cone that elongates while winding up / charging; Turret = rotating head + barrel that glows before
// firing; Shield Carrier = front shield arc that flickers on hit + segments away when broken (exposing a
// core marker while stunned). Driven by the target's aiState / facingRad / shieldBroken.

export const EnemyArchetypeVisual = ({ target }: { target: CombatTarget }) => {
  const groupRef = useRef<Group>(null);
  const accentRef = useRef<Mesh>(null);

  useFrame(() => {
    const g = groupRef.current;
    if (g) g.rotation.y = target.facingRad ?? 0;
    const a = accentRef.current;
    if (!a) return;
    const st = target.aiState;
    if (target.archetype === 'crusher-drone') {
      const charging = st === 'charging' || st === 'charge-windup';
      a.scale.z = charging ? 2.4 : 1;
      (a.material as MeshStandardMaterial).emissiveIntensity = charging ? 1.2 : 0.3;
    } else if (target.archetype === 'pulse-turret') {
      const firing = st === 'firing' || st === 'cooldown';
      a.scale.setScalar(firing ? 1.3 : 1);
      (a.material as MeshStandardMaterial).emissiveIntensity = firing ? 1.4 : 0.5;
    }
  });

  if (target.archetype === 'crusher-drone') {
    return (
      <group ref={groupRef} position={[target.x, target.y, target.z]}>
        <mesh ref={accentRef} position={[0, 0.6, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.4, 1.4, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} transparent opacity={0.7} />
        </mesh>
      </group>
    );
  }
  if (target.archetype === 'pulse-turret') {
    return (
      <group ref={groupRef} position={[target.x, target.y + 1.4, target.z]}>
        <mesh ref={accentRef}>
          <boxGeometry args={[0.7, 0.5, 0.7]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.7]}>
          <cylinderGeometry args={[0.12, 0.12, 1, 10]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
        </mesh>
      </group>
    );
  }
  if (target.archetype === 'shield-carrier') {
    const broken = target.shieldBroken;
    return (
      <group ref={groupRef} position={[target.x, target.y + 1, target.z]}>
        {!broken && (
          <mesh position={[0, 0, 1]} rotation={[0, 0, 0]}>
            <torusGeometry args={[1, 0.14, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.7} transparent opacity={0.6} side={DoubleSide} />
          </mesh>
        )}
        {broken && target.aiState === 'stunned' && (
          <mesh position={[0, 0.4, 0]}>
            <octahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={1} />
          </mesh>
        )}
      </group>
    );
  }
  return null;
};
