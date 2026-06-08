import { create } from 'zustand';
import { POLI_INCIDENTS } from '../data/incidents/broomsTownIncidents';
import { useIncidentStore } from './incidentStore';
import { useProgressionStore } from './progressionStore';
import { useRelationshipStore } from './relationshipStore';
import { useFlagStore } from './flagStore';
import type { RescuePipelineStep } from '../types/incident';

interface RescueOperationState {
  isActive: boolean;
  incidentId: string | null;
  stageIndex: number;
  step: RescuePipelineStep;
  actionProgress: number;
  waypointsFound: boolean[];
  timeLeft: number;
  retryCount: number;

  startRescue: (incidentId: string) => void;
  tick: (dt: number) => void;
  pressAction: () => void;
  markWaypoint: (idx: number) => void;
  confirmSuccess: () => void;
  dismissDebrief: () => void;
  retryStage: () => void;
  cancelRescue: () => void;
}

function getStage(incidentId: string, stageIndex: number) {
  return POLI_INCIDENTS.find((d) => d.id === incidentId)?.stages[stageIndex] ?? null;
}

export const useRescueOperationStore = create<RescueOperationState>((set, get) => ({
  isActive: false,
  incidentId: null,
  stageIndex: 0,
  step: 'on_scene',
  actionProgress: 0,
  waypointsFound: [],
  timeLeft: 0,
  retryCount: 0,

  startRescue: (incidentId) => {
    const stage = getStage(incidentId, 0);
    if (!stage) return;
    set({
      isActive: true,
      incidentId,
      stageIndex: 0,
      step: 'on_scene',
      actionProgress: 0,
      waypointsFound: stage.type === 'waypoints'
        ? new Array(stage.waypointPositions?.length ?? 0).fill(false)
        : [],
      timeLeft: stage.timeLimitSeconds ?? 0,
      retryCount: 0,
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
    const next = Math.min(1, s.actionProgress + 1 / count);
    set({ actionProgress: next });
    if (next >= 1) set({ step: 'success' });
  },

  markWaypoint: (idx) => {
    const s = get();
    if (!s.isActive || s.step !== 'on_scene') return;
    if (s.waypointsFound[idx]) return;
    const updated = s.waypointsFound.map((v, i) => (i === idx ? true : v));
    set({ waypointsFound: updated });
    if (updated.every(Boolean)) set({ step: 'success' });
  },

  confirmSuccess: () => {
    const s = get();
    if (s.step === 'success') set({ step: 'debrief' });
  },

  dismissDebrief: () => {
    const s = get();
    if (!s.incidentId) return;
    const def = POLI_INCIDENTS.find((d) => d.id === s.incidentId);
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
      timeLeft: stage.timeLimitSeconds ?? 0,
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
    }),
}));
