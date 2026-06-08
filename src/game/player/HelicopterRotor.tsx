import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useTransformStore } from '../../stores/transformStore';
import { playerMotion } from './playerMotion';

// Procedural helicopter rotor built from primitives — a top main rotor (hub + 3 blades + a mast) and
// a small tail rotor. Rendered by PlayerMesh only while the active flyer is in flight. Per the
// confirmed rule it spins ONLY while moving (any flight key held); when hovering motionless it's
// visible but still.
const SPIN = 26; // rad/s when moving

export const HelicopterRotor = () => {
  const mainRef = useRef<Group>(null);
  const tailRef = useRef<Group>(null);

  useFrame((_, dt) => {
    const flying = useTransformStore.getState().flying;
    if (!flying || !playerMotion.moving) return; // still when hovering / grounded
    const d = SPIN * Math.min(dt, 0.05);
    if (mainRef.current) mainRef.current.rotation.y += d;
    if (tailRef.current) tailRef.current.rotation.x += d * 1.6;
  });

  return (
    <group>
      {/* Mast lifting the rotor above the body */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#444b55" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Main rotor (spins around Y) */}
      <group ref={mainRef} position={[0, 2.32, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.12, 10]} />
          <meshStandardMaterial color="#2b3038" metalness={0.7} roughness={0.3} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[2.4, 0.03, 0.16]} />
            <meshStandardMaterial color="#1f242b" metalness={0.3} roughness={0.6} />
          </mesh>
        ))}
      </group>
      {/* Tail rotor (spins around X) */}
      <group ref={tailRef} position={[0, 1.5, -1.3]}>
        {[0, 1].map((i) => (
          <mesh key={i} rotation={[(i * Math.PI) / 2, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.06]} />
            <meshStandardMaterial color="#1f242b" />
          </mesh>
        ))}
      </group>
    </group>
  );
};
