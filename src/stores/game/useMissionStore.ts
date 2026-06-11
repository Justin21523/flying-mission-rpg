import { create } from 'zustand';
import type { MissionDefinition, MissionRuntime } from '../../types/game/mission';
import { gameEventBus } from '../../game/core/EventBus';

// Current mission selection + active runtime (objective progress). Authored templates live in
// editorMissionStore; this is the live play state.
interface MissionStore {
  currentMissionId: string | null;
  runtime: MissionRuntime | null;
  selectMission: (id: string | null) => void;
  beginMission: (def: MissionDefinition) => void;
  clearRuntime: () => void;
  setObjective: (objectiveId: string, done: boolean, count?: number) => void;
  completeMission: () => void;
  failMission: () => void;
  reset: () => void;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  currentMissionId: null,
  runtime: null,

  selectMission: (id) => {
    set({ currentMissionId: id });
    if (id) gameEventBus.emit('mission:selected', { missionId: id });
  },

  beginMission: (def) => {
    const objectiveProgress: MissionRuntime['objectiveProgress'] = {};
    for (const o of def.objectives) objectiveProgress[o.id] = { done: false, count: 0 };
    set({
      currentMissionId: def.id,
      runtime: { missionId: def.id, status: 'active', objectiveProgress, startedAtMs: Date.now(), usedSupportCount: 0 },
    });
  },

  clearRuntime: () => set({ runtime: null }),

  setObjective: (objectiveId, done, count) => {
    const rt = get().runtime;
    if (!rt) return;
    const prev = rt.objectiveProgress[objectiveId] ?? { done: false, count: 0 };
    set({
      runtime: {
        ...rt,
        objectiveProgress: { ...rt.objectiveProgress, [objectiveId]: { done, count: count ?? prev.count } },
      },
    });
  },

  completeMission: () => {
    const rt = get().runtime;
    if (rt) set({ runtime: { ...rt, status: 'complete' } });
  },

  failMission: () => {
    const rt = get().runtime;
    if (rt) set({ runtime: { ...rt, status: 'failed' } });
  },

  reset: () => set({ currentMissionId: null, runtime: null }),
}));
