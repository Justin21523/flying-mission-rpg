import { create } from 'zustand';
import type { CollisionObjectDef, CollisionReactionRule } from '../types/collision';
import { COLLISION_OBJECT_SEED, COLLISION_RULE_SEED } from '../data/poli/collisionSeed';

// POLI (Phase C) — classified collidables + data-driven collision reaction rules. Auto-persisted; round-trips
// via the editor content registry (domain 'editorCollision') and is tracked for Undo. Object drags in Edit
// Mode write back via updateObjectPosition. Authoring tabs for rules arrive in Phase D.
interface EditorCollisionState {
  objects: CollisionObjectDef[];
  rules: CollisionReactionRule[];
  updateObject: (id: string, patch: Partial<CollisionObjectDef>) => void;
  updateObjectPosition: (id: string, position: [number, number, number]) => void;
  updateRule: (id: string, patch: Partial<CollisionReactionRule>) => void;
  importState: (data: { objects?: CollisionObjectDef[]; rules?: CollisionReactionRule[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-collision-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

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
    updateObject: (id, patch) => { set({ objects: get().objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) }); save(); },
    updateObjectPosition: (id, position) => { set({ objects: get().objects.map((o) => (o.id === id ? { ...o, position } : o)) }); save(); },
    updateRule: (id, patch) => { set({ rules: get().rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }); save(); },
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
