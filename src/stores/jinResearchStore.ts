import { create } from 'zustand';
import { RESEARCH_PROJECTS } from '../data/progression/researchProjects';
import type { ResearchProject } from '../data/progression/researchProjects';
import { useToolStore } from './toolStore';
import { useWorldStore } from './worldStore';
import { useTransformStore } from './transformStore';
import { useEditorPoliCharacterStore } from './editorPoliCharacterStore';
import type { ToolId } from '../types/tool';
import type { AbilityType } from '../types/character';

// POLI — Jin's research station. The player earns `researchPoints` from rescues + quests, then funds projects
// that (after a `durationSec`) unlock rescue tools / a built-in ability / an area, via a small research tree.
// Projects are editable in the 🔬 Research tab; the play-mode Research Station panel (at Rescue HQ) funds them.
// Only one project researches at a time. Auto-persisted.
interface ActiveResearch { id: string; endsAt: number; durationSec: number }

interface JinResearchState {
  researchPoints: number;
  completed: string[];                 // completed project ids (non-repeatable)
  projects: ResearchProject[];         // editable definitions
  active: ActiveResearch | null;       // the project currently being researched (single slot)
  researchedAbilities: string[];       // AbilityTypes unlocked via research
  addPoints: (n: number) => void;
  setPoints: (n: number) => void;
  canResearch: (id: string) => boolean;
  startProject: (id: string) => boolean;
  tickResearch: () => void;
  cancelActive: () => void;
  addProject: () => void;
  updateProject: (id: string, patch: Partial<ResearchProject>) => void;
  removeProject: (id: string) => void;
  importState: (data: Partial<Pick<JinResearchState, 'researchPoints' | 'completed' | 'projects' | 'active' | 'researchedAbilities'>>) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-research-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `proj_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const nowSec = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

type Persisted = Pick<JinResearchState, 'researchPoints' | 'completed' | 'projects' | 'active' | 'researchedAbilities'>;
function persist(s: Persisted): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ researchPoints: s.researchPoints, completed: s.completed, projects: s.projects, active: s.active, researchedAbilities: s.researchedAbilities })); } catch { /* ignore */ }
}
function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        researchPoints: typeof p.researchPoints === 'number' ? p.researchPoints : 0,
        completed: Array.isArray(p.completed) ? p.completed : [],
        projects: Array.isArray(p.projects) ? p.projects : clone(RESEARCH_PROJECTS),
        active: p.active && typeof p.active.id === 'string' ? p.active : null,
        researchedAbilities: Array.isArray(p.researchedAbilities) ? p.researchedAbilities : [],
      };
    }
  } catch { /* ignore */ }
  return { researchPoints: 0, completed: [], projects: clone(RESEARCH_PROJECTS), active: null, researchedAbilities: [] };
}

export const useJinResearchStore = create<JinResearchState>((set, get) => {
  const save = () => persist(get());

  // Apply a completed project's unlocks. Non-repeatable projects are also recorded in `completed`.
  const completeProject = (id: string) => {
    const s = get();
    const p = s.projects.find((x) => x.id === id);
    if (!p) return;
    if (p.unlocksToolId) useToolStore.getState().unlockTool(p.unlocksToolId as ToolId);
    if (p.unlocksAreaId) useWorldStore.getState().discoverArea(p.unlocksAreaId);
    if (p.unlocksAbilityType) {
      // Grant the ability as the CURRENT character's Q (via a POLI character override) + record it.
      const charId = useTransformStore.getState().charId;
      useEditorPoliCharacterStore.getState().setOverride(charId, { abilityType: p.unlocksAbilityType as AbilityType });
      if (!s.researchedAbilities.includes(p.unlocksAbilityType)) {
        set({ researchedAbilities: [...s.researchedAbilities, p.unlocksAbilityType] });
      }
    }
    if (!p.repeatable && !get().completed.includes(id)) set({ completed: [...get().completed, id] });
  };

  return {
    ...load(),
    addPoints: (n) => { set({ researchPoints: Math.max(0, get().researchPoints + n) }); save(); },
    setPoints: (n) => { set({ researchPoints: Math.max(0, n) }); save(); },
    canResearch: (id) => {
      const s = get();
      if (s.active) return false; // one project at a time
      const p = s.projects.find((x) => x.id === id);
      if (!p) return false;
      if (!p.repeatable && s.completed.includes(id)) return false;
      if (s.researchPoints < p.cost) return false;
      return p.prerequisiteProjectIds.every((pre) => s.completed.includes(pre));
    },
    startProject: (id) => {
      const s = get();
      if (!s.canResearch(id)) return false;
      const p = s.projects.find((x) => x.id === id)!;
      set({ researchPoints: s.researchPoints - p.cost });
      const dur = p.durationSec ?? 0;
      if (dur > 0) {
        set({ active: { id, endsAt: nowSec() + dur, durationSec: dur } });
      } else {
        completeProject(id);
      }
      save();
      return true;
    },
    tickResearch: () => {
      const a = get().active;
      if (!a) return;
      if (nowSec() >= a.endsAt) {
        completeProject(a.id);
        set({ active: null });
        save();
      }
    },
    cancelActive: () => { if (get().active) { set({ active: null }); save(); } },
    addProject: () => { set({ projects: [...get().projects, { id: uid(), name: 'New Project', description: '', cost: 1, unlocksToolId: '', prerequisiteProjectIds: [] }] }); save(); },
    updateProject: (id, patch) => { set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    removeProject: (id) => {
      set({
        projects: get().projects.filter((p) => p.id !== id),
        completed: get().completed.filter((c) => c !== id),
        active: get().active?.id === id ? null : get().active,
      });
      save();
    },
    importState: (data) => {
      set({
        researchPoints: typeof data.researchPoints === 'number' ? data.researchPoints : get().researchPoints,
        completed: Array.isArray(data.completed) ? data.completed : get().completed,
        projects: Array.isArray(data.projects) ? data.projects : get().projects,
        active: data.active !== undefined ? data.active : get().active,
        researchedAbilities: Array.isArray(data.researchedAbilities) ? data.researchedAbilities : get().researchedAbilities,
      });
      save();
    },
    reset: () => { set({ researchPoints: 0, completed: [], projects: clone(RESEARCH_PROJECTS), active: null, researchedAbilities: [] }); save(); },
  };
});
