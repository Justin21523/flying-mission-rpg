import { useCallback, useEffect, useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { gizmoState, releaseGizmoPointer } from './gizmoState';
import type { Vec3 } from './sceneEditMerge';

// Phase 89 / Phase 101 — the single transform gizmo for Edit Mode. Attaches to the primary
// selected EditableObject. When extras are shift-selected, the primary's drag delta is applied
// to every extra too (batch move / rotate / scale). drei auto-disables OrbitControls while
// dragging. W/E/R switch mode (see App.tsx).

interface Snap { pos: Vec3; rot: Vec3; scale: Vec3 }
const snap = (o: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; scale: { x: number; y: number; z: number } }): Snap =>
  ({ pos: [o.position.x, o.position.y, o.position.z], rot: [o.rotation.x, o.rotation.y, o.rotation.z], scale: [o.scale.x, o.scale.y, o.scale.z] });

// onCommit (optional) fires when a drag finishes (pointer up) with the current selected key — lets a host
// bake the resulting sceneEditStore override into its own authored data (e.g. the transformation timeline).
// onChange is sparse/live and lets hosts persist current-time edits while a drag is active.
export function SceneEditorGizmo({ onCommit, onChange }: { onCommit?: (key: string) => void; onChange?: (key: string) => void } = {}) {
  const selectedObject = useSceneEditStore((s) => s.selectedObject);
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const mode = useSceneEditStore((s) => s.mode);
  const setOverride = useSceneEditStore((s) => s.setOverride);

  // Snapshot every selected object's transform at drag start so batch deltas are stable.
  const starts = useRef<{ primary: Snap; extras: { key: string; snap: Snap }[] } | null>(null);
  const ctrlRef = useRef<TransformControlsImpl | null>(null);

  const onMouseDown = useCallback(() => {
    const s = useSceneEditStore.getState();
    s.pushHistory(true);
    if (s.selectedObject) {
      starts.current = {
        primary: snap(s.selectedObject),
        extras: s.extraSelected.map((e) => ({ key: e.key, snap: snap(e.object) })),
      };
    }
  }, []);

  const finishDrag = useCallback(() => {
    const s = useSceneEditStore.getState();
    const key = s.selectedKey;
    if (key) onCommit?.(key);
    for (const ex of s.extraSelected) onCommit?.(ex.key);
    starts.current = null;
    releaseGizmoPointer();
  }, [onCommit]);

  const onObjectChange = useCallback(() => {
    const s = useSceneEditStore.getState();
    const o = s.selectedObject;
    const key = s.selectedKey;
    if (!o || !key) return;
    setOverride(key, {
      position: [o.position.x, o.position.y, o.position.z],
      rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
      scale: [o.scale.x, o.scale.y, o.scale.z], // per-axis so non-uniform scaling persists + copies exactly
    });
    onChange?.(key);
    // Apply the primary's delta to each batch-selected extra (per-axis scale ratio).
    const st = starts.current;
    if (!st || st.extras.length === 0) return;
    const dp: Vec3 = [o.position.x - st.primary.pos[0], o.position.y - st.primary.pos[1], o.position.z - st.primary.pos[2]];
    const dr: Vec3 = [o.rotation.x - st.primary.rot[0], o.rotation.y - st.primary.rot[1], o.rotation.z - st.primary.rot[2]];
    const sr: Vec3 = [
      st.primary.scale[0] !== 0 ? o.scale.x / st.primary.scale[0] : 1,
      st.primary.scale[1] !== 0 ? o.scale.y / st.primary.scale[1] : 1,
      st.primary.scale[2] !== 0 ? o.scale.z / st.primary.scale[2] : 1,
    ];
    for (const ex of st.extras) {
      setOverride(ex.key, {
        position: [ex.snap.pos[0] + dp[0], ex.snap.pos[1] + dp[1], ex.snap.pos[2] + dp[2]],
        rotation: [ex.snap.rot[0] + dr[0], ex.snap.rot[1] + dr[1], ex.snap.rot[2] + dr[2]],
        scale: [ex.snap.scale[0] * sr[0], ex.snap.scale[1] * sr[1], ex.snap.scale[2] * sr[2]],
      });
      onChange?.(ex.key);
    }
  }, [setOverride, onChange]);

  useEffect(() => {
    const release = () => {
      if (!starts.current) {
        releaseGizmoPointer();
        return;
      }
      finishDrag();
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
  }, [finishDrag]);

  if (!selectedObject || !selectedKey) return null;

  // Register the controls so selection handlers can tell when the pointer is over a gizmo handle.
  return (
    <TransformControls
      ref={(c) => {
        const ctrl = (c as unknown as TransformControlsImpl) ?? null;
        if (ctrl) {
          ctrlRef.current = ctrl;
          gizmoState.controls = ctrl;
        } else {
          if (gizmoState.controls === ctrlRef.current) gizmoState.controls = null;
          ctrlRef.current = null;
        }
      }}
      object={selectedObject}
      mode={mode}
      onMouseDown={onMouseDown}
      onMouseUp={finishDrag}
      onObjectChange={onObjectChange}
    />
  );
}
