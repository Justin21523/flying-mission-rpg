import { create } from 'zustand';
import { getEditorIncident } from './editorIncidentStore';
import { useIncidentStore } from './incidentStore';
import { useProgressionStore } from './progressionStore';
import { useRelationshipStore } from './relationshipStore';
import { useFlagStore } from './flagStore';
import { useToolStore } from './toolStore';
import type { RescuePipelineStep } from '../types/incident';

interface ToolBonus {
  actionBonus: number;
  timeBonus: number;
  radiusBonus: number;
}

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

  startRescue: (incidentId: string) => void;
  tick: (dt: number) => void;
  pressAction: () => void;
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
      set({
        stageIndex: nextIdx,
        step: 'on_scene',
        actionProgress: 0,
        waypointsFound: stage?.type === 'waypoints'
          ? new Array(stage.waypointPositions?.length ?? 0).fill(false)
          : [],
        timeLeft: (stage?.timeLimitSeconds ?? 0) + s.toolBonus.timeBonus,
      });
    } else {
      set({ step: 'success' });
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

  startRescue: (incidentId) => {
    const stage = getStage(incidentId, 0);
    if (!stage) return;
    const toolBonus = useToolStore.getState().getActiveBonus(incidentId);
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
    });
  },

  tick: (dt) => {
    const s = get();
    if (!s.isActive || s.step !== 'on_scene' || !s.incidentId) return;
    const stage = getStage(s.incidentId, s.stageIndex);
    if (!stage || stage.type !== 'action') return;
    const timeLeft = Math.max(0, s.timeLeft - dt);
    set({ timeLeft });
    if (timeLeft <= 0) set({ step: 'retry' });
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
    }),

  getWaypointRadius: () => {
    const s = get();
    return 2.5 + s.toolBonus.radiusBonus;
  },
  };
});
