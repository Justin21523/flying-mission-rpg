import { create } from 'zustand';
import type { PathDefinition } from '../types/path';
import { PATH_SEED } from '../data/poli/boostPathsSeed';

// POLI (Phase B) — curve-based guided paths (Test Straight / Test Curve seeded; more via the Phase-D editor).
// Auto-persisted; imported/exported through the editor content registry (domain 'editorPath') and tracked for
// Undo. Node drags in the PathDebugLayer write back here via updatePathNode → the cached curve rebuilds live.
interface EditorPathState {
  paths: PathDefinition[];
  updatePath: (id: string, patch: Partial<PathDefinition>) => void;
  updatePathNode: (pathId: string, nodeId: string, position: [number, number, number]) => void;
  removePath: (id: string) => void;
  importState: (data: { paths?: PathDefinition[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-path-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function persist(paths: PathDefinition[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ paths })); } catch { /* ignore */ }
}
function load(): PathDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.paths)) return p.paths; }
  } catch { /* ignore */ }
  return clone(PATH_SEED);
}

export const useEditorPathStore = create<EditorPathState>((set, get) => {
  const save = () => persist(get().paths);
  return {
    paths: load(),
    updatePath: (id, patch) => { set({ paths: get().paths.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    updatePathNode: (pathId, nodeId, position) => {
      set({
        paths: get().paths.map((p) =>
          p.id === pathId ? { ...p, nodes: (p.nodes ?? []).map((n) => (n.id === nodeId ? { ...n, position } : n)) } : p,
        ),
      });
      save();
    },
    removePath: (id) => { set({ paths: get().paths.filter((p) => p.id !== id) }); save(); },
    importState: (data) => { set({ paths: Array.isArray(data.paths) ? data.paths : get().paths }); save(); },
    reset: () => { set({ paths: clone(PATH_SEED) }); save(); },
  };
});

export function getPaths(): PathDefinition[] { return useEditorPathStore.getState().paths; }
export function getPath(id: string): PathDefinition | undefined { return useEditorPathStore.getState().paths.find((p) => p.id === id); }
