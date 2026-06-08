import { create } from 'zustand';
import { RESEARCH_PROJECTS } from '../data/progression/researchProjects';
import type { ResearchProject } from '../data/progression/researchProjects';
import { useToolStore } from './toolStore';
import type { ToolId } from '../types/tool';

// POLI — Jin's research station. The player earns `researchPoints` from rescues + quests, then spends them
// on projects that unlock rescue tools (a small research tree via prerequisites). Projects are editable in
// the 🔬 Research tab; the play-mode Research Station panel (at Rescue HQ) spends points. Auto-persisted.
interface JinResearchState {
  researchPoints: number;
  completed: string[];          // completed project ids
  projects: ResearchProject[];  // editable definitions
  addPoints: (n: number) => void;
  setPoints: (n: number) => void;
  canResearch: (id: string) => boolean;
  spendOnProject: (id: string) => boolean;
  addProject: () => void;
  updateProject: (id: string, patch: Partial<ResearchProject>) => void;
  removeProject: (id: string) => void;
  importState: (data: { researchPoints?: number; completed?: string[]; projects?: ResearchProject[] }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-research-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const uid = () => `proj_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

function persist(s: Pick<JinResearchState, 'researchPoints' | 'completed' | 'projects'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ researchPoints: s.researchPoints, completed: s.completed, projects: s.projects })); } catch { /* ignore */ }
}
function load(): Pick<JinResearchState, 'researchPoints' | 'completed' | 'projects'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        researchPoints: typeof p.researchPoints === 'number' ? p.researchPoints : 0,
        completed: Array.isArray(p.completed) ? p.completed : [],
        projects: Array.isArray(p.projects) ? p.projects : clone(RESEARCH_PROJECTS),
      };
    }
  } catch { /* ignore */ }
  return { researchPoints: 0, completed: [], projects: clone(RESEARCH_PROJECTS) };
}

export const useJinResearchStore = create<JinResearchState>((set, get) => {
  const save = () => persist(get());
  return {
    ...load(),
    addPoints: (n) => { set({ researchPoints: Math.max(0, get().researchPoints + n) }); save(); },
    setPoints: (n) => { set({ researchPoints: Math.max(0, n) }); save(); },
    canResearch: (id) => {
      const s = get();
      const p = s.projects.find((x) => x.id === id);
      if (!p || s.completed.includes(id)) return false;
      if (s.researchPoints < p.cost) return false;
      return p.prerequisiteProjectIds.every((pre) => s.completed.includes(pre));
    },
    spendOnProject: (id) => {
      const s = get();
      if (!s.canResearch(id)) return false;
      const p = s.projects.find((x) => x.id === id)!;
      set({ researchPoints: s.researchPoints - p.cost, completed: [...s.completed, id] });
      save();
      if (p.unlocksToolId) useToolStore.getState().unlockTool(p.unlocksToolId as ToolId);
      return true;
    },
    addProject: () => { set({ projects: [...get().projects, { id: uid(), name: 'New Project', description: '', cost: 1, unlocksToolId: '', prerequisiteProjectIds: [] }] }); save(); },
    updateProject: (id, patch) => { set({ projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); save(); },
    removeProject: (id) => { set({ projects: get().projects.filter((p) => p.id !== id), completed: get().completed.filter((c) => c !== id) }); save(); },
    importState: (data) => {
      set({
        researchPoints: typeof data.researchPoints === 'number' ? data.researchPoints : get().researchPoints,
        completed: Array.isArray(data.completed) ? data.completed : get().completed,
        projects: Array.isArray(data.projects) ? data.projects : get().projects,
      });
      save();
    },
    reset: () => { set({ researchPoints: 0, completed: [], projects: clone(RESEARCH_PROJECTS) }); save(); },
  };
});
