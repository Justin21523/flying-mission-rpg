import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Color, Mesh, type Group, type Material } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useMergedTransform, useSceneEditStore } from '../../stores/sceneEditStore';
import { pointerOnGizmo } from './gizmoState';
import type { BaseTransform } from './sceneEditMerge';

// Phase 89 — wraps a placement's visual in a selectable group positioned at the merged
// transform. Used only while Edit Mode is on. Clicking selects it (pointer events bubble
// up from the child GLB meshes); the shared SceneEditorGizmo then drives this group.

interface EditableObjectProps {
  objKey: string;
  base: BaseTransform;
  assetId?: string;   // for set-pieces (enables Ctrl+D duplicate)
  children: ReactNode;
}

export function EditableObject({ objKey, base, assetId, children }: EditableObjectProps) {
  const m = useMergedTransform(objKey, base);
  const select = useSceneEditStore((s) => s.select);
  const toggleSelect = useSceneEditStore((s) => s.toggleSelect);
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const isExtra = useSceneEditStore((s) => s.extraSelected.some((e) => e.key === objKey));
  const pendingSelectKey = useSceneEditStore((s) => s.pendingSelectKey);
  const isPendingExtra = useSceneEditStore((s) => s.pendingExtraKeys.includes(objKey));
  const groupRef = useRef<Group>(null);

  // Select on pointer-DOWN (not click): when a gizmo is already up it can capture the pointer-up, so a
  // click (down+up on the same object) never fires and selection won't switch. pointer-down is reliable.
  const handleSelect = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== undefined && e.button !== 0) return; // left button only
      // If the pointer is over (or dragging) a gizmo handle, this click belongs to the gizmo — never let it
      // re-select an object sitting behind the handle (the click must operate the gizmo on the current object).
      if (pointerOnGizmo()) return;
      e.stopPropagation();
      if (!groupRef.current) return;
      const e2 = e.nativeEvent;
      // Shift- or Ctrl/Cmd-click adds/removes from the batch selection.
      if (e2.shiftKey || e2.ctrlKey || e2.metaKey) { toggleSelect(objKey, groupRef.current, assetId ?? null); return; }
      // Plain click on an object that's ALREADY part of a multi-selection keeps the whole batch, so the gizmo
      // moves/edits them together (re-selecting just this one would break the group). Otherwise select it.
      const s = useSceneEditStore.getState();
      const inBatch = s.extraSelected.length > 0 && (s.selectedKey === objKey || s.extraSelected.some((ex) => ex.key === objKey));
      if (inBatch) return;
      select(objKey, groupRef.current, assetId ?? null);
    },
    [objKey, select, toggleSelect, assetId],
  );

  // Auto-select a just-created/duplicated piece once it mounts. Primary is set without
  // clearing extras (so a batch duplicate can restore the whole selection regardless of
  // mount order); batch-duplicate copies queued in pendingExtraKeys join the extra set.
  useEffect(() => {
    if (!groupRef.current) return;
    if (pendingSelectKey === objKey) {
      useSceneEditStore.setState({ selectedKey: objKey, selectedObject: groupRef.current, selectedAssetId: assetId ?? null });
      useSceneEditStore.getState().clearPendingSelect();
    } else if (isPendingExtra) {
      const obj = groupRef.current;
      useSceneEditStore.setState((s) => ({
        extraSelected: [...s.extraSelected.filter((e) => e.key !== objKey), { key: objKey, object: obj, assetId: assetId ?? null }],
        pendingExtraKeys: s.pendingExtraKeys.filter((k) => k !== objKey),
      }));
    }
  }, [pendingSelectKey, isPendingExtra, objKey, assetId]);

  const isPrimary = selectedKey === objKey;
  const selected = isPrimary || isExtra;

  // Phase 101 — tint the WHOLE selected object so the selection is unmistakable. Materials are
  // cloned per-mesh (so shared GLB materials aren't affected) and restored on deselect.
  useEffect(() => {
    const g = groupRef.current;
    if (!g || !selected) return;
    const tint = new Color(isPrimary ? '#a855f7' : '#06b6d4');
    const restore: Array<() => void> = [];
    g.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh || mesh.userData.__editHelper) return;
      const orig = mesh.material;
      const list = Array.isArray(orig) ? orig : [orig];
      const cloned = list.map((m) => {
        const c = (m as Material).clone();
        const cm = c as unknown as { emissive?: Color; emissiveIntensity?: number; color?: Color };
        if (cm.emissive) { cm.emissive.copy(tint); cm.emissiveIntensity = 0.7; }
        if (cm.color) cm.color.lerp(tint, 0.5);
        return c;
      });
      mesh.material = (Array.isArray(orig) ? cloned : cloned[0]) as typeof orig;
      restore.push(() => { mesh.material = orig; cloned.forEach((c) => c.dispose()); });
    });
    return () => restore.forEach((fn) => fn());
  }, [selected, isPrimary]);

  return (
    <group
      ref={groupRef}
      position={m.position}
      rotation={m.rotation}
      scale={m.scale}
      onPointerDown={handleSelect}
    >
      {children}
      {/* Small invisible grab proxy so async/tiny GLBs are still clickable — kept compact and centred so it
          no longer blocks the view or steals clicks from neighbouring objects. Once a child mesh has streamed
          in, that mesh is clickable directly (events bubble to this group). Selection is shown by the
          per-mesh tint above + the gizmo on the primary, so no obstructive wireframe box / axis cross. */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
