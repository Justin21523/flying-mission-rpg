import { create } from 'zustand';
import type { PathDefinition, PathNodeData } from '../types/path';
import { PATH_SEED } from '../data/poli/boostPathsSeed';
import { editorSpawn } from './sceneEditStore';
import { useWorldSelectStore } from './worldSelectStore';
import { focusCameraOn } from '../game/edit/cameraFocus';

// POLI (Phase B) — curve-based guided paths (Test Straight / Test Curve seeded; more via the Phase-D editor).
// Auto-persisted; imported/exported through the editor content registry (domain 'editorPath') and tracked for
// Undo. Node drags in the PathDebugLayer write back here via updatePathNode → the cached curve rebuilds live.
interface EditorPathState {
  paths: PathDefinition[];
  addPath: (areaId: string) => string;
  updatePath: (id: string, patch: Partial<PathDefinition>) => void;
  updatePathNode: (pathId: string, nodeId: string, position: [number, number, number]) => void;
  updateNode: (pathId: string, nodeId: string, patch: Partial<PathNodeData>) => void;
  addNode: (pathId: string) => void;
  removeNode: (pathId: string, nodeId: string) => void;
  removePath: (id: string) => void;
  importState: (data: { paths?: PathDefinition[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-path-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const camPos = (): [number, number, number] => [Math.round(editorSpawn.x * 100) / 100, 0.3, Math.round(editorSpawn.z * 100) / 100];

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
    addPath: (areaId) => {
      const id = uid('path');
      const c = camPos();
      const n0: PathNodeData = { id: uid('node'), position: [c[0] - 4, c[1], c[2]], tangentMode: 'automatic', speedMultiplier: 1, width: 2 };
      const n1: PathNodeData = { id: uid('node'), position: [c[0] + 4, c[1], c[2]], tangentMode: 'automatic', speedMultiplier: 1, width: 2 };
      const path: PathDefinition = {
        id, name: 'New Path', areaId, nodeIds: [n0.id, n1.id], nodes: [n0, n1],
        curveType: 'catmullRom', closed: false, defaultSpeed: 12, laneWidth: 2, directionMode: 'oneWay',
        entryNodeIds: [n0.id], exitNodeIds: [n1.id],
      };
      set({ paths: [...get().paths, path] }); save();
      useWorldSelectStore.getState().select(`${id}#node#${n0.id}`); // show the gizmo on the first node immediately
      focusCameraOn(c[0], c[1], c[2]);
      return id;
    },
    updatePath: (id, patch) => { set({ paths: get().paths.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    updatePathNode: (pathId, nodeId, position) => {
      set({
        paths: get().paths.map((p) =>
          p.id === pathId ? { ...p, nodes: (p.nodes ?? []).map((n) => (n.id === nodeId ? { ...n, position } : n)) } : p,
        ),
      });
      save();
    },
    updateNode: (pathId, nodeId, patch) => {
      set({ paths: get().paths.map((p) => (p.id === pathId ? { ...p, nodes: (p.nodes ?? []).map((n) => (n.id === nodeId ? { ...n, ...patch } : n)) } : p)) });
      save();
    },
    addNode: (pathId) => {
      let newId = ''; let pos: [number, number, number] = camPos();
      set({
        paths: get().paths.map((p) => {
          if (p.id !== pathId) return p;
          const nodes = p.nodes ?? [];
          const last = nodes[nodes.length - 1]?.position ?? camPos();
          pos = [last[0] + 3, last[1], last[2]];
          const node: PathNodeData = { id: uid('node'), position: pos, tangentMode: 'automatic', speedMultiplier: 1, width: p.laneWidth };
          newId = node.id;
          const nextNodes = [...nodes, node];
          return { ...p, nodes: nextNodes, nodeIds: nextNodes.map((n) => n.id) };
        }),
      });
      save();
      if (newId) { useWorldSelectStore.getState().select(`${pathId}#node#${newId}`); focusCameraOn(pos[0], pos[1], pos[2]); }
    },
    removeNode: (pathId, nodeId) => {
      set({
        paths: get().paths.map((p) => {
          if (p.id !== pathId) return p;
          const nextNodes = (p.nodes ?? []).filter((n) => n.id !== nodeId);
          return {
            ...p, nodes: nextNodes, nodeIds: nextNodes.map((n) => n.id),
            entryNodeIds: p.entryNodeIds.filter((x) => x !== nodeId),
            exitNodeIds: p.exitNodeIds.filter((x) => x !== nodeId),
          };
        }),
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
