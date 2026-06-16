import { create } from 'zustand';
import type { IncidentRuntimeState, IncidentRuntimeStatus, IncidentRuntimeDebug } from '../types/incidentRuntimeTypes';
import type { IncidentPlan } from '../types/aiIncidentTypes';
import type { IncidentReplayEvent, IncidentReplayData } from '../types/incidentReplayTypes';

// Active-incident runtime store (Batch G). Holds the validated plan + IncidentRuntimeState + saved replays.
// Mutated only by the incident runtime modules through these actions; React UI reads it.
const FRESH = (): IncidentRuntimeState => ({
  activeIncidentId: undefined,
  activeTemplateId: undefined,
  status: 'inactive',
  currentStageIndex: 0,
  completedObjectiveStepIds: [],
  failedObjectiveStepIds: [],
  appliedStateChangeIds: [],
  dangerLevel: 0,
  startedAt: undefined,
  updatedAt: undefined,
  completedAt: undefined,
  timeRemainingSeconds: undefined,
  currentEscalationLevel: 0,
  replayEvents: [],
  validationErrors: [],
  debug: { forceComplete: false, freezeEscalation: false, showAffectedArea: true, showStateChanges: true },
});

interface IncidentRuntimeStore {
  runtime: IncidentRuntimeState;
  plan?: IncidentPlan;
  candidatePlan?: IncidentPlan; // generated-but-not-applied (debug)
  savedReplays: IncidentReplayData[];

  setCandidate: (plan: IncidentPlan | undefined, validationErrors?: string[]) => void;
  setPlan: (plan: IncidentPlan | undefined) => void;
  patch: (p: Partial<IncidentRuntimeState>) => void;
  setStatus: (status: IncidentRuntimeStatus) => void;
  addCompletedObjective: (id: string) => void;
  addFailedObjective: (id: string) => void;
  addAppliedChange: (id: string) => void;
  addReplayEvent: (e: IncidentReplayEvent) => void;
  setDebug: (p: Partial<IncidentRuntimeDebug>) => void;
  saveReplay: (data: IncidentReplayData) => void;
  reset: () => void;
}

const uniqPush = (arr: string[], id: string) => (arr.includes(id) ? arr : [...arr, id]);

export const useIncidentRuntimeStore = create<IncidentRuntimeStore>((set) => ({
  runtime: FRESH(),
  plan: undefined,
  candidatePlan: undefined,
  savedReplays: [],

  setCandidate: (plan, validationErrors = []) => set((s) => ({ candidatePlan: plan, runtime: { ...s.runtime, validationErrors, status: validationErrors.length ? 'validation-failed' : plan ? 'ready' : s.runtime.status } })),
  setPlan: (plan) => set({ plan }),
  patch: (p) => set((s) => ({ runtime: { ...s.runtime, ...p, updatedAt: Date.now() } })),
  setStatus: (status) => set((s) => ({ runtime: { ...s.runtime, status, updatedAt: Date.now() } })),
  addCompletedObjective: (id) => set((s) => ({ runtime: { ...s.runtime, completedObjectiveStepIds: uniqPush(s.runtime.completedObjectiveStepIds, id) } })),
  addFailedObjective: (id) => set((s) => ({ runtime: { ...s.runtime, failedObjectiveStepIds: uniqPush(s.runtime.failedObjectiveStepIds, id) } })),
  addAppliedChange: (id) => set((s) => ({ runtime: { ...s.runtime, appliedStateChangeIds: uniqPush(s.runtime.appliedStateChangeIds, id) } })),
  addReplayEvent: (e) => set((s) => ({ runtime: { ...s.runtime, replayEvents: [...s.runtime.replayEvents, e] } })),
  setDebug: (p) => set((s) => ({ runtime: { ...s.runtime, debug: { ...s.runtime.debug, ...p } } })),
  saveReplay: (data) => set((s) => ({ savedReplays: [data, ...s.savedReplays].slice(0, 20) })),
  reset: () => set({ runtime: FRESH(), plan: undefined, candidatePlan: undefined }),
}));
