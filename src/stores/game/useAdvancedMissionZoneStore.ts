import { create } from 'zustand';
import type { MissionZoneStatus, ZoneConditionProgress } from '../../types/game/advancedMissionZone';

// Runtime progress for the active Advanced Mission Zone. This is a bespoke runtime store (NOT an editor
// collection): the director mutates it through actions; React UI only reads / calls actions. World events
// the evaluator needs (interactions, area clears) are recorded here so the evaluator stays pure.
interface AdvancedMissionZoneState {
  activeZoneId?: string;
  activeSegmentId?: string;

  completedSegmentIds: string[];
  unlockedSegmentIds: string[];
  failedSegmentIds: string[];

  currentConditionProgress: Record<string, ZoneConditionProgress>;

  // World event tracking (fed to the pure evaluator).
  interactedObjectIds: string[];
  clearedAreaIds: string[];

  // Batch E — support-combat events (fed to the evaluator for support-* conditions).
  usedSupportAbilityIds: string[];
  supportRepairedDeviceIds: string[];
  supportClearedObstacleIds: string[];
  supportScannedTargetIds: string[];
  protectedAreaSeconds: Record<string, number>;

  // Batch F — boss-encounter events (fed to the evaluator for boss-* conditions).
  defeatedBossIds: string[];
  completedBossPhaseIds: string[];
  destroyedBossWeakpointIds: string[];
  clearedBossWaveIds: string[];

  zoneStartedAtMs?: number;
  segmentStartedAtMs?: number;

  lastCompletedSegmentId?: string;
  pendingNextSegmentIds: string[];

  missionZoneStatus: MissionZoneStatus;

  debug: {
    godMode: boolean;
    forceUnlockAllSegments: boolean;
    allowManualComplete: boolean;
  };

  // --- actions ---
  startZone: (zoneId: string, startSegmentId: string, allSegmentIds: string[], nowMs?: number) => void;
  enterSegment: (segmentId: string, nowMs?: number) => void;
  markSegmentComplete: (segmentId: string) => void;
  unlockSegment: (segmentId: string) => void;
  setConditionProgress: (conditionId: string, progress: ZoneConditionProgress) => void;
  setPendingNext: (segmentIds: string[]) => void;
  completeZone: () => void;
  setStatus: (status: MissionZoneStatus) => void;
  resetZone: () => void;

  recordInteraction: (objectId: string) => void;
  recordAreaCleared: (areaId: string) => void;

  recordSupportEvent: (kind: 'use-support-ability' | 'support-repair-device' | 'support-clear-obstacle' | 'support-scan-target', id: string) => void;
  addProtectedAreaSeconds: (areaId: string, seconds: number) => void;

  recordBossEvent: (kind: 'defeat-boss' | 'complete-boss-phase' | 'destroy-boss-weakpoint' | 'clear-boss-summon-wave', id: string) => void;

  setDebug: (patch: Partial<AdvancedMissionZoneState['debug']>) => void;
}

const INITIAL = {
  activeZoneId: undefined,
  activeSegmentId: undefined,
  completedSegmentIds: [] as string[],
  unlockedSegmentIds: [] as string[],
  failedSegmentIds: [] as string[],
  currentConditionProgress: {} as Record<string, ZoneConditionProgress>,
  interactedObjectIds: [] as string[],
  clearedAreaIds: [] as string[],
  usedSupportAbilityIds: [] as string[],
  supportRepairedDeviceIds: [] as string[],
  supportClearedObstacleIds: [] as string[],
  supportScannedTargetIds: [] as string[],
  protectedAreaSeconds: {} as Record<string, number>,
  defeatedBossIds: [] as string[],
  completedBossPhaseIds: [] as string[],
  destroyedBossWeakpointIds: [] as string[],
  clearedBossWaveIds: [] as string[],
  zoneStartedAtMs: undefined as number | undefined,
  segmentStartedAtMs: undefined as number | undefined,
  lastCompletedSegmentId: undefined as string | undefined,
  pendingNextSegmentIds: [] as string[],
  missionZoneStatus: 'inactive' as MissionZoneStatus,
  // God mode default ON (testing build). NOTE: zone god-mode auto-completes segments — toggle OFF in the
  // God Mode panel to actually fight encounters.
  debug: { godMode: true, forceUnlockAllSegments: false, allowManualComplete: true },
};

const now = (nowMs?: number) => nowMs ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const useAdvancedMissionZoneStore = create<AdvancedMissionZoneState>((set, get) => ({
  ...INITIAL,

  startZone: (zoneId, startSegmentId, allSegmentIds, nowMs) =>
    set({
      ...INITIAL,
      activeZoneId: zoneId,
      activeSegmentId: startSegmentId,
      unlockedSegmentIds: get().debug.forceUnlockAllSegments ? [...allSegmentIds] : [startSegmentId],
      missionZoneStatus: 'active',
      zoneStartedAtMs: now(nowMs),
      segmentStartedAtMs: now(nowMs),
      // preserve debug flags across a fresh start
      debug: get().debug,
    }),

  enterSegment: (segmentId, nowMs) =>
    set((s) => ({
      activeSegmentId: segmentId,
      segmentStartedAtMs: now(nowMs),
      currentConditionProgress: {},
      missionZoneStatus: 'active',
      unlockedSegmentIds: s.unlockedSegmentIds.includes(segmentId) ? s.unlockedSegmentIds : [...s.unlockedSegmentIds, segmentId],
    })),

  markSegmentComplete: (segmentId) =>
    set((s) => ({
      completedSegmentIds: s.completedSegmentIds.includes(segmentId) ? s.completedSegmentIds : [...s.completedSegmentIds, segmentId],
      lastCompletedSegmentId: segmentId,
      missionZoneStatus: 'segment-complete',
    })),

  unlockSegment: (segmentId) =>
    set((s) => ({ unlockedSegmentIds: s.unlockedSegmentIds.includes(segmentId) ? s.unlockedSegmentIds : [...s.unlockedSegmentIds, segmentId] })),

  setConditionProgress: (conditionId, progress) =>
    set((s) => ({ currentConditionProgress: { ...s.currentConditionProgress, [conditionId]: progress } })),

  setPendingNext: (segmentIds) => set({ pendingNextSegmentIds: segmentIds }),

  completeZone: () => set({ missionZoneStatus: 'complete' }),

  setStatus: (missionZoneStatus) => set({ missionZoneStatus }),

  resetZone: () => set({ ...INITIAL, debug: get().debug }),

  recordInteraction: (objectId) =>
    set((s) => (s.interactedObjectIds.includes(objectId) ? s : { interactedObjectIds: [...s.interactedObjectIds, objectId] })),

  recordAreaCleared: (areaId) =>
    set((s) => (s.clearedAreaIds.includes(areaId) ? s : { clearedAreaIds: [...s.clearedAreaIds, areaId] })),

  recordSupportEvent: (kind, id) =>
    set((s) => {
      const key = kind === 'use-support-ability' ? 'usedSupportAbilityIds'
        : kind === 'support-repair-device' ? 'supportRepairedDeviceIds'
        : kind === 'support-clear-obstacle' ? 'supportClearedObstacleIds'
        : 'supportScannedTargetIds';
      const list = s[key];
      return list.includes(id) ? s : ({ [key]: [...list, id] } as Partial<AdvancedMissionZoneState>);
    }),

  addProtectedAreaSeconds: (areaId, seconds) =>
    set((s) => ({ protectedAreaSeconds: { ...s.protectedAreaSeconds, [areaId]: (s.protectedAreaSeconds[areaId] ?? 0) + seconds } })),

  recordBossEvent: (kind, id) =>
    set((s) => {
      const key = kind === 'defeat-boss' ? 'defeatedBossIds'
        : kind === 'complete-boss-phase' ? 'completedBossPhaseIds'
        : kind === 'destroy-boss-weakpoint' ? 'destroyedBossWeakpointIds'
        : 'clearedBossWaveIds';
      const list = s[key];
      return list.includes(id) ? s : ({ [key]: [...list, id] } as Partial<AdvancedMissionZoneState>);
    }),

  setDebug: (patch) => set((s) => ({ debug: { ...s.debug, ...patch } })),
}));
