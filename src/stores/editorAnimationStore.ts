import { create } from 'zustand';
import type { AnimationDefinition, AnimationReactionProfile } from '../types/animationDef';
import { ANIMATION_DEF_SEED } from '../data/poli/collisionSeed';

// POLI (Phase C) — the AnimationDefinition registry (id → clip name + playback metadata) and reaction profiles
// (reaction key → animation id), a thin data layer over the existing AnimRule mixer path. Auto-persisted;
// round-trips via the content registry (domain 'editorAnimation') and is tracked for Undo. Authoring tab = Phase D.
interface EditorAnimationState {
  definitions: AnimationDefinition[];
  profiles: AnimationReactionProfile[];
  addDefinition: () => string;
  updateDefinition: (id: string, patch: Partial<AnimationDefinition>) => void;
  removeDefinition: (id: string) => void;
  addProfile: () => string;
  updateProfile: (id: string, patch: Partial<AnimationReactionProfile>) => void;
  removeProfile: (id: string) => void;
  importState: (data: { definitions?: AnimationDefinition[]; profiles?: AnimationReactionProfile[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-animation-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

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
    addDefinition: () => {
      const id = uid('anim');
      const d: AnimationDefinition = {
        id, displayName: 'New Animation', clipName: '', layer: 'reaction', loop: false,
        fadeIn: 0.15, fadeOut: 0.2, speed: 1, priority: 5, interruptible: true,
      };
      set({ definitions: [...get().definitions, d] }); save();
      return id;
    },
    updateDefinition: (id, patch) => { set({ definitions: get().definitions.map((d) => (d.id === id ? { ...d, ...patch } : d)) }); save(); },
    removeDefinition: (id) => { set({ definitions: get().definitions.filter((d) => d.id !== id) }); save(); },
    addProfile: () => {
      const id = uid('prof');
      const p: AnimationReactionProfile = { id, name: 'New Profile', forKind: 'humanoid', entries: [] };
      set({ profiles: [...get().profiles, p] }); save();
      return id;
    },
    updateProfile: (id, patch) => { set({ profiles: get().profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    removeProfile: (id) => { set({ profiles: get().profiles.filter((p) => p.id !== id) }); save(); },
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
