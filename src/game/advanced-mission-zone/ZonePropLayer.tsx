import { useUiStore } from '../../stores/uiStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorZonePropStore } from '../../stores/game/editorZonePropStore';
import { useMergedTransform, useIsDeleted } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import type { ZonePropDefinition } from '../../types/game/zoneProp';

// World-build Wave 2 — decorative GLB props inside the advanced zones. Edit/Play parity mirrors ZoneMarkerLayer:
// in Edit Mode show the active (or first) zone's props as gizmo-draggable EditableObjects; in Play show the
// active zone's props (segment-scoped if the prop sets segmentId). Static models (no animation), no collision.
const propKey = (id: string) => objKey('zoneprop', 'item', id);
const Fallback = () => (
  <mesh position={[0, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#94a3b8" /></mesh>
);

const ZoneProp = ({ prop, editMode }: { prop: ZonePropDefinition; editMode: boolean }) => {
  const key = propKey(prop.id);
  const base = {
    position: prop.position,
    rotation: [0, ((prop.rotationY ?? 0) * Math.PI) / 180, 0] as [number, number, number],
    scale: prop.scale ?? 1,
  };
  const m = useMergedTransform(key, base);
  const deleted = useIsDeleted(key);
  if (deleted) return null;
  if (editMode) {
    return (
      <EditableObject objKey={key} base={base} assetId={prop.modelAssetId}>
        <AnimatedGlbModel assetId={prop.modelAssetId} fallback={<Fallback />} noCull />
      </EditableObject>
    );
  }
  return (
    <group position={m.position} rotation={m.rotation} scale={m.scale}>
      <AnimatedGlbModel assetId={prop.modelAssetId} fallback={<Fallback />} noCull />
    </group>
  );
};

export const ZonePropLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const activeZoneId = useAdvancedMissionZoneStore((s) => s.activeZoneId);
  const activeSegmentId = useAdvancedMissionZoneStore((s) => s.activeSegmentId);
  const props = useEditorZonePropStore((s) => s.items);

  const zoneId = editMode ? (activeZoneId ?? props[0]?.zoneId) : activeZoneId;
  if (!zoneId) return null;
  const visible = props.filter((p) => p.enabled !== false && p.zoneId === zoneId && (editMode || !p.segmentId || p.segmentId === activeSegmentId));
  return (
    <>
      {visible.map((p) => (
        <ZoneProp key={p.id} prop={p} editMode={editMode} />
      ))}
    </>
  );
};
