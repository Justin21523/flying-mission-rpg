// Registry that lets the PRIMARY DataBackedPlacement move its Shift-selected EXTRAS in one drag. Each mounted
// placement registers a live position getter + its persist callback under its objKey; when the primary's gizmo
// drags, it snapshots every extra's start position and applies its own delta to each (applyBatchDelta), writing
// back through the registered `move`. Module-level (not a store) — it's per-frame drag plumbing, never rendered.

export interface NodeDragEntry {
  getPos: () => [number, number, number];
  move: (pos: [number, number, number]) => void;
}

const registry = new Map<string, NodeDragEntry>();

export function registerNode(key: string, entry: NodeDragEntry): void {
  registry.set(key, entry);
}
export function unregisterNode(key: string): void {
  registry.delete(key);
}
export function getNode(key: string): NodeDragEntry | undefined {
  return registry.get(key);
}

export interface BatchStart {
  primary: [number, number, number];
  extras: { key: string; start: [number, number, number] }[];
}

// Pure core: each extra's new position = its drag-start + (primary's current − primary's start). Tested.
export function applyBatchDelta(start: BatchStart, current: [number, number, number]): { key: string; pos: [number, number, number] }[] {
  const dx = current[0] - start.primary[0];
  const dy = current[1] - start.primary[1];
  const dz = current[2] - start.primary[2];
  return start.extras.map((e) => ({ key: e.key, pos: [e.start[0] + dx, e.start[1] + dy, e.start[2] + dz] }));
}

// Snapshot the start positions of every still-registered extra key (skips any that unmounted).
export function snapshotExtras(extraKeys: readonly string[]): { key: string; start: [number, number, number] }[] {
  const out: { key: string; start: [number, number, number] }[] = [];
  for (const k of extraKeys) {
    const e = registry.get(k);
    if (e) out.push({ key: k, start: e.getPos() });
  }
  return out;
}
