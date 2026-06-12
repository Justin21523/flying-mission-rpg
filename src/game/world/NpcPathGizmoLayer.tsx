import { useUiStore } from '../../stores/uiStore';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import type { EditorNpc } from '../../types/editorNPC';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';

// POLI (Phase S) — Edit-Mode gizmos for NPC movement authoring: drag each path waypoint in 3D, and see a
// range ring for wander / guard zones. Renders only in Edit Mode, for NPCs in this area whose movement uses
// them. Each path point is a DataBackedPlacement (drag → writes back to npc.paths). Sibling in AreaRenderer.

export const NpcPathGizmoLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const npcs = useEditorNpcStore((s) => s.addedNpcs);
  if (!editMode) return null;
  const here = npcs.filter((n) => n.areaId === areaId && (n.movement === 'paths' || n.movement === 'wander' || n.movement === 'guard'));
  if (here.length === 0) return null;
  return <>{here.map((n) => <NpcMovementGizmos key={n.id} npc={n} />)}</>;
};

const RING_Y = 0.12;
const Ring = ({ x, z, r, color }: { x: number; z: number; r: number; color: string }) => (
  <mesh position={[x, RING_Y, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
    <ringGeometry args={[Math.max(0.2, r - 0.25), r, 48]} />
    <meshBasicMaterial color={color} transparent opacity={0.5} side={2} depthWrite={false} />
  </mesh>
);

const NpcMovementGizmos = ({ npc }: { npc: EditorNpc }) => {
  const update = useEditorNpcStore((s) => s.updateNpc);

  if (npc.movement === 'wander') {
    const [x, , z] = npc.position;
    return <Ring x={x} z={z} r={npc.wanderRadius ?? 12} color="#38bdf8" />;
  }
  if (npc.movement === 'guard') {
    const [x, , z] = npc.position;
    return <Ring x={x} z={z} r={npc.guardLeash ?? 10} color="#f59e0b" />;
  }

  // paths — a draggable gizmo per waypoint (writes back to npc.paths[pi].points[ki].pos).
  const paths = npc.paths ?? [];
  const movePoint = (pi: number, ki: number, pos: [number, number, number]) => {
    const next = paths.map((p, j) => (j === pi ? { ...p, points: p.points.map((q, k) => (k === ki ? { ...q, pos } : q)) } : p));
    update(npc.id, { paths: next });
  };
  const removePoint = (pi: number, ki: number) => {
    const next = paths.map((p, j) => (j === pi ? { ...p, points: p.points.filter((_, k) => k !== ki) } : p));
    update(npc.id, { paths: next });
  };
  return (
    <>
      {paths.map((path, pi) => path.points.map((pt, ki) => (
        <DataBackedPlacement
          key={`${npc.id}#${pi}#${ki}`}
          objKey={`${npc.id}#path#${pi}#${ki}`}
          position={pt.pos}
          color="#22d3ee"
          onMove={(p) => movePoint(pi, ki, p)}
          onDelete={() => removePoint(pi, ki)}
        >
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.3, 12, 10]} />
            <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.6} />
          </mesh>
        </DataBackedPlacement>
      )))}
    </>
  );
};
