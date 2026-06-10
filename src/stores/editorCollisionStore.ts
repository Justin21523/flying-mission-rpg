import { create } from 'zustand';
import type { CollisionObjectDef, CollisionReactionRule } from '../types/collision';
import { COLLISION_OBJECT_SEED, COLLISION_RULE_SEED } from '../data/poli/collisionSeed';
import { editorSpawn } from './sceneEditStore';
import { useWorldSelectStore } from './worldSelectStore';
import { focusCameraOn } from '../game/edit/cameraFocus';

// POLI (Phase C) — classified collidables + data-driven collision reaction rules. Auto-persisted; round-trips
// via the editor content registry (domain 'editorCollision') and is tracked for Undo. Object drags in Edit
// Mode write back via updateObjectPosition. Authoring tabs for rules arrive in Phase D.
interface EditorCollisionState {
  objects: CollisionObjectDef[];
  rules: CollisionReactionRule[];
  addObject: (areaId: string) => string;
  updateObject: (id: string, patch: Partial<CollisionObjectDef>) => void;
  updateObjectPosition: (id: string, position: [number, number, number]) => void;
  removeObject: (id: string) => void;
  addRule: () => string;
  updateRule: (id: string, patch: Partial<CollisionReactionRule>) => void;
  removeRule: (id: string) => void;
  mergeMissingFromSeed: () => void;
  importState: (data: { objects?: CollisionObjectDef[]; rules?: CollisionReactionRule[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-collision-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function persist(s: { objects: CollisionObjectDef[]; rules: CollisionReactionRule[] }): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function load(): { objects: CollisionObjectDef[]; rules: CollisionReactionRule[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.objects) && Array.isArray(p.rules)) return { objects: p.objects, rules: p.rules };
    }
  } catch { /* ignore */ }
  return { objects: clone(COLLISION_OBJECT_SEED), rules: clone(COLLISION_RULE_SEED) };
}

export const useEditorCollisionStore = create<EditorCollisionState>((set, get) => {
  const save = () => persist({ objects: get().objects, rules: get().rules });
  return {
    ...load(),
    addObject: (areaId) => {
      const id = uid('col');
      const o: CollisionObjectDef = {
        id, areaId, objectType: 'wall', position: [Math.round(editorSpawn.x * 100) / 100, 0, Math.round(editorSpawn.z * 100) / 100],
        size: [2, 2, 2], solid: true, tags: [], color: '#94a3b8', label: 'Object', enabled: true,
      };
      set({ objects: [...get().objects, o] }); save();
      useWorldSelectStore.getState().select(`${id}#collobj`); focusCameraOn(o.position[0], o.position[1], o.position[2]);
      return id;
    },
    updateObject: (id, patch) => { set({ objects: get().objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) }); save(); },
    updateObjectPosition: (id, position) => { set({ objects: get().objects.map((o) => (o.id === id ? { ...o, position } : o)) }); save(); },
    removeObject: (id) => { set({ objects: get().objects.filter((o) => o.id !== id) }); save(); },
    addRule: () => {
      const id = uid('rule');
      const r: CollisionReactionRule = {
        id, name: 'New Rule', enabled: true, priority: 0,
        sourceTypes: ['player'], targetTypes: ['wall'], phases: ['enter'],
        actions: [], cooldown: 0, oncePerContact: false,
      };
      set({ rules: [...get().rules, r] }); save();
      return id;
    },
    updateRule: (id, patch) => { set({ rules: get().rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }); save(); },
    removeRule: (id) => { set({ rules: get().rules.filter((r) => r.id !== id) }); save(); },
    mergeMissingFromSeed: () => {
      const haveO = new Set(get().objects.map((o) => o.id));
      const haveR = new Set(get().rules.map((r) => r.id));
      const addO = COLLISION_OBJECT_SEED.filter((o) => !haveO.has(o.id));
      const addR = COLLISION_RULE_SEED.filter((r) => !haveR.has(r.id));
      if (addO.length || addR.length) { set({ objects: [...get().objects, ...clone(addO)], rules: [...get().rules, ...clone(addR)] }); save(); }
    },
    importState: (data) => {
      set({
        objects: Array.isArray(data.objects) ? data.objects : get().objects,
        rules: Array.isArray(data.rules) ? data.rules : get().rules,
      });
      save();
    },
    reset: () => { set({ objects: clone(COLLISION_OBJECT_SEED), rules: clone(COLLISION_RULE_SEED) }); save(); },
  };
});

export function getCollisionObjects(): CollisionObjectDef[] { return useEditorCollisionStore.getState().objects; }
export function getCollisionRules(): CollisionReactionRule[] { return useEditorCollisionStore.getState().rules; }
