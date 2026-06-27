import { create } from 'zustand';
import type { StageRuntimeState } from '../../types/stageProgressionTypes';

export const DEFAULT_STAGE_RUNTIME_STATE: StageRuntimeState = {
  status: 'inactive',
  completedStageIds: [],
  unlockedStageIds: [],
  completedObjectiveIds: [],
  failedObjectiveIds: [],
  activeEncounterIds: [],
  completedEncounterIds: [],
  activeIncidentIds: [],
  completedIncidentIds: [],
  score: { score: 0, objectivesCompleted: 0, encountersCleared: 0, incidentsResolved: 0, bossesDefeated: 0, elapsedSeconds: 0 },
  rewardsPending: false,
  debug: { unlockAllStages: false, allowJumpToStage: true, allowForceClear: true, godMode: false },
};

interface StageProgressionStore extends StageRuntimeState {
  setRuntime: (patch: Partial<StageRuntimeState>) => void;
  setStatus: (status: StageRuntimeState['status']) => void;
  startCampaign: (campaignId: string, unlockedStageIds: string[]) => void;
  startStageBriefing: (stageId: string, campaignId?: string, levelLayoutId?: string) => void;
  enterStage: (stageId: string, levelLayoutId: string, startSegmentId: string) => void;
  setActiveSegment: (segmentId: string) => void;
  completeObjective: (objectiveId: string) => void;
  failObjective: (objectiveId: string) => void;
  activateEncounter: (encounterId: string) => void;
  completeEncounter: (encounterId: string) => void;
  activateIncident: (incidentId: string) => void;
  completeIncident: (incidentId: string) => void;
  completeActiveStage: () => void;
  failActiveStage: () => void;
  unlockStage: (stageId: string) => void;
  claimRewards: () => void;
  resetRuntime: () => void;
}

const addUnique = (items: string[], id: string) => (items.includes(id) ? items : [...items, id]);
const removeId = (items: string[], id: string) => items.filter((item) => item !== id);

export const useStageProgressionStore = create<StageProgressionStore>((set, get) => ({
  ...DEFAULT_STAGE_RUNTIME_STATE,
  setRuntime: (patch) => set(patch),
  setStatus: (status) => set({ status }),
  startCampaign: (campaignId, unlockedStageIds) => set({ activeCampaignId: campaignId, unlockedStageIds, status: 'briefing' }),
  startStageBriefing: (stageId, campaignId, levelLayoutId) => set({
    activeCampaignId: campaignId ?? get().activeCampaignId,
    activeStageId: stageId,
    activeLevelLayoutId: levelLayoutId,
    status: 'briefing',
    completedObjectiveIds: [],
    failedObjectiveIds: [],
    activeEncounterIds: [],
    completedEncounterIds: [],
    activeIncidentIds: [],
    completedIncidentIds: [],
    rewardsPending: false,
    stageStartedAt: undefined,
    stageCompletedAt: undefined,
    score: { score: 0, objectivesCompleted: 0, encountersCleared: 0, incidentsResolved: 0, bossesDefeated: 0, elapsedSeconds: 0 },
  }),
  enterStage: (stageId, levelLayoutId, startSegmentId) => set({
    activeStageId: stageId,
    activeLevelLayoutId: levelLayoutId,
    activeSegmentId: startSegmentId,
    status: 'playing',
    stageStartedAt: Date.now(),
  }),
  setActiveSegment: (segmentId) => set({ activeSegmentId: segmentId }),
  completeObjective: (objectiveId) => set((state) => ({
    completedObjectiveIds: addUnique(state.completedObjectiveIds, objectiveId),
    failedObjectiveIds: removeId(state.failedObjectiveIds, objectiveId),
    score: { ...state.score, objectivesCompleted: state.score.objectivesCompleted + (state.completedObjectiveIds.includes(objectiveId) ? 0 : 1) },
  })),
  failObjective: (objectiveId) => set((state) => ({ failedObjectiveIds: addUnique(state.failedObjectiveIds, objectiveId) })),
  activateEncounter: (encounterId) => set((state) => ({ activeEncounterIds: addUnique(state.activeEncounterIds, encounterId) })),
  completeEncounter: (encounterId) => set((state) => ({
    activeEncounterIds: removeId(state.activeEncounterIds, encounterId),
    completedEncounterIds: addUnique(state.completedEncounterIds, encounterId),
  })),
  activateIncident: (incidentId) => set((state) => ({ activeIncidentIds: addUnique(state.activeIncidentIds, incidentId) })),
  completeIncident: (incidentId) => set((state) => ({
    activeIncidentIds: removeId(state.activeIncidentIds, incidentId),
    completedIncidentIds: addUnique(state.completedIncidentIds, incidentId),
  })),
  completeActiveStage: () => set((state) => ({
    status: 'stage-clear',
    stageCompletedAt: Date.now(),
    completedStageIds: state.activeStageId ? addUnique(state.completedStageIds, state.activeStageId) : state.completedStageIds,
    rewardsPending: true,
    score: { ...state.score, grade: state.score.grade ?? 'A' },
  })),
  failActiveStage: () => set({ status: 'stage-failed' }),
  unlockStage: (stageId) => set((state) => ({ unlockedStageIds: addUnique(state.unlockedStageIds, stageId) })),
  claimRewards: () => set({ rewardsPending: false, status: 'returning-to-base' }),
  resetRuntime: () => set({ ...DEFAULT_STAGE_RUNTIME_STATE }),
}));
