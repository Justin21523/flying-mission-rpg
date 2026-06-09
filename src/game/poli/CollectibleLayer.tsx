import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useEditorCollectibleStore } from '../../stores/editorCollectibleStore';
import { useResourceStore } from '../../stores/resourceStore';
import { getWorldArea } from '../../stores/editorWorldStore';
import type { CollectibleShape, CollectibleType } from '../../types/collectible';
import { computeCollectiblePositions } from './collectibleScatter';

// POLI seam #1g — primitive (three.js built-in geometry) collectibles. Each collectible TYPE is scattered in
// the area (count × the area's pickupDensity) and, on proximity, adds its value to a RESOURCE (resourceStore).
// Reaching a resource's threshold triggers its ability (auto) or arms it for a key. All config lives in the
// 🌤 Environment tab → Collectibles. Respawns on area re-entry (keyed by areaId).

const COLLECT_R = 1.6;

const Geometry = ({ shape, size }: { shape: CollectibleShape; size: number }) => {
  switch (shape) {
    case 'sphere': return <sphereGeometry args={[size, 16, 16]} />;
    case 'cone': return <coneGeometry args={[size, size * 2, 16]} />;
    case 'torus': return <torusGeometry args={[size, size * 0.4, 12, 24]} />;
    case 'tetra': return <tetrahedronGeometry args={[size, 0]} />;
    case 'cylinder': return <cylinderGeometry args={[size, size, size * 1.6, 16]} />;
    case 'octa': return <octahedronGeometry args={[size, 0]} />;
    case 'dodeca': return <dodecahedronGeometry args={[size, 0]} />;
    case 'icosa': return <icosahedronGeometry args={[size, 0]} />;
    case 'box':
    default: return <boxGeometry args={[size * 1.6, size * 1.6, size * 1.6]} />;
  }
};

const Collectible = ({ pos, type }: { pos: [number, number, number]; type: CollectibleType }) => {
  const ref = useRef<Group>(null);
  const taken = useRef(false);
  const spin = type.spin !== false;
  useFrame((state) => {
    const g = ref.current;
    if (!g || taken.current) return;
    if (spin) {
      g.rotation.y += 0.03;
      g.position.y = pos[1] + 0.7 + Math.sin(state.clock.elapsedTime * 2 + pos[0]) * 0.15;
    }
    const pp = usePlayerStore.getState().position;
    if (!pp) return;
    const dx = pp.x - g.position.x;
    const dz = pp.z - g.position.z;
    if (dx * dx + dz * dz < COLLECT_R * COLLECT_R) {
      taken.current = true;
      g.visible = false;
      useResourceStore.getState().add(type.resourceId, type.value);
    }
  });
  return (
    <group ref={ref} position={[pos[0], pos[1] + 0.7, pos[2]]}>
      <mesh castShadow>
        <Geometry shape={type.shape} size={type.size} />
        <meshStandardMaterial color={type.color} emissive={type.color} emissiveIntensity={type.emissive ?? 0.6} roughness={0.35} metalness={0.3} />
      </mesh>
    </group>
  );
};

const TypeScatter = ({ areaId, type, density }: { areaId: string; type: CollectibleType; density: number }) => {
  const count = Math.max(0, Math.round(type.count * density));
  const positions = useMemo(() => computeCollectiblePositions(areaId, type.id, count), [areaId, type.id, count]);
  if (count <= 0) return null;
  return <>{positions.map((p, i) => <Collectible key={`${type.id}-${i}`} pos={p} type={type} />)}</>;
};

export const CollectibleLayer = ({ areaId }: { areaId: string }) => {
  const types = useEditorCollectibleStore((s) => s.types);
  const density = getWorldArea(areaId)?.pickupDensity ?? 1;
  if (types.length === 0) return null;
  // key by areaId so all collectibles respawn fresh when the area changes.
  return <group key={areaId}>{types.map((t) => <TypeScatter key={t.id} areaId={areaId} type={t} density={density} />)}</group>;
};
