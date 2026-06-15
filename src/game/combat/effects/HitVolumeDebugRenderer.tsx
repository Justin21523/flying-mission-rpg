import { useCombatStore } from '../../../stores/game/useCombatStore';
import { activeDebugVolumes, type DebugHitVolume } from './combatDebugBus';
import { useNowMs } from '../useNowMs';

// Wireframe overlay of recently-cast hit volumes when showHitVolumes is on (debug). Reads the debug ring;
// each volume is drawn at its caster origin, oriented to the caster facing.
function VolumeMesh({ v }: { v: DebugHitVolume }) {
  const d = v.def;
  const color = v.color || d.debugColor || '#ffffff';
  const common = <meshBasicMaterial color={color} wireframe transparent opacity={0.6} depthWrite={false} />;
  switch (d.shape) {
    case 'sphere':
    case 'cylinder':
    case 'capsule':
    case 'ring':
      return <mesh position={[0, 0.6, 0]}><sphereGeometry args={[d.radius ?? 5, 16, 12]} />{common}</mesh>;
    case 'box':
      return <mesh position={[0, 0.6, 0]}><boxGeometry args={[d.width ?? 4, 1, d.length ?? 4]} />{common}</mesh>;
    case 'line':
      return <mesh position={[0, 0.6, (d.length ?? 12) / 2]}><boxGeometry args={[d.width ?? 1, 1, d.length ?? 12]} />{common}</mesh>;
    case 'cone':
    case 'arc':
      return <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[d.radius ?? 4, d.radius ?? 4, 16, 1, true]} />{common}</mesh>;
    default:
      return <mesh position={[0, 0.6, 0]}><sphereGeometry args={[d.radius ?? 4, 12, 8]} />{common}</mesh>;
  }
}

export const HitVolumeDebugRenderer = () => {
  const show = useCombatStore((s) => s.showHitVolumes);
  // Ticking clock so expired volumes drop without an impure call in render (debug-only, low frequency).
  const now = useNowMs(120);

  if (!show) return null;
  const volumes = activeDebugVolumes(now);
  return (
    <group>
      {volumes.map((v, i) => (
        <group key={i} position={[v.x, 0, v.z]} rotation={[0, v.headingRad, 0]}>
          <VolumeMesh v={v} />
        </group>
      ))}
    </group>
  );
};
