import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useUiStore } from '../../stores/uiStore';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useEditorCollectibleStore } from '../../stores/editorCollectibleStore';
import { useResourceStore } from '../../stores/resourceStore';
import { getWorldArea } from '../../stores/editorWorldStore';
import type { CollectibleShape, CollectibleType } from '../../types/collectible';
import { computeCollectiblePositions, computeCollectibleAirPositions } from './collectibleScatter';

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
    const pp = usePlayerStore.getState().position;
    if (!pp) return;
    const dx = pp.x - pos[0];
    const dz = pp.z - pos[2];
    const d2 = dx * dx + dz * dz;
    // Distance cull: hide + skip work when far from the player (Play Mode perf). Always shown while editing.
    const gs = useGraphicsSettingsStore.getState();
    if (gs.cullEnabled && !useUiStore.getState().editMode) {
      const lim = gs.cullRadius + 10;
      if (d2 > lim * lim) { if (g.visible) g.visible = false; return; }
      if (!g.visible) g.visible = true;
    } else if (!g.visible) g.visible = true;
    if (spin) {
      g.rotation.y += 0.03;
      g.position.y = pos[1] + 0.7 + Math.sin(state.clock.elapsedTime * 2 + pos[0]) * 0.15;
    }
    // Collection: full 3D distance so airborne collectibles require reaching their HEIGHT (fly/jump up to them),
    // while ground ones (player feet ≈ their height) still collect normally.
    const dy = (pp.y + 1) - (pos[1] + 0.7);
    const dist2 = d2 + dy * dy;
    if (dist2 < COLLECT_R * COLLECT_R) {
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
  const airCount = Math.max(0, Math.round((type.airCount ?? 0) * density));
  const minH = type.airMinHeight ?? 3, maxH = type.airMaxHeight ?? 22;
  const ground = useMemo(() => computeCollectiblePositions(areaId, type.id, count), [areaId, type.id, count]);
  const air = useMemo(() => computeCollectibleAirPositions(areaId, type.id, airCount, minH, maxH), [areaId, type.id, airCount, minH, maxH]);
  if (count <= 0 && airCount <= 0) return null;
  return (
    <>
      {ground.map((p, i) => <Collectible key={`${type.id}-${i}`} pos={p} type={type} />)}
      {air.map((p, i) => <Collectible key={`${type.id}-air-${i}`} pos={p} type={type} />)}
    </>
  );
};

export const CollectibleLayer = ({ areaId }: { areaId: string }) => {
  const types = useEditorCollectibleStore((s) => s.types);
  const density = getWorldArea(areaId)?.pickupDensity ?? 1;
  if (types.length === 0) return null;
  // key by areaId so all collectibles respawn fresh when the area changes.
  return <group key={areaId}>{types.map((t) => <TypeScatter key={t.id} areaId={areaId} type={t} density={density} />)}</group>;
};
