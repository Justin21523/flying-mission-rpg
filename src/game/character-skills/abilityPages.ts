import { create } from 'zustand';
import type { AbilitySlot } from '../../types/abilityArsenalTypes';

// Paged ability input (Batch F.7) — each hero's 16 abilities are split into 4 PAGES of exactly 4, cast with
// just 4 action keys (4 / 5 / Z / X). Ctrl cycles the active page, so the same 4 keys map to a different
// ability set per page. Exactly ONE clone ability is interleaved into every page (never all on the last page).
export const ABILITY_PAGES: AbilitySlot[][] = [
  ['attack-1', 'clone-1', 'attack-2', 'attack-3'],           // Page 1 — Core Attack + Clone
  ['attack-4', 'defense-1', 'clone-2', 'attack-5'],          // Page 2 — Advanced Defense + Clone
  ['attack-6', 'defense-2', 'signature-1', 'clone-3'],       // Page 3 — Control Signature + Clone
  ['defense-3', 'ultimate-1', 'clone-4', 'ultimate-2'],      // Page 4 — Defense Ultimate + Clone
];
export const PAGE_COUNT = ABILITY_PAGES.length;
export const PAGE_LABELS = ['Core Attack + Clone', 'Advanced Defense + Clone', 'Control Signature + Clone', 'Defense Ultimate + Clone'];

// The 4 action keys → index within the active page. (Digit4 = the "4" key, Digit5 = "5".)
export const ACTION_KEYS = ['Digit4', 'Digit5', 'KeyZ', 'KeyX'] as const;
export const ACTION_KEY_LABELS = ['4', '5', 'Z', 'X'];

export function actionKeyIndex(code: string): number {
  return (ACTION_KEYS as readonly string[]).indexOf(code);
}

// Resolve an action key on the given page → the ability slot it casts (or undefined if that page slot is empty).
export function routeActionKey(code: string, page: number): AbilitySlot | undefined {
  const idx = actionKeyIndex(code);
  if (idx < 0) return undefined;
  return ABILITY_PAGES[page % PAGE_COUNT]?.[idx];
}

// Active page state (Ctrl cycles it). UI subscribes so the skill bar re-renders on page switch.
interface AbilityPageState {
  page: number;
  cyclePage: () => void;
  setPage: (page: number) => void;
  reset: () => void;
}
export const useAbilityPageStore = create<AbilityPageState>((set, get) => ({
  page: 0,
  cyclePage: () => set({ page: (get().page + 1) % PAGE_COUNT }),
  setPage: (page) => set({ page: ((page % PAGE_COUNT) + PAGE_COUNT) % PAGE_COUNT }),
  reset: () => set({ page: 0 }),
}));
