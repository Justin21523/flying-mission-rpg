import { Suspense } from 'react';
import { useEditorLayoutStore } from '../../stores/editorLayoutStore';
import type { LayoutPiece } from '../../stores/editorLayoutStore';
import { useUiStore } from '../../stores/uiStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { NormalizedGlbModel } from './NormalizedGlbModel';

// POLI — renders the ACTIVE layout preset's model placements for an area (seam #1: a sibling layer inside
// AreaRenderer). Each piece is an EditableObject so the gizmo moves/rotates/scales it (refinements persist
// in the kit sceneEditStore, keyed per piece). Switching the preset in the 🗺 World tab swaps what's shown.
export const LayoutLayer = ({ areaId }: { areaId: string }) => {
  const presets = useEditorLayoutStore((s) => s.presets[areaId]);
  const activeId = useEditorLayoutStore((s) => s.activePresetId[areaId]);
  if (!presets || presets.length === 0) return null;
  const active = presets.find((p) => p.id === activeId) ?? presets[0];
  if (!active || active.pieces.length === 0) return null;
  return <>{active.pieces.map((pc) => <LayoutPieceEntity key={pc.id} areaId={areaId} pc={pc} />)}</>;
};

const LayoutPieceEntity = ({ areaId, pc }: { areaId: string; pc: LayoutPiece }) => {
  const editMode = useUiStore((s) => s.editMode);
  const key = objKey(areaId, 'setpiece', `layout_${pc.id}`);
  const base = { position: pc.position, rotation: pc.rotation, scale: pc.scale };
  const m = useMergedTransform(key, base);

  if (editMode) {
    // Visual-only in Edit Mode so the gizmo can move it freely (no physics fighting the drag).
    return (
      <EditableObject objKey={key} base={base} assetId={pc.assetId}>
        <Suspense fallback={null}><NormalizedGlbModel assetId={pc.assetId} target={pc.normalize} /></Suspense>
      </EditableObject>
    );
  }
  // Play Mode: solid — a fixed trimesh Rapier body at the merged transform so the player collides with it.
  return (
    <Suspense fallback={null}>
      <NormalizedGlbModel
        assetId={pc.assetId}
        target={pc.normalize}
        collision={pc.collision ?? 'trimesh'}
        position={m.position}
        rotation={m.rotation}
        scale={m.scale}
      />
    </Suspense>
  );
};
