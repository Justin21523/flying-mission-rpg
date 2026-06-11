import { useRef, useState, type ReactNode } from 'react';
import { TransformControls } from '@react-three/drei';
import type { Group } from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import type { ThreeEvent } from '@react-three/fiber';
import { useWorldSelectStore } from '../../stores/worldSelectStore';
import { gizmoState, pointerOnGizmo } from './gizmoState';

// Kit — a gizmo-movable world placement whose moves write BACK into the owning data store (not a
// sceneEditStore override). Renders the visual at `position` (the data value); clicking selects it
// (worldSelectStore); when selected, a drei translate TransformControls is attached and every change calls
// `onMove([x,y,z])` → the caller persists it (e.g. updateParticipant / updatePoint / updateEncounter /
// objective markerPosition). So numeric fields + gizmo + runtime stay in sync. Selection also shows a
// bright wireframe box. Used by ActivityArenaRenderer / EncounterMarkerRenderer / QuestMarkerRenderer.
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
  const [obj, setObj] = useState<Group | null>(null);
  const ctrlRef = useRef<TransformControlsImpl | null>(null);
  const selected = selectedKey === objKey;

  const handleSelect = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== undefined && e.button !== 0) return; // left button only
    if (pointerOnGizmo()) return; // click is on a gizmo handle → operate the gizmo, don't reselect behind it
    e.stopPropagation();
    useWorldSelectStore.getState().select(objKey, onDelete ?? null);
  };

  return (
    <>
      <group ref={setObj} position={position} onPointerDown={handleSelect}>
        {children}
        {/* Small invisible grab proxy so close-together placements (e.g. path nodes) are each individually
            clickable and the gizmo handle isn't occluded — kept compact and centred (was a big 1.2×1.8×1.2
            box that overlapped neighbours and blocked clicks). Selection is shown by a tight marker below. */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {selected && (
          <mesh position={[0, 0.3, 0]} renderOrder={999} onUpdate={(self) => { const mm = self.material as { depthTest?: boolean }; mm.depthTest = false; }}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} depthTest={false} />
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
          onObjectChange={() => onMove([obj.position.x, obj.position.y, obj.position.z])}
        />
      )}
    </>
  );
}
