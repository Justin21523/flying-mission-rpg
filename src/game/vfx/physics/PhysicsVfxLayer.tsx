import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { livePhysicsObjects, update, usePhysicsVfxStore, type PhysicsVfxObject } from './PhysicsVfxDirector';

// Renders the live kinematic physics VFX objects (Batch F.6) as simple geometry meshes (box/sphere/capsule/
// cylinder) — placeholder primitives, tinted + fading per object. Ticks the integrator each frame. Re-renders
// only when the SET changes (version bump); per-frame transform/opacity mutated in place. Mounted in
// CombatRuntimeLayer.
const PhysObjMesh = ({ o }: { o: PhysicsVfxObject }) => {
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (group.current) {
      group.current.position.set(o.x, o.y + o.size * 0.5, o.z);
      group.current.rotation.set(o.rotX, o.rotY, o.rotZ);
    }
    if (matRef.current) matRef.current.opacity = o.opacity;
  });
  const panel = o.type === 'metal-panel' || o.type === 'shield-tile';
  return (
    <group ref={group}>
      <mesh>
        {o.shape === 'sphere' ? <sphereGeometry args={[o.size, 12, 12]} />
          : o.shape === 'cylinder' ? <cylinderGeometry args={[o.size * 0.4, o.size * 0.4, o.size, 8]} />
            : o.shape === 'capsule' ? <capsuleGeometry args={[o.size * 0.4, o.size, 4, 8]} />
              : <boxGeometry args={[o.size * (panel ? 1.4 : 1), o.size * (panel ? 1.6 : 1), o.size * (panel ? 0.2 : 1)]} />}
        <meshStandardMaterial ref={matRef} color={o.color} emissive={o.color} emissiveIntensity={o.type === 'energy-fragment' || o.type === 'hologram-decoy' ? 0.6 : 0.15} metalness={panel ? 0.6 : 0.2} roughness={0.5} transparent opacity={o.opacity} />
      </mesh>
    </group>
  );
};

export const PhysicsVfxLayer = () => {
  usePhysicsVfxStore((s) => s.version);
  useFrame((_, dt) => update(Math.min(0.05, dt)));
  return (
    <>
      {livePhysicsObjects.map((o) => (
        <PhysObjMesh key={o.id} o={o} />
      ))}
    </>
  );
};
