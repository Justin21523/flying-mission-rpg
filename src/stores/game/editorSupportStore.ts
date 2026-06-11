import { create } from 'zustand';
import type { MultiCharacterLimitConfig, SupportAiProfile, SupportDispatchProfile } from '../../types/game/support';
import { DEFAULT_MULTI_CHARACTER_LIMITS, SEED_SUPPORT_AI_PROFILES, SEED_SUPPORT_PROFILES } from '../../data/game/support';

const STORAGE_KEY = 'aero-rescue-editor-support-v1';

interface EditorSupportState {
  profiles: SupportDispatchProfile[];
  aiProfiles: SupportAiProfile[];
  limits: MultiCharacterLimitConfig;
  seeded: boolean;
  selectedCharacterId: string | null;
  selectedAiProfileId: string | null;
  validationErrors: string[];
  setSelectedCharacter: (id: string | null) => void;
  setSelectedAiProfile: (id: string | null) => void;
  updateProfile: (id: string, patch: Partial<SupportDispatchProfile>) => void;
  updateAiProfile: (id: string, patch: Partial<SupportAiProfile>) => void;
  updateLimits: (patch: Partial<MultiCharacterLimitConfig>) => void;
  duplicateProfile: (id: string) => string | null;
  importState: (data: Partial<EditorSupportPersist>) => void;
  mergeMissingFromSeed: () => void;
  reset: () => void;
}

interface EditorSupportPersist {
  profiles: SupportDispatchProfile[];
  aiProfiles: SupportAiProfile[];
  limits: MultiCharacterLimitConfig;
  seeded: boolean;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}

function cloneLimits(): MultiCharacterLimitConfig {
  return { ...DEFAULT_MULTI_CHARACTER_LIMITS };
}

function load(): EditorSupportPersist {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { profiles: [], aiProfiles: [], limits: cloneLimits(), seeded: false };
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed)) return { profiles: [], aiProfiles: [], limits: cloneLimits(), seeded: false };
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles as SupportDispatchProfile[] : [],
      aiProfiles: Array.isArray(parsed.aiProfiles) ? parsed.aiProfiles as SupportAiProfile[] : [],
      limits: isObj(parsed.limits) ? { ...cloneLimits(), ...parsed.limits } as MultiCharacterLimitConfig : cloneLimits(),
      seeded: !!parsed.seeded,
    };
  } catch {
    return { profiles: [], aiProfiles: [], limits: cloneLimits(), seeded: false };
  }
}

function persist(state: Pick<EditorSupportState, 'profiles' | 'aiProfiles' | 'limits' | 'seeded'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      profiles: state.profiles,
      aiProfiles: state.aiProfiles,
      limits: state.limits,
      seeded: state.seeded,
    }));
  } catch {
    /* ignore localStorage quota / unavailable */
  }
}

export const useEditorSupportStore = create<EditorSupportState>((set, get) => ({
  ...load(),
  selectedCharacterId: null,
  selectedAiProfileId: null,
  validationErrors: [],

  setSelectedCharacter: (selectedCharacterId) => set({ selectedCharacterId }),
  setSelectedAiProfile: (selectedAiProfileId) => set({ selectedAiProfileId }),

  updateProfile: (id, patch) => {
    set((s) => {
      const next = { ...s, profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
      persist(next);
      return next;
    });
  },

  updateAiProfile: (id, patch) => {
    set((s) => {
      const next = { ...s, aiProfiles: s.aiProfiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
      persist(next);
      return next;
    });
  },

  updateLimits: (patch) => {
    set((s) => {
      const next = { ...s, limits: { ...s.limits, ...patch } };
      persist(next);
      return next;
    });
  },

  duplicateProfile: (id) => {
    const src = get().profiles.find((p) => p.id === id);
    if (!src) return null;
    const copy = { ...src, id: `${src.id}_copy_${Date.now().toString(36)}` };
    set((s) => {
      const next = { ...s, profiles: [...s.profiles, copy], selectedCharacterId: copy.characterId };
      persist(next);
      return next;
    });
    return copy.id;
  },

  importState: (data) => {
    const next = {
      profiles: Array.isArray(data.profiles) ? data.profiles : [],
      aiProfiles: Array.isArray(data.aiProfiles) ? data.aiProfiles : [],
      limits: data.limits ? { ...cloneLimits(), ...data.limits } : cloneLimits(),
      seeded: true,
      selectedCharacterId: null,
      selectedAiProfileId: null,
      validationErrors: [],
    };
    set(next);
    persist(next);
  },

  mergeMissingFromSeed: () => {
    const s = get();
    const profileIds = new Set(s.profiles.map((p) => p.id));
    const aiIds = new Set(s.aiProfiles.map((p) => p.id));
    const missingProfiles = SEED_SUPPORT_PROFILES.filter((p) => !profileIds.has(p.id));
    const missingAi = SEED_SUPPORT_AI_PROFILES.filter((p) => !aiIds.has(p.id));
    if (missingProfiles.length === 0 && missingAi.length === 0 && s.seeded) return;
    const next = {
      ...s,
      profiles: [...s.profiles, ...missingProfiles],
      aiProfiles: [...s.aiProfiles, ...missingAi],
      limits: { ...cloneLimits(), ...s.limits },
      seeded: true,
    };
    set(next);
    persist(next);
  },

  reset: () => {
    const next = {
      profiles: [],
      aiProfiles: [],
      limits: cloneLimits(),
      seeded: false,
      selectedCharacterId: null,
      selectedAiProfileId: null,
      validationErrors: [],
    };
    set(next);
    persist(next);
  },
}));

export function getSupportProfiles(): SupportDispatchProfile[] {
  return useEditorSupportStore.getState().profiles;
}

export function getSupportProfileForCharacter(characterId: string): SupportDispatchProfile | undefined {
  return useEditorSupportStore.getState().profiles.find((p) => p.characterId === characterId);
}

export function getSupportAiProfile(id: string): SupportAiProfile | undefined {
  return useEditorSupportStore.getState().aiProfiles.find((p) => p.id === id);
}

export function getMultiCharacterLimits(): MultiCharacterLimitConfig {
  return useEditorSupportStore.getState().limits;
}
