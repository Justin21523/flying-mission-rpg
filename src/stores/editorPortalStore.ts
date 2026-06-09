import { create } from 'zustand';
import type { PortalDef } from '../types/portal';
import { editorSpawn, useSceneEditStore } from './sceneEditStore';
import { objKey } from '../game/edit/sceneEditMerge';

// POLI — editable portals/doors (🚪 Portals tab). Auto-persisted; imported/exported via the editor content
// registry (domain 'editorPortal'). Placed/moved with the standard Edit-Mode gizmo (kind 'landmark'), so the
// tab shows their live position. Portals link to any area (incl. indoor areas built in the 🗺 World tab).

interface EditorPortalState {
  portals: PortalDef[];
  addPortal: (areaId: string) => string;
  updatePortal: (id: string, patch: Partial<PortalDef>) => void;
  removePortal: (id: string) => void;
  importState: (data: { portals?: PortalDef[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-portal-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `portal_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

// One safe, instructive example (locked so it never fires until the user points it at a real interior area).
const DEFAULTS: PortalDef[] = [
  { id: 'portal_hq_door', areaId: 'rescue_hq', name: 'HQ Door (edit me)', position: [0, 0, 6], activation: 'interact', radius: 2.5, targetAreaId: 'rescue_hq', interior: true, locked: true, color: '#f97316' },
];

function persist(portals: PortalDef[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ portals })); } catch { /* ignore */ }
}
function load(): PortalDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.portals)) return p.portals; }
  } catch { /* ignore */ }
  return clone(DEFAULTS);
}

export const useEditorPortalStore = create<EditorPortalState>((set, get) => {
  const save = () => persist(get().portals);
  return {
    portals: load(),
    addPortal: (areaId) => {
      const id = uid();
      const pos: [number, number, number] = [Math.round(editorSpawn.x * 100) / 100, 0, Math.round(editorSpawn.z * 100) / 100];
      const portal: PortalDef = { id, areaId, name: 'New Portal', position: pos, activation: 'interact', radius: 2.5, targetAreaId: areaId, color: '#f97316' };
      set({ portals: [...get().portals, portal] }); save();
      useSceneEditStore.getState().requestSelect(objKey(areaId, 'landmark', id)); // gizmo appears on the new portal
      return id;
    },
    updatePortal: (id, patch) => { set({ portals: get().portals.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    removePortal: (id) => { set({ portals: get().portals.filter((p) => p.id !== id) }); save(); },
    importState: (data) => { set({ portals: Array.isArray(data.portals) ? data.portals : get().portals }); save(); },
    reset: () => { set({ portals: clone(DEFAULTS) }); save(); },
  };
});

export function getPortals(): PortalDef[] { return useEditorPortalStore.getState().portals; }
export function getPortal(id: string): PortalDef | undefined { return useEditorPortalStore.getState().portals.find((p) => p.id === id); }
