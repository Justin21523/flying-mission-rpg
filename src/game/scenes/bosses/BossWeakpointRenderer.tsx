import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useBossStore } from '../../../stores/game/useBossStore';
import { liveTargets } from '../../../stores/game/combatTargetStore';
import { liveWeakpointEntries } from '../../bosses/BossWeakpointController';
import { getWeakpoint } from '../../../stores/game/useBossEditorStore';
import type { WeakpointMarkerGeometry } from '../../../types/game/boss';

// Boss weakpoint markers (Batch F) — ring / diamond / crosshair meshes that pulse when exposed, hidden while
// not exposed, removed when destroyed. Follows each weakpoint's CombatTarget.
function Marker({ targetId, geometry, color, exposed }: { targetId: string; geometry: WeakpointMarkerGeometry; color: string; exposed: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const opacity = exposed ? 0.95 : 0.22;
  const emissiveIntensity = exposed ? 1.5 : 0.25;
  useFrame((state) => {
    const t = liveTargets.find((x) => x.id === targetId);
    if (ref.current && t) {
      ref.current.position.set(t.x, t.y, t.z);
      const s = exposed ? 1 + Math.sin(state.clock.elapsedTime * 6) * 0.15 : 0.6;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <group ref={ref}>
      {geometry === 'ring' && <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.6, 0.08, 8, 24]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} transparent opacity={opacity} toneMapped={false} /></mesh>}
      {geometry === 'diamond' && <mesh><octahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} transparent opacity={opacity} toneMapped={false} /></mesh>}
      {(geometry === 'crosshair' || geometry === 'sphere') && (
        <>
          <mesh><sphereGeometry args={[0.3, 12, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} transparent opacity={opacity} toneMapped={false} /></mesh>
          {geometry === 'crosshair' && <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.55, 0.04, 6, 20]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} transparent opacity={opacity} toneMapped={false} /></mesh>}
        </>
      )}
    </group>
  );
}

export const BossWeakpointRenderer = () => {
  useBossStore((s) => s.version);
  const entries = liveWeakpointEntries().filter((e) => e.state !== 'destroyed');
  return (
    <>
      {entries.map((e) => {
        const def = getWeakpoint(e.id);
        return <Marker key={e.id} targetId={e.targetId} geometry={def?.visual.markerGeometry ?? 'ring'} color={def?.visual.color ?? '#f87171'} exposed={e.state === 'exposed'} />;
      })}
    </>
  );
};
