import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TransformControls } from '@react-three/drei';
import type { Group } from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import type { ThreeEvent } from '@react-three/fiber';
import { useWorldSelectStore } from '../../stores/worldSelectStore';
import { gizmoState, pointerOnGizmo, releaseGizmoPointer } from './gizmoState';
import { registerNode, unregisterNode, snapshotExtras, applyBatchDelta, getNode, type BatchStart } from './nodeDragRegistry';

// Kit — a gizmo-movable world placement whose moves write BACK into the owning data store (not a
// sceneEditStore override). Renders the visual at `position` (the data value); clicking selects it
// (worldSelectStore); Shift/Ctrl-click adds it to a multi-selection that the primary's gizmo moves together.
// When the primary is selected, a drei translate TransformControls is attached and every change calls
// `onMove([x,y,z])` → the caller persists it (e.g. updatePathNode / updateParticipant / objective marker). So
// numeric fields + gizmo + runtime stay in sync. Selection shows a bright marker (primary) / cyan (extra).
// Used by PathDebugLayer nodes / ActivityArenaRenderer / EncounterMarkerRenderer / QuestMarkerRenderer.
interface DataBackedPlacementProps {
  objKey: string;
  position: [number, number, number];
  onMove: (pos: [number, number, number]) => void;
  onDelete?: () => void; // when set, the Delete key / inspector removes this placement from its data store
  color?: string;
  children: ReactNode;
}

export function DataBackedPlacement({ objKey, position, onMove, onDelete, color = '#a855f7', children }: DataBackedPlacementProps) {
  const selectedKey = useWorldSelectStore((s) => s.selectedKey);
  const isExtra = useWorldSelectStore((s) => s.extraKeys.includes(objKey));
  const [obj, setObj] = useState<Group | null>(null);
  const ctrlRef = useRef<TransformControlsImpl | null>(null);
  const selected = selectedKey === objKey;

  // Register this placement so a multi-select primary can read its live position + move it during a batch drag.
  // Refs keep the registry entry stable while position/onMove change per render.
  const latest = useRef({ position, onMove });
  useEffect(() => { latest.current = { position, onMove }; });
  useEffect(() => {
    registerNode(objKey, { getPos: () => latest.current.position, move: (p) => latest.current.onMove(p) });
    return () => unregisterNode(objKey);
  }, [objKey]);

  // Drag-start snapshot of the primary + every extra, so batch deltas are stable across the drag.
  const starts = useRef<BatchStart | null>(null);

  useEffect(() => {
    const release = () => {
      starts.current = null;
      releaseGizmoPointer();
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('blur', release);
      if (gizmoState.controls === ctrlRef.current) gizmoState.controls = null;
      ctrlRef.current = null;
      releaseGizmoPointer();
    };
  }, []);

  const handleSelect = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== undefined && e.button !== 0) return; // left button only
    if (pointerOnGizmo()) return; // click is on a gizmo handle → operate the gizmo, don't reselect behind it
    e.stopPropagation();
    const ne = e.nativeEvent as PointerEvent;
    if (ne.shiftKey || ne.ctrlKey || ne.metaKey) useWorldSelectStore.getState().toggle(objKey, onDelete ?? null);
    else useWorldSelectStore.getState().select(objKey, onDelete ?? null);
  };

  const markerColor = isExtra ? '#22d3ee' : color;
  return (
    <>
      <group ref={setObj} position={position} onPointerDown={handleSelect}>
        {children}
        {/* Small invisible grab proxy so close-together placements (e.g. path nodes) are each individually
            clickable and the gizmo handle isn't occluded. Selection is shown by a tight marker below. */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {(selected || isExtra) && (
          <mesh position={[0, 0.3, 0]} renderOrder={999} onUpdate={(self) => { const mm = self.material as { depthTest?: boolean }; mm.depthTest = false; }}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <meshBasicMaterial color={markerColor} transparent opacity={0.5} depthTest={false} />
          </mesh>
        )}
      </group>
      {selected && obj && (
        <TransformControls
          // Register the active controls so pointerOnGizmo() protects the drag (clicks near a handle no longer
          // steal selection) — same as SceneEditorGizmo. Clear on unmount only if we're still the active one.
          ref={(c) => {
            const ctrl = (c as unknown as TransformControlsImpl) ?? null;
            if (ctrl) { ctrlRef.current = ctrl; gizmoState.controls = ctrl; }
            else { if (gizmoState.controls === ctrlRef.current) gizmoState.controls = null; ctrlRef.current = null; }
          }}
          object={obj}
          mode="translate"
          onMouseDown={() => {
            const extraKeys = useWorldSelectStore.getState().extraKeys;
            starts.current = { primary: [obj.position.x, obj.position.y, obj.position.z], extras: snapshotExtras(extraKeys) };
          }}
          onMouseUp={() => {
            starts.current = null;
            releaseGizmoPointer();
          }}
          onObjectChange={() => {
            const cur: [number, number, number] = [obj.position.x, obj.position.y, obj.position.z];
            onMove(cur);
            const st = starts.current;
            if (!st || st.extras.length === 0) return;
            for (const { key, pos } of applyBatchDelta(st, cur)) getNode(key)?.move(pos);
          }}
        />
      )}
    </>
  );
}
