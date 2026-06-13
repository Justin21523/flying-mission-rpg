import type { TransformControls as TransformControlsImpl } from 'three-stdlib';

// POLI — the currently-mounted transform gizmo (kit SceneEditorGizmo or a DataBackedPlacement). Selection
// handlers read its hovered `.axis` / `.dragging` so that a pointer-down ON a gizmo handle never re-selects
// an object behind it (objects close together used to "steal" the click from the gizmo).
export const gizmoState: { controls: TransformControlsImpl | null } = { controls: null };

interface RuntimeGizmoPointerState { axis?: string | null; dragging?: boolean }

// True when the pointer is over (or dragging) a gizmo handle — selection clicks should be ignored then.
// `axis` (hovered handle, set on pointermove) and `dragging` are runtime fields on the controls but typed
// private in three-stdlib, so read them through a narrow cast.
export function pointerOnGizmo(): boolean {
  const c = gizmoState.controls as unknown as RuntimeGizmoPointerState | null;
  return !!c && (!!c.axis || !!c.dragging);
}

export function releaseGizmoPointer(): void {
  const c = gizmoState.controls as unknown as RuntimeGizmoPointerState | null;
  if (!c) return;
  c.axis = null;
  c.dragging = false;
}
