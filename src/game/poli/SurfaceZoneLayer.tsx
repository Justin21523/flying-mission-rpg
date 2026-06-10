import { useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { DoubleSide } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { useEditorSurfaceStore, getSurface } from '../../stores/editorSurfaceStore';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { enterSurface, exitSurface } from '../path/surfaceField';
import type { SurfaceType } from '../../types/surface';
import type { SurfaceZoneDef } from '../../types/surface';

// POLI — first-class placed surface zones. Play Mode: a flat sensor pad; the player entering it applies the
// linked SurfaceDefinition's movement multipliers (surfaceField), reverting on exit. Edit Mode: a
// DataBackedPlacement (drag → store). Sibling layer in AreaRenderer (kit seam #1).
const NO_RAYCAST = () => null;
const SURFACE_COLOR: Partial<Record<SurfaceType, string>> = {
  ice: '#bae6fd', mud: '#92400e', grass: '#65a30d', sand: '#fcd34d', water: '#38bdf8',
  boostSurface: '#22d3ee', guidedRoad: '#a855f7', asphalt: '#64748b', gravel: '#9ca3af',
};

const ZonePad = ({ z }: { z: SurfaceZoneDef }) => {
  const def = getSurface(z.surfaceId);
  const color = (def && SURFACE_COLOR[def.surfaceType]) || '#94a3b8';
  const [sx, sz] = z.size;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} raycast={NO_RAYCAST}>
      <planeGeometry args={[sx, sz]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={DoubleSide} depthWrite={false} />
    </mesh>
  );
};

const PlayZone = ({ z }: { z: SurfaceZoneDef }) => {
  const [sx, sz] = z.size;
  useEffect(() => () => { exitSurface(z.id); }, [z.id]); // clear if unmounted while the player is on it

  const fire = (enter: boolean, payload: { other: { rigidBody?: { userData?: unknown } } }) => {
    const ud = payload.other.rigidBody?.userData as { isPlayer?: boolean } | undefined;
    if (!ud?.isPlayer) return;
    if (enter) { const def = getSurface(z.surfaceId); if (def) enterSurface(z.id, def); }
    else exitSurface(z.id);
  };

  return (
    <group position={z.position}>
      <ZonePad z={z} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[sx / 2, 0.5, sz / 2]} position={[0, 0.5, 0]} sensor onIntersectionEnter={(p) => fire(true, p)} onIntersectionExit={(p) => fire(false, p)} />
      </RigidBody>
    </group>
  );
};

const EditZone = ({ z }: { z: SurfaceZoneDef }) => {
  const updateZonePosition = useEditorSurfaceStore((s) => s.updateZonePosition);
  return (
    <DataBackedPlacement objKey={`${z.id}#surfzone`} position={z.position} color="#22d3ee" onMove={(p) => updateZonePosition(z.id, p)}>
      <ZonePad z={z} />
    </DataBackedPlacement>
  );
};

export const SurfaceZoneLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const zones = useEditorSurfaceStore((s) => s.zones).filter((z) => z.areaId === areaId && (editMode || z.enabled));
  if (zones.length === 0) return null;
  return <>{zones.map((z) => (editMode ? <EditZone key={z.id} z={z} /> : <PlayZone key={z.id} z={z} />))}</>;
};
