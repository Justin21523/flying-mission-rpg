import { create } from 'zustand';
import type { AnimationDefinition, AnimationReactionProfile } from '../types/animationDef';
import { ANIMATION_DEF_SEED } from '../data/poli/collisionSeed';

// POLI (Phase C) — the AnimationDefinition registry (id → clip name + playback metadata) and reaction profiles
// (reaction key → animation id), a thin data layer over the existing AnimRule mixer path. Auto-persisted;
// round-trips via the content registry (domain 'editorAnimation') and is tracked for Undo. Authoring tab = Phase D.
interface EditorAnimationState {
  definitions: AnimationDefinition[];
  profiles: AnimationReactionProfile[];
  updateDefinition: (id: string, patch: Partial<AnimationDefinition>) => void;
  importState: (data: { definitions?: AnimationDefinition[]; profiles?: AnimationReactionProfile[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-animation-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function persist(s: { definitions: AnimationDefinition[]; profiles: AnimationReactionProfile[] }): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function load(): { definitions: AnimationDefinition[]; profiles: AnimationReactionProfile[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.definitions)) return { definitions: p.definitions, profiles: Array.isArray(p.profiles) ? p.profiles : [] };
    }
  } catch { /* ignore */ }
  return { definitions: clone(ANIMATION_DEF_SEED), profiles: [] };
}

export const useEditorAnimationStore = create<EditorAnimationState>((set, get) => {
  const save = () => persist({ definitions: get().definitions, profiles: get().profiles });
  return {
    ...load(),
    updateDefinition: (id, patch) => { set({ definitions: get().definitions.map((d) => (d.id === id ? { ...d, ...patch } : d)) }); save(); },
    importState: (data) => {
      set({
        definitions: Array.isArray(data.definitions) ? data.definitions : get().definitions,
        profiles: Array.isArray(data.profiles) ? data.profiles : get().profiles,
      });
      save();
    },
    reset: () => { set({ definitions: clone(ANIMATION_DEF_SEED), profiles: [] }); save(); },
  };
});

export function getAnimationDef(id: string): AnimationDefinition | undefined {
  return useEditorAnimationStore.getState().definitions.find((d) => d.id === id);
}
