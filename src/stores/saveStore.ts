import { create } from 'zustand';
import { usePlayerStore } from './playerStore';
import { useProgressionStore } from './progressionStore';
import { useInventoryStore } from './inventoryStore';
import { useFlagStore } from './flagStore';
import { useQuestStore } from './questStore';
import { useWorldClockStore } from './worldClockStore';
import { useTransformStore } from './transformStore';
import type { PoliCharId, PoliForm } from './transformStore';
import { useRelationshipStore } from './relationshipStore';
import { useToolStore } from './toolStore';
import { useRescueLicenseStore } from './rescueLicenseStore';
import { useJinResearchStore } from './jinResearchStore';
import { useBoostStore } from './boostStore';
import { useWalletStore } from './walletStore';
import { useAdvancedMissionZoneStore } from './game/useAdvancedMissionZoneStore';
import type { ToolId } from '../types/tool';
import type { Quest } from '../types/quest';

// Kit — multi-slot game saves (play-mode 💾 tool). Snapshots the live game stores (player position/area,
// progression, inventory, flags, quest statuses + objective completion) into named localStorage slots, and
// restores them. De-yokai'd: no party/codex/friendship. Extend SaveData + snapshot/restore to add systems.
export interface SaveData {
  version: 1;
  player: { currentAreaId: string; position: { x: number; y: number; z: number } | null; distanceTraveled: number };
  progression: { level: number; exp: number };
  inventory: { items: Record<string, number>; pickedUpItems: string[] };
  flags: Record<string, boolean>;
  quests: Record<string, { status: Quest['status']; objectives: Record<string, boolean> }>;
  // Optional (added later — old saves still load): time, active character/form, trust, tools.
  clock?: { timeMinutes: number; weather: string };
  transform?: { charId: string; form: string };
  relationships?: Record<string, number>;
  tools?: { unlocked: string[]; equipped: string[] };
  // POLI progression (rescues completed + research points/completed) — player progress, per-slot.
  license?: { rescuesCompleted: number };
  research?: { researchPoints: number; completed: string[] };
  boost?: { meter: number; collected: number };
  wallet?: { coins: number };
  // Advanced Mission Zone progress (New Batch A) — optional so old saves still load.
  advancedMissionZone?: {
    activeZoneId?: string;
    activeSegmentId?: string;
    completedSegmentIds: string[];
    unlockedSegmentIds: string[];
    missionZoneStatus: string;
  };
}
export interface SaveSlot { name: string; savedAt: string; data: SaveData }

interface SaveStoreState {
  slots: SaveSlot[];
  saveToSlot: (name: string) => void;
  quickSave: () => void;
  loadSlot: (name: string) => boolean;
  deleteSlot: (name: string) => void;
}

export const QUICK_SAVE_SLOT = 'Quick Save';

const STORAGE_KEY = 'r3f-rpg-builder-saves-v1';

function persist(slots: SaveSlot[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ slots })); } catch { /* ignore */ }
}
function load(): SaveSlot[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p.slots)) return p.slots as SaveSlot[]; } } catch { /* ignore */ }
  return [];
}

export function snapshotGame(): SaveData {
  const p = usePlayerStore.getState();
  const prog = useProgressionStore.getState();
  const inv = useInventoryStore.getState();
  const flags = useFlagStore.getState().flags;
  const quests = useQuestStore.getState().quests;
  const questData: SaveData['quests'] = {};
  for (const [qid, q] of Object.entries(quests)) {
    questData[qid] = { status: q.status, objectives: Object.fromEntries(q.objectives.map((o) => [o.id, o.isCompleted])) };
  }
  const clock = useWorldClockStore.getState().getSaveData();
  const tf = useTransformStore.getState();
  const tools = useToolStore.getState();
  return {
    version: 1,
    player: { currentAreaId: p.currentAreaId, position: p.position, distanceTraveled: p.distanceTraveled },
    progression: { level: prog.level, exp: prog.exp },
    inventory: { items: { ...inv.items }, pickedUpItems: [...inv.pickedUpItems] },
    flags: { ...flags },
    quests: questData,
    clock: { timeMinutes: clock.timeMinutes, weather: clock.weather },
    transform: { charId: tf.charId, form: tf.form },
    relationships: { ...useRelationshipStore.getState().trust },
    tools: { unlocked: [...tools.unlockedTools], equipped: [...tools.equippedTools] },
    license: { rescuesCompleted: useRescueLicenseStore.getState().rescuesCompleted },
    research: { researchPoints: useJinResearchStore.getState().researchPoints, completed: [...useJinResearchStore.getState().completed] },
    boost: { meter: useBoostStore.getState().meter, collected: useBoostStore.getState().collected },
    wallet: { coins: useWalletStore.getState().coins },
    advancedMissionZone: (() => {
      const z = useAdvancedMissionZoneStore.getState();
      return { activeZoneId: z.activeZoneId, activeSegmentId: z.activeSegmentId, completedSegmentIds: [...z.completedSegmentIds], unlockedSegmentIds: [...z.unlockedSegmentIds], missionZoneStatus: z.missionZoneStatus };
    })(),
  };
}

export function restoreGame(d: SaveData): void {
  useProgressionStore.setState({ level: d.progression.level, exp: d.progression.exp });
  useInventoryStore.getState().setInventory(d.inventory.items);
  useInventoryStore.getState().setPickedUpItems(d.inventory.pickedUpItems);
  useFlagStore.getState().setFlags(d.flags);
  const statuses: Partial<Record<string, Quest['status']>> = {};
  const objStates: Record<string, Record<string, boolean>> = {};
  for (const [qid, q] of Object.entries(d.quests)) { statuses[qid] = q.status; objStates[qid] = q.objectives; }
  useQuestStore.getState().setQuestStatuses(statuses);
  useQuestStore.getState().setObjectiveStates(objStates);
  // Optional newer systems (guarded so old saves still load).
  if (d.clock) useWorldClockStore.getState().loadSaveData({ timeMinutes: d.clock.timeMinutes, weather: d.clock.weather as never });
  if (d.transform) useTransformStore.setState({ charId: d.transform.charId as PoliCharId, form: d.transform.form as PoliForm, flying: false });
  if (d.relationships) useRelationshipStore.setState({ trust: { ...d.relationships } });
  if (d.tools) useToolStore.setState({ unlockedTools: d.tools.unlocked as ToolId[], equippedTools: d.tools.equipped as ToolId[] });
  if (d.license) useRescueLicenseStore.getState().setRescues(d.license.rescuesCompleted);
  if (d.research) useJinResearchStore.setState({ researchPoints: d.research.researchPoints, completed: [...d.research.completed] });
  if (d.boost) useBoostStore.getState().importState(d.boost);
  if (d.wallet) useWalletStore.getState().importState(d.wallet);
  if (d.advancedMissionZone) {
    const z = d.advancedMissionZone;
    useAdvancedMissionZoneStore.setState({
      activeZoneId: z.activeZoneId,
      activeSegmentId: z.activeSegmentId,
      completedSegmentIds: [...z.completedSegmentIds],
      unlockedSegmentIds: [...z.unlockedSegmentIds],
      missionZoneStatus: z.missionZoneStatus as never,
    });
  }
  // Restore location last: set area + request a spawn so the Player teleports there.
  usePlayerStore.getState().setCurrentAreaId(d.player.currentAreaId);
  if (d.player.position) usePlayerStore.getState().requestSpawn(d.player.position);
}

export const useSaveStore = create<SaveStoreState>((set, get) => ({
  slots: load(),
  saveToSlot: (name) => {
    const slot: SaveSlot = { name, savedAt: new Date().toISOString(), data: snapshotGame() };
    const slots = [...get().slots.filter((s) => s.name !== name), slot].sort((a, b) => a.name.localeCompare(b.name));
    set({ slots }); persist(slots);
  },
  quickSave: () => get().saveToSlot(QUICK_SAVE_SLOT),
  loadSlot: (name) => {
    const slot = get().slots.find((s) => s.name === name);
    if (!slot) return false;
    restoreGame(slot.data);
    return true;
  },
  deleteSlot: (name) => { const slots = get().slots.filter((s) => s.name !== name); set({ slots }); persist(slots); },
}));
