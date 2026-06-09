import { create } from 'zustand';
import { getEditorIncident } from './editorIncidentStore';
import { useIncidentStore } from './incidentStore';
import { useProgressionStore } from './progressionStore';
import { useWalletStore } from './walletStore';
import { useRelationshipStore } from './relationshipStore';
import { useFlagStore } from './flagStore';
import { useToolStore } from './toolStore';
import { getEditorTool } from './editorToolStore';
import { useRescueLicenseStore } from './rescueLicenseStore';
import { useJinResearchStore } from './jinResearchStore';
import { playSfx } from '../game/audio/sfx';
import type { RescuePipelineStep } from '../types/incident';
import type { ToolId } from '../types/tool';

interface ToolBonus {
  actionBonus: number;
  timeBonus: number;
  radiusBonus: number;
}

// Active tool-use: pressing an equipped tool during an action stage gives a burst (+ sustained drip while the
// tool stays "active" for its useDurationSec), gated by its cooldownSec; vfxColor drives a HUD flash.
const TOOL_BURST = 0.15;        // instant action progress on use
const TOOL_DRIP_PER_SEC = 0.06; // sustained progress while the tool is active

const nowSec = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

interface RescueOperationState {
  isActive: boolean;
  incidentId: string | null;
  stageIndex: number;
  step: RescuePipelineStep;
  actionProgress: number;
  waypointsFound: boolean[];
  timeLeft: number;
  retryCount: number;
  toolBonus: ToolBonus;
  toolCooldownUntil: Record<string, number>; // toolId → cooldown-expiry (sec)
  toolActiveUntil: Record<string, number>;   // toolId → sustained-use expiry (sec)
  lastToolFx: { color: string; id: number } | null; // bumps on each use → HUD flash

  startRescue: (incidentId: string) => void;
  tick: (dt: number) => void;
  pressAction: () => void;
  useTool: (toolId: ToolId) => void;
  markWaypoint: (idx: number) => void;
  confirmSuccess: () => void;
  dismissDebrief: () => void;
  retryStage: () => void;
  cancelRescue: () => void;
  getWaypointRadius: () => number;
}

function getStage(incidentId: string, stageIndex: number) {
  return getEditorIncident(incidentId)?.stages[stageIndex] ?? null;
}

const ZERO_BONUS: ToolBonus = { actionBonus: 0, timeBonus: 0, radiusBonus: 0 };

export const useRescueOperationStore = create<RescueOperationState>((set, get) => {
  // A stage just finished: advance to the next stage (resetting its progress/timer), or — if it was
  // the last stage — move to the success screen. This is what makes multi-stage incidents run fully.
  const completeStage = () => {
    const s = get();
    if (!s.incidentId) return;
    const def = getEditorIncident(s.incidentId);
    const lastIndex = (def?.stages.length ?? 1) - 1;
    if (s.stageIndex < lastIndex) {
      const nextIdx = s.stageIndex + 1;
      const stage = getStage(s.incidentId, nextIdx);
      // Recompute the active bonus for the NEW stage's type so stageAffinity tracks the current stage.
      const toolBonus = useToolStore.getState().getActiveBonus(s.incidentId, stage?.type);
      set({
        stageIndex: nextIdx,
        step: 'on_scene',
        actionProgress: 0,
        waypointsFound: stage?.type === 'waypoints'
          ? new Array(stage.waypointPositions?.length ?? 0).fill(false)
          : [],
        timeLeft: (stage?.timeLimitSeconds ?? 0) + toolBonus.timeBonus,
        toolBonus,
        toolActiveUntil: {},
      });
      playSfx('questComplete'); // intermediate stage cleared
    } else {
      set({ step: 'success' });
      playSfx('rescueSuccess');
    }
  };

  return {
  isActive: false,
  incidentId: null,
  stageIndex: 0,
  step: 'on_scene',
  actionProgress: 0,
  waypointsFound: [],
  timeLeft: 0,
  retryCount: 0,
  toolBonus: ZERO_BONUS,
  toolCooldownUntil: {},
  toolActiveUntil: {},
  lastToolFx: null,

  startRescue: (incidentId) => {
    const stage = getStage(incidentId, 0);
    if (!stage) return;
    const toolBonus = useToolStore.getState().getActiveBonus(incidentId, stage.type);
    set({
      isActive: true,
      incidentId,
      stageIndex: 0,
      step: 'on_scene',
      actionProgress: 0,
      waypointsFound: stage.type === 'waypoints'
        ? new Array(stage.waypointPositions?.length ?? 0).fill(false)
        : [],
      timeLeft: (stage.timeLimitSeconds ?? 0) + toolBonus.timeBonus,
      retryCount: 0,
      toolBonus,
      toolCooldownUntil: {},
      toolActiveUntil: {},
    });
  },

  tick: (dt) => {
    const s = get();
    if (!s.isActive || s.step !== 'on_scene' || !s.incidentId) return;
    const stage = getStage(s.incidentId, s.stageIndex);
    if (!stage || stage.type !== 'action') return;
    const timeLeft = Math.max(0, s.timeLeft - dt);
    // Sustained tool-use: any equipped tool still within its active window drips action progress.
    const t = nowSec();
    let active = 0;
    for (const id of useToolStore.getState().equippedTools) if ((s.toolActiveUntil[id] ?? 0) > t) active++;
    if (active > 0) {
      const next = Math.min(1, s.actionProgress + TOOL_DRIP_PER_SEC * active * dt);
      set({ timeLeft, actionProgress: next });
      if (next >= 1) { completeStage(); return; }
    } else {
      set({ timeLeft });
    }
    if (timeLeft <= 0) { set({ step: 'retry' }); playSfx('rescueFail'); }
  },

  pressAction: () => {
    const s = get();
    if (!s.isActive || s.step !== 'on_scene' || !s.incidentId) return;
    const stage = getStage(s.incidentId, s.stageIndex);
    if (!stage || stage.type !== 'action') return;
    const count = stage.actionCount ?? 1;
    const next = Math.min(1, s.actionProgress + 1 / count + s.toolBonus.actionBonus);
    set({ actionProgress: next });
    if (next >= 1) completeStage();
  },

  useTool: (toolId) => {
    const s = get();
    if (!s.isActive || s.step !== 'on_scene' || !s.incidentId) return;
    if (!useToolStore.getState().equippedTools.includes(toolId)) return;
    const t = nowSec();
    if ((s.toolCooldownUntil[toolId] ?? 0) > t) return; // still cooling down
    const def = getEditorTool(toolId);
    const stage = getStage(s.incidentId, s.stageIndex);
    // Burst applies on action stages; cooldown/active-window + VFX flash apply regardless of stage.
    const cooldown = def?.cooldownSec ?? 0;
    const duration = def?.useDurationSec ?? 0;
    set({
      toolCooldownUntil: { ...s.toolCooldownUntil, [toolId]: t + cooldown },
      toolActiveUntil: { ...s.toolActiveUntil, [toolId]: t + duration },
      lastToolFx: { color: def?.vfxColor ?? '#38bdf8', id: (s.lastToolFx?.id ?? 0) + 1 },
    });
    playSfx('ability');
    if (stage?.type === 'action') {
      const next = Math.min(1, get().actionProgress + TOOL_BURST + s.toolBonus.actionBonus);
      set({ actionProgress: next });
      if (next >= 1) completeStage();
    }
  },

  markWaypoint: (idx) => {
    const s = get();
    if (!s.isActive || s.step !== 'on_scene') return;
    if (s.waypointsFound[idx]) return;
    const updated = s.waypointsFound.map((v, i) => (i === idx ? true : v));
    set({ waypointsFound: updated });
    if (updated.every(Boolean)) completeStage();
  },

  confirmSuccess: () => {
    const s = get();
    if (s.step === 'success') set({ step: 'debrief' });
  },

  dismissDebrief: () => {
    const s = get();
    if (!s.incidentId) return;
    const def = getEditorIncident(s.incidentId);
    if (def) {
      if (def.reward.exp) useProgressionStore.getState().addExp(def.reward.exp);
      if (def.reward.coins) useWalletStore.getState().addCoins(def.reward.coins);
      def.reward.flags?.forEach((f) => {
        if (f.startsWith('trust:')) {
          const parts = f.split(':');
          const charId = parts[1];
          const amount = parseInt(parts[2], 10);
          if (charId && !isNaN(amount)) {
            useRelationshipStore.getState().increaseTrust(charId, amount);
          }
        } else {
          useFlagStore.getState().setFlag(f);
        }
      });
      useIncidentStore.getState().resolveIncident(def.id);
      // Progression: count the rescue toward the license, and award research points for Jin's station
      // (a base point + the incident's configured bonus).
      useRescueLicenseStore.getState().recordRescue();
      useJinResearchStore.getState().addPoints(1 + (def.rewardResearchPoints ?? 0));
    }
    set({
      isActive: false,
      incidentId: null,
      stageIndex: 0,
      step: 'on_scene',
      actionProgress: 0,
      waypointsFound: [],
      timeLeft: 0,
      retryCount: 0,
      toolCooldownUntil: {},
      toolActiveUntil: {},
    });
  },

  retryStage: () => {
    const s = get();
    if (!s.incidentId) return;
    const stage = getStage(s.incidentId, s.stageIndex);
    if (!stage) return;
    set({
      step: 'on_scene',
      actionProgress: 0,
      waypointsFound: stage.type === 'waypoints'
        ? new Array(stage.waypointPositions?.length ?? 0).fill(false)
        : [],
      timeLeft: (stage.timeLimitSeconds ?? 0) + s.toolBonus.timeBonus,
      retryCount: s.retryCount + 1,
    });
  },

  cancelRescue: () =>
    set({
      isActive: false,
      incidentId: null,
      stageIndex: 0,
      step: 'on_scene',
      actionProgress: 0,
      waypointsFound: [],
      timeLeft: 0,
      retryCount: 0,
      toolBonus: ZERO_BONUS,
      toolCooldownUntil: {},
      toolActiveUntil: {},
      lastToolFx: null,
    }),

  getWaypointRadius: () => {
    const s = get();
    return 2.5 + s.toolBonus.radiusBonus;
  },
  };
});
