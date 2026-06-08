import { create } from 'zustand';
import { POLI_TOOLS } from '../data/tools/poliTools';
import type { ToolDefinition } from '../types/tool';

// Editable rescue tools + skill tree (🛠 Tools tab). Seeded from POLI_TOOLS; CRUD + editable
// prerequisites (skill-tree edges) + per-tool upgrade level. toolStore reads getEditorTools() and
// enforces prerequisites. Auto-persisted; mirrors the other editor stores.
interface EditorToolState {
  tools: ToolDefinition[];
  upgrades: Record<string, number>; // toolId → current upgrade level
  selectedId: string | null;
  addTool: () => void;
  updateTool: (id: string, patch: Partial<ToolDefinition>) => void;
  removeTool: (id: string) => void;
  selectTool: (id: string | null) => void;
  setUpgrade: (id: string, level: number) => void;
  importState: (data: { tools?: ToolDefinition[]; upgrades?: Record<string, number> }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-tool-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function persist(s: Pick<EditorToolState, 'tools' | 'upgrades'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tools: s.tools, upgrades: s.upgrades })); } catch { /* ignore */ }
}
function load(): Pick<EditorToolState, 'tools' | 'upgrades'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { tools: Array.isArray(p.tools) ? p.tools : clone(POLI_TOOLS), upgrades: p.upgrades && typeof p.upgrades === 'object' ? p.upgrades : {} };
    }
  } catch { /* ignore */ }
  return { tools: clone(POLI_TOOLS), upgrades: {} };
}

export const useEditorToolStore = create<EditorToolState>((set, get) => {
  const save = () => persist(get());
  return {
    ...load(),
    selectedId: null,
    addTool: () => {
      const id = `tool_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
      const def = { id, name: 'New Tool', description: '', icon: '🛠', unlockTrustWithJin: 0, unlockLevel: 1, prerequisites: [], maxUpgrade: 2, upgradeBonusPerLevel: 0.25, sourceConfidence: 'GameAdaptation' } as unknown as ToolDefinition;
      set({ tools: [...get().tools, def], selectedId: id }); save();
    },
    updateTool: (id, patch) => { set({ tools: get().tools.map((t) => (t.id === id ? { ...t, ...patch } : t)) }); save(); },
    removeTool: (id) => { set({ tools: get().tools.filter((t) => t.id !== id), selectedId: get().selectedId === id ? null : get().selectedId }); save(); },
    selectTool: (id) => set({ selectedId: id }),
    setUpgrade: (id, level) => { set({ upgrades: { ...get().upgrades, [id]: Math.max(0, level) } }); save(); },
    importState: (data) => {
      set({ tools: Array.isArray(data.tools) ? data.tools : get().tools, upgrades: data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : get().upgrades });
      save();
    },
    reset: () => { set({ tools: clone(POLI_TOOLS), upgrades: {}, selectedId: null }); save(); },
  };
});

export function getEditorTools(): ToolDefinition[] { return useEditorToolStore.getState().tools; }
export function getEditorTool(id: string): ToolDefinition | undefined { return useEditorToolStore.getState().tools.find((t) => t.id === id); }
export function getToolUpgrade(id: string): number { return useEditorToolStore.getState().upgrades[id] ?? 0; }
